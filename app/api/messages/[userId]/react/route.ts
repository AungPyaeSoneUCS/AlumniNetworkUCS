// file: app/api/messages/[userId]/react/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import User from "@/models/User";
import Message from "@/models/Message";

function cleanUser(user: any) {
  return {
    _id: String(user?._id || ""),
    name: user?.name || "Unknown Alumni",
    email: user?.email || "",
    image: user?.image || "",
    department: user?.department || "",
    graduatedYear: user?.graduatedYear || null,
  };
}

function cleanMessage(message: any) {
  return {
    _id: String(message?._id || ""),
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

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    if (!emoji || typeof emoji !== "string") {
      return NextResponse.json({ error: "Emoji required" }, { status: 400 });
    }

    await connectDB();

    let currentUser: any = null;
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id");
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select(
        "_id"
      );
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check user is part of this conversation
    const isParticipant =
      String(message.sender) === String(currentUser._id) ||
      String(message.receiver) === String(currentUser._id);

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Toggle reaction
    const existingReaction = message.reactions.find(
      (r: any) => r.emoji === emoji
    );

    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(
        (u: any) => String(u) === String(currentUser._id)
      );

      if (userIndex > -1) {
        // User already reacted with this emoji — remove their reaction
        existingReaction.users.splice(userIndex, 1);

        // If no users left for this emoji, remove the entire reaction entry
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(
            (r: any) => r.emoji !== emoji
          );
        }
      } else {
        // User reacting with a new emoji on this message
        existingReaction.users.push(currentUser._id);
      }
    } else {
      // No reaction with this emoji yet — add new
      message.reactions.push({ emoji, users: [currentUser._id] });
    }

    await message.save();

    // Re-populate for full sender/receiver objects
    await message.populate([
      {
        path: "sender",
        select: "name email role image department graduatedYear",
      },
      {
        path: "receiver",
        select: "name email role image department graduatedYear",
      },
    ]);

    const cleanedPayload = cleanMessage(message.toObject());

    // Broadcast via Pusher
    const convoId = getConversationId(
      String(message.sender._id),
      String(message.receiver._id)
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
