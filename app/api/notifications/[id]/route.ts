// file: app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Notification from "@/models/Notification";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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

    await Notification.findOneAndDelete({
      _id: id,
      receiver: currentUser._id,
    });

    return NextResponse.json({
      success: true,
      message: "Notification cleared only",
    });
  } catch (error) {
    console.error("Delete notification failed:", error);

    return NextResponse.json(
      { error: "Delete notification failed" },
      { status: 500 }
    );
  }
}