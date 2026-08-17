// file: app/api/messages/[userId]/route.ts

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";
import { pusherServer } from "@/lib/pusher";

function cleanUser(user: any) {
  return {
    _id: String(user?._id || ""),
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
  };
}

function getConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("-");
}

// 1. GET: FETCH ALL MESSAGES
export async function GET(
  _req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email,
    }).select("_id name email role image department graduatedYear");

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, receiver: userId },
        { sender: userId, receiver: currentUser._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email role image department graduatedYear")
      .populate("receiver", "name email role image department graduatedYear")
      .lean();

    return NextResponse.json(messages.map(cleanMessage));
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
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    const { messageId, newText } = await req.json();

    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
    }

    if (!newText || !newText.trim()) {
      return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email }).select("_id");
    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    // Ensure strictly the author can edit their own message
    if (String(message.sender) !== String(currentUser._id)) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own messages" }, { status: 403 });
    }

    if (message.isDeleted) {
      return NextResponse.json({ error: "Cannot edit a deleted message" }, { status: 400 });
    }

    message.text = newText.trim();
    message.isEdited = true;
    await message.save();

    // Re-populate to get full sender/receiver objects for the UI payload
    await message.populate([
      { path: "sender", select: "name email role image department graduatedYear" },
      { path: "receiver", select: "name email role image department graduatedYear" }
    ]);

    const cleanedPayload = cleanMessage(message.toObject());

    // Broadcast instant update via Pusher
    const convoId = getConversationId(String(currentUser._id), userId);
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
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    const messageId = new URL(req.url).searchParams.get("messageId");

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    if (!messageId || !Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid message id" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email,
    }).select("_id name");

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Ensure only the sender can delete their message
    if (String(message.sender) !== String(currentUser._id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deleterName = currentUser.name || "User";

    // Soft-delete mutation
    message.text = `${deleterName} deleted this message.`;
    message.isDeleted = true;
    message.deletedBy = deleterName;
    await message.save();

    await message.populate([
      { path: "sender", select: "name email role image department graduatedYear" },
      { path: "receiver", select: "name email role image department graduatedYear" }
    ]);

    const cleanedPayload = cleanMessage(message.toObject());

    // Broadcast instant ghost update via Pusher
    const convoId = getConversationId(String(currentUser._id), userId);
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