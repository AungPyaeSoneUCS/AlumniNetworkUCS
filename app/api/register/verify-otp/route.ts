// app/api/register/verify-otp/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

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
        { status: 400 }
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const otp = parsed.data.otp.trim();

    await prisma.otp.deleteMany({ where: { expiresAt: { lt: new Date() } } });

    const record = await prisma.otp.findFirst({
      where: {
        email,
        otp,
        purpose: "register",
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired OTP." },
        { status: 400 }
      );
    }

    const lang: Lang = record.lang === "mm" ? "mm" : "en";
    
    const recordName = clean(record.name);
    const recordFatherName = clean(record.fatherName);
    const recordGraduatedYear = String(record.graduatedYear || "").trim();

    if (!recordName || !recordFatherName || !recordGraduatedYear) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "OTP record is missing required student information. Please register again.",
            "OTP record တွင် အချက်အလက်များ မပြည့်စုံပါ။ Register ပြန်လုပ်ပါ။"
          ),
        },
        { status: 400 }
      );
    }

    const approvedStudent = await prisma.approvedStudent.findFirst({
      where: {
        name: recordName,
        fatherName: recordFatherName,
        graduatedYear: recordGraduatedYear,
        approved: true,
      },
    });

    if (!approvedStudent) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "Approved register data was not found. Please contact admin.",
            "Approved register data မတွေ့ပါ။ Admin ကို ဆက်သွယ်ပါ။"
          ),
        },
        { status: 400 }
      );
    }

    const emailUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailUser) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "This email is already registered. Please login instead.",
            "ဤ Email သည် စာရင်းသွင်းပြီးသား ဖြစ်ပါသည်။ Login ဝင်ပါ။"
          ),
        },
        { status: 409 }
      );
    }

    const existingAlumniUser = await prisma.user.findFirst({
      where: {
        name: recordName,
        fatherName: recordFatherName,
        graduatedYear: recordGraduatedYear,
      },
      select: { id: true },
    });

    if (existingAlumniUser) {
      return NextResponse.json(
        {
          error: msg(
            lang,
            "An account has already been created for this alumni record. Please login instead.",
            "ဤ ကျောင်းသားအချက်အလက်ဖြင့် အကောင့်ပြုလုပ်ပြီးသား ဖြစ်ပါသည်။ Login ဝင်ပါ။"
          ),
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: clean(approvedStudent.name),
        fatherName: clean(approvedStudent.fatherName),
        graduatedYear: approvedStudent.graduatedYear,
        email,
        password: record.password,
        role: "user",
        isVerified: true,
        image: "",
        bio: "",
        languagePreference: lang,
        themePreference: "light",
      },
    });

    // Flag this record as successfully registered in the Admin Panel
    await prisma.approvedStudent.update({
      where: { id: approvedStudent.id },
      data: { registered: true },
    });

    await prisma.otp.deleteMany({ where: { email, purpose: "register" } });

    // Prepare safe user object for mobile auto-login
    const {
      id: userId,
      password: _password,
      contactPhone,
      contactEmail,
      contactAddress,
      contactCompany,
      contactPosition,
      socialFacebook,
      socialTelegram,
      socialInstagram,
      socialYoutube,
      socialLinkedin,
      socialGithub,
      socialTiktok,
      socialViber,
      socialLine,
      socialX,
      socialTwitter,
      socialWhatsapp,
      socialWebsite,
      ...userRest
    } = user as any;
    const userObject: any = {
      ...userRest,
      _id: String(userId),
      department: user.degree || "",
      contactInfo: {
        phone: user.contactPhone || "",
        email: user.contactEmail || "",
        address: user.contactAddress || "",
        company: user.contactCompany || "",
        position: user.contactPosition || "",
      },
      socialLinks: {
        facebook: user.socialFacebook || "",
        telegram: user.socialTelegram || "",
        instagram: user.socialInstagram || "",
        youtube: user.socialYoutube || "",
        linkedin: user.socialLinkedin || "",
        github: user.socialGithub || "",
        tiktok: user.socialTiktok || "",
        viber: user.socialViber || "",
        line: user.socialLine || "",
        x: user.socialX || "",
        twitter: user.socialTwitter || "",
        whatsapp: user.socialWhatsapp || "",
        website: user.socialWebsite || "",
      },
    };
    delete userObject.password;

    return NextResponse.json({
      success: true,
      redirect: "/settings",
      message: msg(
        lang,
        "Account verified and created successfully.",
        "အကောင့် အတည်ပြုပြီး ဖန်တီးပြီးပါပြီ။"
      ),
      user: userObject, // Send the full safe user object for React Native SecureStore
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);

    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}