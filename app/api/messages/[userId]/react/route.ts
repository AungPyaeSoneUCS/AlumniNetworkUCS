// file: app/api/messages/[userId]/react/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { getUsersByIds, isValidId, parseList, serializeList } from "@/lib/db";

function cleanUser(user: any) {
  return {
    _id: String(user?._id || user?.id || ""),
    name: user?.name || "Unknown Alumni",
    email: user?.email || "",
    image: user?.image || "",
    department: user?.department || "",
    graduatedYear: user?.graduatedYear || null,
  };
}

function cleanMessage(message: any) {
  return {
    _id: String(message?._id || message?.id || ""),
    text: message?.text || "",
    isDeleted: Boolean(message?.isDeleted),
    isEdited: Boolean(message?.isEdited),
    deletedBy: message?.deletedBy || "",
    seen: Boolean(message?.seen),
    createdAt: message?.createdAt || null,
    updatedAt: message?.updatedAt || null,
    sender: cleanUser(message?.sender),
    receiver: cleanUser(message?.receiver),
    reactions: (message?.reactions || []).map((r: any) => ({
      emoji: r.emoji,
      users: (r.users || []).map(String),
    })),
  };
}

function getConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("-");
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const mobileUserId =
      req.headers.get("x-user-id") ||
      req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    const { messageId, emoji } = await req.json();

    if (!isValidId(userId) || !isValidId(messageId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "Emoji required" }, { status: 400 });
    }

    let currentUser: any = null;
    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check user is part of this conversation
    const isParticipant =
      String(message.sender) === String(currentUser.id) ||
      String(message.receiver) === String(currentUser.id);

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Toggle reaction
    const existingReaction = await prisma.messageReaction.findFirst({
      where: { messageId, emoji },
      orderBy: { createdAt: "asc" },
    });

    if (existingReaction) {
      const reactionUsers = parseList(existingReaction.users);
      const userIndex = reactionUsers.findIndex(
        (u) => String(u) === String(currentUser.id)
      );

      if (userIndex > -1) {
        // User already reacted with this emoji — remove their reaction
        reactionUsers.splice(userIndex, 1);

        // If no users left for this emoji, remove the entire reaction entry
        if (reactionUsers.length === 0) {
          await prisma.messageReaction.deleteMany({
            where: { messageId, emoji },
          });
        } else {
          await prisma.messageReaction.update({
            where: { id: existingReaction.id },
            data: { users: serializeList(reactionUsers) },
          });
        }
      } else {
        // User reacting with a new emoji on this message
        reactionUsers.push(String(currentUser.id));
        await prisma.messageReaction.update({
          where: { id: existingReaction.id },
          data: { users: serializeList(reactionUsers) },
        });
      }
    } else {
      // No reaction with this emoji yet — add new
      await prisma.messageReaction.create({
        data: {
          messageId,
          emoji,
          users: serializeList([String(currentUser.id)]),
        },
      });
    }

    const reactionRows = await prisma.messageReaction.findMany({
      where: { messageId },
      orderBy: { createdAt: "asc" },
    });

    const messageUsers = await getUsersByIds([message.sender, message.receiver]);

    const cleanedPayload = cleanMessage({
      ...message,
      sender: messageUsers.get(message.sender),
      receiver: messageUsers.get(message.receiver),
      reactions: reactionRows.map((r) => ({
        emoji: r.emoji,
        users: parseList(r.users),
      })),
    });

    // Broadcast via Pusher
    const convoId = getConversationId(
      String(message.sender),
      String(message.receiver)
    );

    await pusherServer.trigger(
      `chat-${convoId}`,
      "message-reaction",
      cleanedPayload
    );

    return NextResponse.json(cleanedPayload);
  } catch (error) {
    console.error("React to message error:", error);
    return NextResponse.json(
      { error: "Failed to react" },
      { status: 500 }
    );
  }
}
