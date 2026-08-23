// file: app/api/auth/logout-mail/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { sendMail } from "@/lib/mail";
import { getRequestInfo } from "@/lib/requestInfo";
import { logoutTemplate } from "@/lib/emailTemplates";

import User from "@/models/User";

export async function POST(req: Request) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Identify current user either by Mobile Header ID or Web Session Email
    let user: any = null;
    
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      user = await User.findById(mobileUserId);
    } else if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const lang = user.languagePreference === "mm" ? "mm" : "en";
    
    // Await the Promise returned by the upgraded getRequestInfo utility
    const info = await getRequestInfo();

    await sendMail({
      to: user.email,
      subject:
        lang === "mm"
          ? "Alumni Network ထွက်ခွာမှု အသိပေးချက်"
          : "Alumni Network Logout Alert",
      html: logoutTemplate(user.name, lang, {
        email: user.email,
        date: info.date,
        time: info.time,
        device: info.device,
        ip: info.ip,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout email failed:", error);

    return NextResponse.json({ ok: false, error: "Failed to send logout email" }, { status: 500 });
  }
}