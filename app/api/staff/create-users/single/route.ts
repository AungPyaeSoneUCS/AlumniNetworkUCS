// file: app/api/staff/create-users/single/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type StaffCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

async function checkStaff(): Promise<StaffCheckResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || (user.role !== "staff" && user.role !== "admin")) {
    return { error: "Forbidden", status: 403 };
  }

  return { ok: true };
}

function normalizeForMatch(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const staffCheck = await checkStaff();

    if (!staffCheck.ok) {
      return NextResponse.json(
        { error: staffCheck.error },
        { status: staffCheck.status },
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const fatherName = String(body.fatherName || "").trim();
    const graduatedYear = String(body.graduatedYear || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !fatherName || !graduatedYear || !email || !password) {
      return NextResponse.json(
        { error: "Name, Father Name, Graduated Year, Email, and Password are required." },
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

    const normName = normalizeForMatch(name);
    const normFatherName = normalizeForMatch(fatherName);

    const approvedStudents = await prisma.approvedStudent.findMany({
      where: { graduatedYear },
    });
    const approvedRecord = approvedStudents.find(
      (s) =>
        normalizeForMatch(s.name) === normName &&
        normalizeForMatch(s.fatherName) === normFatherName,
    );

    if (!approvedRecord) {
      return NextResponse.json(
        { error: "Student not found in approved student lists." },
        { status: 404 },
      );
    }

    if (approvedRecord.registered) {
      return NextResponse.json(
        { error: "This student account is already registered." },
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

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "user",
        isBlocked: false,
        isProfilePublic: true,
        fatherName,
        graduatedYear,
      },
    });

    await prisma.approvedStudent.update({
      where: { id: approvedRecord.id },
      data: { registered: true },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Single user creation error:", error);

    if (error?.code === "P2002" || error?.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate registration error occurred." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Server error occurred while creating user." },
      { status: 500 },
    );
  }
}
