// file: app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function GET(req: Request) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Identify current user either by Mobile Header ID or Web Session Email
    let currentUser: any = null;
    
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id").lean();
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const notifications = await Notification.find({
      receiver: currentUser._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      receiver: currentUser._id,
      read: false,
    });

    return NextResponse.json({
      unreadCount,
      notifications: notifications.map((item: any) => ({
        _id: String(item._id),
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

    await connectDB();

    // Identify current user either by Mobile Header ID or Web Session Email
    let currentUser: any = null;
    
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id").lean();
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await Notification.updateMany(
      { receiver: currentUser._id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH notifications error:", error);

    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}