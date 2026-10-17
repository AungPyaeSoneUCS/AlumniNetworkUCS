// file: app/api/forgot-password/reset/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

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

    const email = parsed.data.email.trim().toLowerCase();
    const otp = parsed.data.otp.trim();
    const password = parsed.data.password;

    console.log("Reset Password Request:", {
      email,
      timestamp: new Date().toISOString(),
    });

    await prisma.otp.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        purpose: "forgot-password", // Ensures it only uses public OTPs
        expiresAt: {
          gt: new Date(),
        },
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

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await prisma.otp.deleteMany({
        where: {
          email,
          purpose: "forgot-password",
        },
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
      await prisma.otp.deleteMany({
        where: {
          email,
          purpose: "forgot-password",
        },
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    // Clean up used OTP records
    await prisma.otp.deleteMany({
      where: {
        email,
        purpose: "forgot-password",
      },
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