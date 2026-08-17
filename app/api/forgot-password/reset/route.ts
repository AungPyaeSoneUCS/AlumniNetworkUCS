// file: app/api/forgot-password/reset/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Otp from "@/models/Otp";

const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Invalid request data",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const email = parsed.data.email.trim().toLowerCase();
    const otp = parsed.data.otp.trim();
    const password = parsed.data.password;

    console.log("Reset Password Request:", {
      email,
      timestamp: new Date().toISOString(),
    });

    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "forgot-password", // Ensures it only uses public OTPs
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error: "Invalid or expired OTP.",
        },
        {
          status: 400,
        },
      );
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      await Otp.deleteMany({
        email,
        purpose: "forgot-password",
      });

      return NextResponse.json(
        {
          error:
            "This email is not registered in Alumni Network.",
        },
        {
          status: 404,
        },
      );
    }

    // STRICT PRIVILEGE GATE: Protect Admin & Staff accounts from public reset
    if (user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "staff") {
      // Purge the OTP immediately to prevent abuse
      await Otp.deleteMany({
        email,
        purpose: "forgot-password",
      });

      console.warn("⚠️ [SECURITY ALERT] Unauthorized Public Reset Attempted on High-Privilege Account:", { 
        email, 
        role: user.role 
      });

      return NextResponse.json(
        {
          error: "Staff and Admin accounts must use their dedicated portals for password recovery.",
        },
        {
          status: 403, // 403 Forbidden
        },
      );
    }

    // Cryptographic passkey rotation for regular user
    const hashedPassword = await bcrypt.hash(password, 12);

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    // Clean up used OTP records
    await Otp.deleteMany({
      email,
      purpose: "forgot-password",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Forgot Password Reset Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while resetting password.",
      },
      {
        status: 500,
      },
    );
  }
}