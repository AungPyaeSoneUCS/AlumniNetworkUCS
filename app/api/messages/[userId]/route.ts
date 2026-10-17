// file: app/api/messages/[userId]/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUsersByIds, isValidId, parseList } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";

function cleanUser(user: any) {
  return {
    _id: String(user?._id || user?.id || ""),
    name: user?.name || "Unknown Alumni",
    email: user?.email || "",
    role: user?.role || "user",
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

async function hydrateMessages(messages: any[]) {
  const messageIds = messages.map((m) => m.id);
  const userIds: string[] = [];
  for (const m of messages) {
    userIds.push(m.sender, m.receiver);
  }

  const usersMap = await getUsersByIds(userIds);
  const reactionRows = messageIds.length
    ? await prisma.messageReaction.findMany({
        where: { messageId: { in: messageIds } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const reactionsByMessage: Record<string, { emoji: string; users: string[] }[]> = {};
  for (const row of reactionRows) {
    if (!reactionsByMessage[row.messageId]) reactionsByMessage[row.messageId] = [];
    reactionsByMessage[row.messageId].push({
      emoji: row.emoji,
      users: parseList(row.users),
    });
  }

  return messages.map((row) =>
    cleanMessage({
      ...row,
      sender: usersMap.get(row.sender),
      receiver: usersMap.get(row.receiver),
      reactions: reactionsByMessage[row.id] || [],
    })
  );
}

// 1. GET: FETCH ALL MESSAGES
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;

    if (!isValidId(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    // Identify current user
    let currentUser: any = null;
    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true, name: true, email: true, role: true, image: true, graduatedYear: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, role: true, image: true, graduatedYear: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender: currentUser.id, receiver: userId },
          { sender: userId, receiver: currentUser.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    const cleanedMessages = await hydrateMessages(messages);

    return NextResponse.json(cleanedMessages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// 2. PATCH: EDIT MESSAGE TEXT
export async function PATCH(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    const { messageId, newText } = await req.json();

    if (!isValidId(userId) || !isValidId(messageId)) {
      return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
    }

    if (!newText || !newText.trim()) {
      return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
    }

    // Identify current user
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

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    // Ensure strictly the author can edit their own message
    if (String(message.sender) !== String(currentUser.id)) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own messages" }, { status: 403 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: "Cannot edit a deleted message" }, { status: 400 });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: newText.trim(),
        isEdited: true,
      },
    });

    const cleanedPayload = (await hydrateMessages([updatedMessage]))[0];

    // Broadcast instant update via Pusher
    const convoId = getConversationId(String(currentUser.id), userId);
    if (pusherServer) {
      await pusherServer.trigger(`chat-${convoId}`, "new-message", cleanedPayload);
    }

    return NextResponse.json(cleanedPayload);
  } catch (error) {
    console.error("Edit message error:", error);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

// 3. DELETE: SOFT DELETE MESSAGE (Telegram / Viber style)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    const messageId = new URL(req.url).searchParams.get("messageId");

    if (!isValidId(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    if (!messageId || !isValidId(messageId)) {
      return NextResponse.json({ error: "Invalid message id" }, { status: 400 });
    }

    // Identify current user
    let currentUser: any = null;
    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true, name: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = await prisma.message.findUnique({ where: { id: messageId } });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Ensure only the sender can delete their message
    if (String(message.sender) !== String(currentUser.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleterName = currentUser.name || "User";

    // Soft-delete mutation
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: `${deleterName} deleted this message.`,
        isDeleted: true,
        deletedBy: deleterName,
      },
    });

    const cleanedPayload = (await hydrateMessages([deletedMessage]))[0];

    // Broadcast instant ghost update via Pusher
    const convoId = getConversationId(String(currentUser.id), userId);
    if (pusherServer) {
      await pusherServer.trigger(`chat-${convoId}`, "new-message", cleanedPayload);
    }

    return NextResponse.json({
      success: true,
      message: cleanedPayload,
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
