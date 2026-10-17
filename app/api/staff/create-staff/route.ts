// file: app/api/admin/create-staff/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AdminCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!admin || admin.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { ok: true };
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const position = String(body.position || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !position || !email || !password) {
      return NextResponse.json(
        { error: "Name, Position, Email, and Password are required." },
        { status: 400 },
      );
    }

    if (!isEmailValid(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered to another user." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "staff",
        position,
        isBlocked: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Staff account created successfully.",
        user: {
          id: newStaff.id,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          position: newStaff.position,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Staff creation error:", error);

    if (error?.code === "P2002" || error?.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate registration error occurred." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Server error occurred while creating staff account." },
      { status: 500 },
    );
  }
}
