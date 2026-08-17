// file: app/api/auth/logout-mail/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { sendMail } from "@/lib/mail";
import { getRequestInfo } from "@/lib/requestInfo";
import { logoutTemplate } from "@/lib/emailTemplates";

import User from "@/models/User";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({
      email: session.user.email,
    });

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 404 });
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

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}