// file: app/api/me/change-password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .regex(/[A-Z]/, "New password must contain at least one uppercase letter")
    .regex(/[a-z]/, "New password must contain at least one lowercase letter")
    .regex(/\d/, "New password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
});

// ----------------------------------------------------
// DUAL AUTHENTICATION HELPER (Web Cookies or Mobile Headers)
// ----------------------------------------------------
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers (x-user-id or Authorization)
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && mongoose.Types.ObjectId.isValid(mobileHeaderId)) {
    const user = await User.findById(mobileHeaderId).lean();
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email }).lean();
      if (user) return user;
    }
  } catch {
    // No active web session
  }

  return null;
}

// ==========================================
// POST: Change Logged-in User's Password
// ==========================================
export async function POST(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUser.role === "admin" || currentUser.role === "staff") {
      return NextResponse.json(
        { error: "Admin and Staff accounts must use their dedicated portal to change passwords." },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = parsed.data;

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    const user = await User.findById(currentUser._id).select("+password").lean();

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "This account has no password set. Please use another sign-in method." },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(currentUser._id, {
      $set: { password: hashedPassword },
    });

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/me/change-password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
