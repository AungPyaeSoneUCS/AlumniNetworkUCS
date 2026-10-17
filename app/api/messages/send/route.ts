// file: app/api/messages/send/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { getUsersByIds, isValidId, parseList } from "@/lib/db";

function getConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("-");
}

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
    _id: String(notification?._id || notification?.id || ""),
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

    if (!isValidId(receiverId)) {
      return NextResponse.json({ error: "Invalid receiver id" }, { status: 400 });
    }

    // Identify current user either by Mobile Header ID or Web Session Email
    let currentUser: any = null;

    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true, name: true, email: true, image: true, graduatedYear: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, image: true, graduatedYear: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (String(currentUser.id) === receiverId) {
      return NextResponse.json(
        { error: "You cannot message yourself" },
        { status: 400 }
      );
    }

    const receiver: any = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, email: true, image: true, graduatedYear: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
    }

    const createdMessage = await prisma.message.create({
      data: {
        sender: currentUser.id,
        receiver: receiver.id,
        text,
        seen: false,
      },
    });

    const messageUsers = await getUsersByIds([
      createdMessage.sender,
      createdMessage.receiver,
    ]);
    const reactionRows = await prisma.messageReaction.findMany({
      where: { messageId: createdMessage.id },
      orderBy: { createdAt: "asc" },
    });

    const message = cleanMessage({
      ...createdMessage,
      sender: messageUsers.get(createdMessage.sender),
      receiver: messageUsers.get(createdMessage.receiver),
      reactions: reactionRows.map((r) => ({
        emoji: r.emoji,
        users: parseList(r.users),
      })),
    });

    const conversationId = getConversationId(
      String(currentUser.id),
      String(receiver.id)
    );

    await pusherServer.trigger(`chat-${conversationId}`, "new-message", message);

    const createdNotification = await prisma.notification.create({
      data: {
        receiver: receiver.id,
        sender: currentUser.id,
        type: "message",
        title: `${currentUser.name || "Alumni"} sent you a message`,
        body: text.length > 90 ? `${text.slice(0, 90)}...` : text,
        link: `/messages?user=${String(currentUser.id)}`,
        read: false,
      },
    });

    const notificationSenders = await getUsersByIds([currentUser.id]);

    const notification = cleanNotification({
      ...createdNotification,
      sender: notificationSenders.get(currentUser.id),
    });

    await pusherServer.trigger(
      `notifications-${String(receiver.id)}`,
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
