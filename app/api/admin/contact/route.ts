// file: app/api/admin/contact/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkStaffOrAdmin() {
  const session = await auth();

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== "admin" && user.role !== "staff")) return null;

  return user;
}

function serializeContact(row: any) {
  if (!row) return row;
  const { id, ...rest } = row;
  return { ...rest, _id: String(id) };
}

export async function GET() {
  try {
    const authorizedUser = await checkStaffOrAdmin();

    if (!authorizedUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let contact = await prisma.contactSetting.findFirst();

    if (!contact) {
      contact = await prisma.contactSetting.create({ data: {} });
    }

    return NextResponse.json(serializeContact(contact));
  } catch (error) {
    console.error("Staff/Admin get contact failed:", error);

    return NextResponse.json(
      { error: "Failed to get contact data" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authorizedUser = await checkStaffOrAdmin();

    if (!authorizedUser) {
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

    const existing = await prisma.contactSetting.findFirst();

    const contact = existing
      ? await prisma.contactSetting.update({ where: { id: existing.id }, data })
      : await prisma.contactSetting.create({ data });

    return NextResponse.json({
      success: true,
      contact: serializeContact(contact),
    });
  } catch (error) {
    console.error("Staff/Admin update contact failed:", error);

    return NextResponse.json(
      { error: "Failed to update contact data" },
      { status: 500 }
    );
  }
}
