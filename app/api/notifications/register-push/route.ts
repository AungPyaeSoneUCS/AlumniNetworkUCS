// file: app/api/notifications/register-push/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import PushToken from "@/models/PushToken";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { expoPushToken, platform } = body;

    if (!expoPushToken || typeof expoPushToken !== "string") {
      return NextResponse.json({ error: "expoPushToken is required" }, { status: 400 });
    }

    await connectDB();

    let currentUser: any = null;
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id").lean();
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert the push token for this user (remove stale tokens for same user+token)
    await PushToken.updateOne(
      { user: currentUser._id, expoPushToken },
      { $set: { user: currentUser._id, expoPushToken, platform: platform || "android" } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST register-push error:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}
