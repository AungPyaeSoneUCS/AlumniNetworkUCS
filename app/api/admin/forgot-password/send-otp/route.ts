// file: app/api/admin/forgot-password/send-otp/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { sendMail } from "@/lib/mail";
import { otpTemplate } from "@/lib/emailTemplates";

import User from "@/models/User";
import Otp from "@/models/Otp";

type Lang = "en" | "mm";

const AdminForgotPasswordSchema = z.object({
  email: z.string().email("Valid administrative email is required"),
  lang: z.enum(["en", "mm"]).optional(),
});

function generateSecureOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AdminForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Valid administrative email is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const email = parsed.data.email.trim().toLowerCase();

    // STRICT PRIVILEGE GATE: Verify existence AND enforce Admin role
    const user = await User.findOne({ email });

    if (!user || user.role?.toLowerCase() !== "admin") {
      const lang: Lang = parsed.data.lang === "mm" ? "mm" : "en";

      console.warn("⚠️ [SECURITY ALERT] Unauthorized Admin OTP Requested For:", { email });

      return NextResponse.json(
        {
          error:
            lang === "mm"
              ? "ဤ Email သည် အုပ်ချုပ်သူအဆင့် (Admin) အဖြစ် မှတ်ပုံတင်ထားခြင်း မရှိပါ။"
              : "Access Denied: Email not associated with Executive Clearance.",
        },
        { status: 403 } // 403 Forbidden properly signals a failed privilege check
      );
    }

    const lang: Lang =
      user.languagePreference === "mm" || parsed.data.lang === "mm"
        ? "mm"
        : "en";

    // Isolate executive recovery tokens from standard user tokens
    await Otp.deleteMany({
      email,
      purpose: "admin-forgot-password",
    });

    const otp = generateSecureOtp();

    await Otp.create({
      email,
      otp,
      purpose: "admin-forgot-password",
      lang,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10-minute expiry
    });

    console.log("🔒 [SECURITY AUDIT] Dispatching Executive Recovery Token:", {
      targetEmail: email,
      timestamp: new Date().toISOString(),
    });

    await sendMail({
      to: email,
      subject:
        lang === "mm"
          ? "UCSH အုပ်ချုပ်သူ စကားဝှက် ပြန်သတ်မှတ်ရန် လျှို့ဝှက်ကုဒ်"
          : "CRITICAL: UCSH Executive Account Recovery Token",
      html: otpTemplate({
        name: user.name || "Administrator",
        otp,
        lang,
        title:
          lang === "mm"
            ? "အုပ်ချုပ်သူအဆင့် လုံခြုံရေး အတည်ပြုကုဒ်"
            : "Executive Clearance Recovery OTP",
      }),
    });

    return NextResponse.json({
      message:
        lang === "mm"
          ? "အုပ်ချုပ်သူ အတည်ပြုကုဒ် (OTP) ကို သင့် Email သို့ ပို့ဆောင်ပြီးပါပြီ။"
          : "Level-1 Security Token dispatched to your administrative email.",
    });
  } catch (error) {
    console.error("❌ [SYSTEM ERROR] Admin Recovery OTP Dispatch Failed:", error);

    return NextResponse.json(
      {
        error: "Cryptographic token dispatch failed due to internal server error.",
      },
      { status: 500 }
    );
  }
}