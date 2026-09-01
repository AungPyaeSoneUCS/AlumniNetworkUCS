// file: app/api/vote/admin/setup/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import VoteUser from "@/models/VoteUser";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, secretKey } = body;

    // 1. Verify the Secret Key
    const envSecret = process.env.VOTE_ADMIN_SETUP_SECRET;
    
    if (!envSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: VOTE_ADMIN_SETUP_SECRET is not set in .env" },
        { status: 500 }
      );
    }

    if (secretKey !== envSecret) {
      return NextResponse.json(
        { error: "Invalid setup secret key. Access denied." },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check if the user already exists
    const existingUser = await VoteUser.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 3. Hash password and create the ADMIN account
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await VoteUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
    });

    return NextResponse.json(
      { message: "Admin account created successfully!" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Admin setup failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}