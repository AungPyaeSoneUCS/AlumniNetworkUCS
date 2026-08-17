// file: app/api/admin/create-staff/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

type AdminCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  await connectDB();

  const admin = await User.findOne({ email: session.user.email })
    .select("role")
    .lean();

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
    // 1. Verify Admin Authentication
    const adminCheck = await checkAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    // 2. Parse Data
    const body = await req.json();
    const name = String(body.name || "").trim();
    const position = String(body.position || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // Validation
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

    // 3. Check if the target email is already taken in the User model
    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered to another user." },
        { status: 409 },
      );
    }

    // 4. Hash password and create Staff account
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "staff", // Strictly assigned as staff
      position,      // The new position field
      isBlocked: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Staff account created successfully.",
        user: {
          id: newStaff._id,
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

    if (error?.code === 11000) {
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