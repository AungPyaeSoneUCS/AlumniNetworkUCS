// file: app/api/admin/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      isBlocked: false,
      isProfilePublic: true,
    });

    return NextResponse.json(
      { message: "Admin account created successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin register error:", error);

    return NextResponse.json(
      { error: "Failed to create admin account." },
      { status: 500 }
    );
  }
}