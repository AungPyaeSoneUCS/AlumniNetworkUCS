// file: app/api/admin/contact/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import ContactSetting from "@/models/ContactSetting";
import User from "@/models/User";

async function checkAdmin() {
  const session = await auth();

  if (!session?.user?.email) return null;

  await connectDB();

  const admin = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") return null;

  return admin;
}

export async function GET() {
  try {
    const admin = await checkAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let contact = await ContactSetting.findOne().lean();

    if (!contact) {
      contact = await ContactSetting.create({});
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Admin get contact failed:", error);

    return NextResponse.json(
      { error: "Failed to get contact data" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await checkAdmin();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const data = {
      phone1: String(body.phone1 || "").trim(),
      phone2: String(body.phone2 || "").trim(),
      email: String(body.email || "").trim(),
      address: String(body.address || "").trim(),
      website: String(body.website || "").trim(),
      facebookUrl: String(body.facebookUrl || "").trim(),
      facebookName: String(body.facebookName || "").trim(),
      mapUrl: String(body.mapUrl || "").trim(),
    };

    await connectDB();

    const existing = await ContactSetting.findOne();

    const contact = existing
      ? await ContactSetting.findByIdAndUpdate(existing._id, data, {
          new: true,
        })
      : await ContactSetting.create(data);

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error) {
    console.error("Admin update contact failed:", error);

    return NextResponse.json(
      { error: "Failed to update contact data" },
      { status: 500 }
    );
  }
}