// file: app/api/forgot-password/send-otp/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { sendMail } from "@/lib/mail";
import { otpTemplate } from "@/lib/emailTemplates";

import User from "@/models/User";
import Otp from "@/models/Otp";

type Lang = "en" | "mm";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  lang: z.enum(["en", "mm"]).optional(),
});

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Valid email is required",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const email = parsed.data.email.trim().toLowerCase();

    const user = await User.findOne({ email });

    if (!user) {
      const lang: Lang = parsed.data.lang === "mm" ? "mm" : "en";

      return NextResponse.json(
        {
          error:
            lang === "mm"
              ? "သင့် Email သည် Alumni Network တွင် စာရင်းမသွင်းထားပါ။"
              : "Your mail is not registered to Alumni Network",
        },
        { status: 404 }
      );
    }

    // STRICT PRIVILEGE GATE: Protect Admin & Staff accounts from public OTP requests
    if (user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "staff") {
      const lang: Lang = parsed.data.lang === "mm" ? "mm" : "en";

      console.warn("⚠️ [SECURITY ALERT] Unauthorized Public OTP Requested For High-Privilege Account:", { 
        email, 
        role: user.role 
      });

      return NextResponse.json(
        {
          error:
            lang === "mm"
              ? "Staff နှင့် Admin အကောင့်များအတွက် သက်ဆိုင်ရာ Portal မှတဆင့်သာ စကားဝှက် ပြန်လည်သတ်မှတ်နိုင်ပါသည်။"
              : "Staff and Admin accounts must use their dedicated portals for password recovery.",
        },
        { status: 403 } // 403 Forbidden
      );
    }

    const lang: Lang =
      user.languagePreference === "mm" || parsed.data.lang === "mm"
        ? "mm"
        : "en";

    await Otp.deleteMany({
      email,
      purpose: "forgot-password",
    });

    const otp = generateOtp();

    await Otp.create({
      email,
      otp,
      purpose: "forgot-password",
      lang,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendMail({
      to: email,
      subject:
        lang === "mm"
          ? "Alumni Network စကားဝှက်ပြန်သတ်မှတ်ရန် OTP"
          : "Reset your Alumni Network password",
      html: otpTemplate({
        name: user.name,
        otp,
        lang,
        title:
          lang === "mm"
            ? "စကားဝှက် ပြန်သတ်မှတ်ရန် OTP"
            : "Password Reset OTP",
      }),
    });

    return NextResponse.json({
      message:
        lang === "mm"
          ? "OTP ကို သင့် Email သို့ ပို့ပြီးပါပြီ။"
          : "OTP sent to your email",
    });
  } catch (error) {
    console.error("Forgot password OTP error:", error);

    return NextResponse.json(
      {
        error: "Failed to send OTP",
      },
      { status: 500 }
    );
  }
}