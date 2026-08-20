// file: app/api/register/verify-otp/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Otp from "@/models/Otp";
import ApprovedStudent from "@/models/ApprovedStudent";

type Lang = "en" | "mm";

const VerifySchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

function clean(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function msg(lang: Lang, en: string, mm: string) {
  return lang === "mm" ? mm : en;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = VerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid OTP." },
        { status: 400 },
      );
    }

    await connectDB();

    const email = parsed.data.email.trim().toLowerCase();
    const otp = parsed.data.otp.trim();

    const record = await Otp.findOne({
      email,
      otp,
      purpose: "register",
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired OTP." },
        { status: 400 },
      );
    }

    const lang: Lang = record.lang === "mm" ? "mm" : "en";
    
    // We now rely on name, fatherName, and graduatedYear attached to the OTP record during step 2
    const recordName = clean(record.name);
    const recordFatherName = clean(record.fatherName);
    
    // <-- UPDATED: Parse as a string instead of a Number
    const recordGraduatedYear = String(record.graduatedYear || "").trim();

    // <-- UPDATED: Check if string is empty instead of Number.isFinite
    if (!recordName || !recordFatherName || !recordGraduatedYear) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "OTP record is missing required student information. Please register again.",
            "OTP record တွင် အချက်အလက်များ မပြည့်စုံပါ။ Register ပြန်လုပ်ပါ။",
          ),
        },
        { status: 400 },
      );
    }

    const approvedStudent = await ApprovedStudent.findOne({
      name: recordName,
      fatherName: recordFatherName,
      graduatedYear: recordGraduatedYear, // Now querying with the string
      approved: true,
    }).lean();

    if (!approvedStudent) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "Approved register data was not found. Please contact admin.",
            "Approved register data မတွေ့ပါ။ Admin ကို ဆက်သွယ်ပါ။",
          ),
        },
        { status: 400 },
      );
    }

    const emailUser = await User.findOne({ email }).select("_id").lean();

    if (emailUser) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "This email is already registered. Please login instead.",
            "ဤ Email သည် စာရင်းသွင်းပြီးသား ဖြစ်ပါသည်။ Login ဝင်ပါ။",
          ),
        },
        { status: 409 },
      );
    }

    // Check if an account already exists for this exact alumni combination
    const existingAlumniUser = await User.findOne({ 
      name: recordName, 
      fatherName: recordFatherName, 
      graduatedYear: recordGraduatedYear // Now querying with the string
    }).select("_id").lean();

    if (existingAlumniUser) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "An account has already been created for this alumni record. Please login instead.",
            "ဤ ကျောင်းသားအချက်အလက်ဖြင့် အကောင့်ပြုလုပ်ပြီးသား ဖြစ်ပါသည်။ Login ဝင်ပါ။",
          ),
        },
        { status: 409 },
      );
    }

    const user = await User.create({
      name: clean(approvedStudent.name),
      fatherName: clean(approvedStudent.fatherName),
      graduatedYear: approvedStudent.graduatedYear, // Saves as string to User model
      email,
      password: record.password,
      role: "user",
      approved: true,
      isVerified: true,
      image: "",
      bio: "",
      languagePreference: lang,
      themePreference: "light",
      personalContact: {},
      professionalContact: {},
      socialLinks: {},
    });

    // UPDATE ADMIN TABLE STATUS
    // Flag this record as successfully registered so it shows the green badge in the Admin Panel
    await ApprovedStudent.updateOne(
      { _id: approvedStudent._id },
      { $set: { registered: true } }
    );

    await Otp.deleteMany({ email, purpose: "register" });

    return NextResponse.json({
      success: true,
      redirect: "/settings",
      message: msg(
        lang,
        "Account verified and created successfully.",
        "အကောင့် အတည်ပြုပြီး ဖန်တီးပြီးပါပြီ။",
      ),
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 },
    );
  }
}