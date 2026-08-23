// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import { sendMail } from "@/lib/mail";
import { otpTemplate } from "@/lib/emailTemplates";

import User from "@/models/User";
import Otp from "@/models/Otp";
import ApprovedStudent from "@/models/ApprovedStudent";

type Lang = "en" | "mm";

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  fatherName: z.string().trim().min(1, "Father Name is required"),
  graduatedYear: z.string().trim().min(1, "Graduated year is required"),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must include lowercase letter")
    .regex(/[A-Z]/, "Password must include uppercase letter")
    .regex(/[0-9]/, "Password must include number")
    .regex(/[^A-Za-z0-9]/, "Password must include symbol"),
  lang: z.enum(["en", "mm"]).optional(),
});

function loose(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function clean(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function msg(lang: Lang, en: string, mm: string) {
  return lang === "mm" ? mm : en;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lang: Lang = body?.lang === "mm" ? "mm" : "en";

    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input.";
      return NextResponse.json(
        {
          error:
            lang === "mm"
              ? "အချက်အလက်မှားနေသည်။ Email နှင့် Password ကိုစစ်ပါ။"
              : firstError,
        },
        { status: 400 }
      );
    }

    await connectDB();

    const input = parsed.data;
    const email = normalizeEmail(input.email);
    const graduatedYear = input.graduatedYear; 

    // 1. Check if email is already registered in User model
    const existingUser = await User.findOne({ email }).select("_id email").lean();

    if (existingUser) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "Email is already registered. Please login instead.",
            "ဤ Email သည် စာရင်းသွင်းပြီးသား ဖြစ်ပါသည်။ Login ဝင်ပါ။"
          ),
        },
        { status: 409 }
      );
    }

    // 2. Retrieve approved students for the specified graduated year
    const approvedStudentsInYear = await ApprovedStudent.find({
      graduatedYear,
      approved: true,
    }).lean();

    // 3. Match loose values for Name and Father Name ignoring casing and extra spaces
    const approvedStudent = approvedStudentsInYear.find(
      (student) =>
        loose(student.name) === loose(input.name) &&
        loose(student.fatherName) === loose(input.fatherName)
    );

    if (!approvedStudent) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "Cannot register. Your information is not approved by admin.",
            "Register လုပ်၍မရပါ။ သင့်အချက်အလက်များသည် Admin data နှင့် မကိုက်ညီပါ။"
          ),
        },
        { status: 400 }
      );
    }

    // 4. Check if the student has already registered an account
    if (approvedStudent.registered) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "An account has already been registered with this alumni information.",
            "ဤ အချက်အလက်ဖြင့် အကောင့်ပြုလုပ်ပြီးသား ဖြစ်ပါသည်။"
          ),
        },
        { status: 409 }
      );
    }

    // 5. Clean up old OTPs
    await Otp.deleteMany({
      email,
      purpose: "register",
    });

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // 6. Create new OTP record
    await Otp.create({
      name: clean(approvedStudent.name),
      fatherName: clean(approvedStudent.fatherName),
      graduatedYear: approvedStudent.graduatedYear,
      email,
      password: hashedPassword,
      otp,
      purpose: "register",
      lang,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    });

    // 7. Send OTP via email
    await sendMail({
      to: email,
      subject:
        lang === "mm"
          ? "Alumni Network OTP အတည်ပြုကုဒ်"
          : "Verify your Alumni Network Email",
      html: otpTemplate({
        name: approvedStudent.name,
        otp,
        lang,
        title:
          lang === "mm"
            ? "Email အတည်ပြုခြင်း"
            : "Email Verification",
      }),
    });

    return NextResponse.json(
      {
        success: true,
        approved: true,
        email,
        message: msg(
          lang,
          "OTP sent to your email.",
          "OTP ကို သင့် Email သို့ ပို့ပြီးပါပြီ."
        ),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Register OTP send error:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          error: "Duplicate data found. Email may already exist.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to send OTP.",
      },
      { status: 500 }
    );
  }
}