// file: app/api/notifications/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Identify current user either by Mobile Header ID or Web Session Email
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

    const notifications = await prisma.notification.findMany({
      where: { receiver: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const unreadCount = await prisma.notification.count({
      where: { receiver: currentUser.id, read: false },
    });

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map((item) => ({
        _id: String(item.id),
        type: item.type || "message",
        title: item.title || "",
        body: item.body || "",
        link: item.link || "/messages",
        read: Boolean(item.read),
        createdAt: item.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET notifications error:", error);

    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Identify current user either by Mobile Header ID or Web Session Email
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

    await prisma.notification.updateMany({
      where: { receiver: currentUser.id, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH notifications error:", error);

    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
