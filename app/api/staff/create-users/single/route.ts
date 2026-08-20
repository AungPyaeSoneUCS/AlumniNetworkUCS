// file: app/api/staff/create-users/single/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ApprovedStudent from "@/models/ApprovedStudent";

type StaffCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

async function checkStaff(): Promise<StaffCheckResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email })
    .select("role")
    .lean();

  // Allow both staff and admin to use this route
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
    
    // FIXED: Parse graduatedYear as a string instead of a Number
    const graduatedYear = String(body.graduatedYear || "").trim(); 
    
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    // Validation
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

    // 1. Verify that the student exists in the ApprovedStudent collection
    const normName = normalizeForMatch(name);
    const normFatherName = normalizeForMatch(fatherName);

    const approvedStudents = await ApprovedStudent.find({ graduatedYear });    
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

    // 2. Check if the approved record is already marked as registered
    if (approvedRecord.registered) {
      return NextResponse.json(
        { error: "This student account is already registered." },
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

    // 4. Hash password and create User account
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      isBlocked: false,
      isProfilePublic: true,
      fatherName,
      graduatedYear, // Saves safely as string now
    });

    // 5. Update ApprovedStudent status to registered
    approvedRecord.registered = true;
    await approvedRecord.save();

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Single user creation error:", error);

    if (error?.code === 11000) {
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