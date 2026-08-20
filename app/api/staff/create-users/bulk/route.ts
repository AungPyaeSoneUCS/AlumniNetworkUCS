// file: app/api/admin/create-users/bulk/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ApprovedStudent from "@/models/ApprovedStudent";

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

function normalizeForMatch(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
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

    if (!Array.isArray(body.users) || body.users.length === 0) {
      return NextResponse.json(
        { error: "Valid users array is required." },
        { status: 400 },
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const row of body.users) {
      const name = String(row.name || "").trim();
      const fatherName = String(row.fatherName || "").trim();
      
      // FIXED: Convert graduatedYear to a string to satisfy TypeScript
      const graduatedYear = String(row.graduatedYear || "").trim(); 
      
      const email = String(row.email || "").trim().toLowerCase();
      const password = String(row.password || "");

      // Validation check
      if (
        !name ||
        !fatherName ||
        !graduatedYear ||
        !email ||
        !password ||
        !isEmailValid(email) ||
        password.length < 6
      ) {
        skippedCount++;
        continue;
      }

      // Check if student exists in approved list
      const normName = normalizeForMatch(name);
      const normFatherName = normalizeForMatch(fatherName);

      const approvedStudents = await ApprovedStudent.find({ graduatedYear });
      const approvedRecord = approvedStudents.find(
        (s) =>
          normalizeForMatch(s.name) === normName &&
          normalizeForMatch(s.fatherName) === normFatherName,
      );

      // Auto-skip if not found in approved list or if already registered
      if (!approvedRecord || approvedRecord.registered) {
        skippedCount++;
        continue;
      }

      // Auto-skip if email is already taken
      const existingUser = await User.findOne({ email }).select("_id").lean();
      if (existingUser) {
        skippedCount++;
        continue;
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isBlocked: false,
        isProfilePublic: true,
        fatherName,
        graduatedYear,
      });

      // Mark student record as registered
      approvedRecord.registered = true;
      await approvedRecord.save();

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Bulk creation process finished: ${createdCount} created, ${skippedCount} skipped.`,
      createdCount,
      skippedCount,
    });
  } catch (error: any) {
    console.error("Bulk user creation error:", error);

    return NextResponse.json(
      { error: "Server error occurred during bulk user creation." },
      { status: 500 },
    );
  }
}