// file: app/api/vote/admin/setup/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, secretKey } = body;

    const envSecret = process.env.VOTE_ADMIN_SETUP_SECRET;

    if (!envSecret) {
      return NextResponse.json(
        { error: "Server misconfiguration: SECRET_KEY is not set in .env" },
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

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.voteUser.findFirst({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.voteUser.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "ADMIN",
      },
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