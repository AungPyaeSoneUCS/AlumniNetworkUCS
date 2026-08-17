// file: app/api/admin/forgot-password/reset/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Otp from "@/models/Otp";

const AdminResetPasswordSchema = z.object({
  email: z.string().email("Invalid administrative email format"),

  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Authorization token must be exactly 6 digits"),

  password: z
    .string()
    .min(8, "Executive passkey must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = AdminResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Malformed payload rejected.",
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

    console.log("🔒 [SECURITY AUDIT] Executive Override Request:", {
      targetEmail: email,
      timestamp: new Date().toISOString(),
    });

    // Enforce dedicated admin-only purpose string
    const otpRecord = await Otp.findOne({
      email,
      otp,
      purpose: "admin-forgot-password",
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        {
          error: "Invalid or expired Level-1 Authorization Token.",
        },
        {
          status: 400,
        },
      );
    }

    // STRICT PRIVILEGE GATE: Verify the email belongs to an active Administrator
    const user = await User.findOne({
      email,
    });

    // Check existence and enforce admin role
    if (!user || user.role?.toLowerCase() !== "admin") {
      // Purge any lingering OTPs to prevent brute-force attacks
      await Otp.deleteMany({
        email,
        purpose: "admin-forgot-password",
      });

      console.warn("⚠️ [SECURITY ALERT] Unauthorized Admin Override Attempted:", { email });

      return NextResponse.json(
        {
          error: "Access Denied: Identifier not associated with Executive Clearance.",
        },
        {
          status: 403, // 403 Forbidden is more accurate here than 404
        },
      );
    }

    // Cryptographic passkey rotation
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
      purpose: "admin-forgot-password",
    });

    console.log("✅ [SECURITY AUDIT] Executive Passkey Rotated Successfully:", { email });

    return NextResponse.json(
      {
        success: true,
        message: "Executive passkey updated. Clearance granted.",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "❌ [SYSTEM ERROR] Admin Credential Override Failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Cryptographic handshake failed during credential override.",
      },
      {
        status: 500,
      },
    );
  }
}