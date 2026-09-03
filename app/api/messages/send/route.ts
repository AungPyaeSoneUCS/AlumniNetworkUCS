// file: app/api/messages/send/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";

import User from "@/models/User";
import Message from "@/models/Message";
import Notification from "@/models/Notification";

function getConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("-");
}

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

function cleanNotification(notification: any) {
  return {
    _id: String(notification?._id || ""),
    type: notification?.type || "message",
    title: notification?.title || "",
    body: notification?.body || "",
    link: notification?.link || "/messages",
    read: Boolean(notification?.read),
    createdAt: notification?.createdAt || null,
    sender: cleanUser(notification?.sender),
  };
}

export async function POST(req: Request) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const receiverId = String(body.receiverId || "").trim();
    const text = String(body.text || "").trim();

    if (!receiverId || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(receiverId)) {
      return NextResponse.json({ error: "Invalid receiver id" }, { status: 400 });
    }

    await connectDB();

    // Identify current user either by Mobile Header ID or Web Session Email
    let currentUser: any = null;
    
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id name email image department graduatedYear");
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id name email image department graduatedYear");
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(currentUser._id) === receiverId) {
      return NextResponse.json(
        { error: "You cannot message yourself" },
        { status: 400 }
      );
    }

    const receiver: any = await User.findById(receiverId).select(
      "_id name email image department graduatedYear"
    );

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const createdMessage = await Message.create({
      sender: currentUser._id,
      receiver: receiver._id,
      text,
      seen: false,
    });

    const populatedMessage = await Message.findById(createdMessage._id)
      .populate("sender", "name email image department graduatedYear")
      .populate("receiver", "name email image department graduatedYear")
      .lean();

    const message = cleanMessage(populatedMessage);

    const conversationId = getConversationId(
      String(currentUser._id),
      String(receiver._id)
    );

    await pusherServer.trigger(`chat-${conversationId}`, "new-message", message);

    const createdNotification = await Notification.create({
      receiver: receiver._id,
      sender: currentUser._id,
      type: "message",
      title: `${currentUser.name || "Alumni"} sent you a message`,
      body: text.length > 90 ? `${text.slice(0, 90)}...` : text,
      link: `/messages?user=${String(currentUser._id)}`,
      read: false,
    });

    const populatedNotification = await Notification.findById(
      createdNotification._id
    )
      .populate("sender", "name email image department graduatedYear")
      .lean();

    const notification = cleanNotification(populatedNotification);

    await pusherServer.trigger(
      `notifications-${String(receiver._id)}`,
      "new-notification",
      notification
    );

    return NextResponse.json({
      success: true,
      message,
      notification,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}