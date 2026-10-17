// file: app/api/admin/create-users/bulk/route.ts
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

    let skippedCount = 0;
    let createdCount = 0;

    const userData: {
      name: string;
      email: string;
      password: string;
      role: string;
      isBlocked: boolean;
      isProfilePublic: boolean;
      fatherName: string;
      graduatedYear: string;
    }[] = [];
    const approvedIds: string[] = [];
    const usedApprovedIds = new Set<string>();
    const usedEmails = new Set<string>();

    for (const row of body.users) {
      const name = String(row.name || "").trim();
      const fatherName = String(row.fatherName || "").trim();
      const graduatedYear = String(row.graduatedYear || "").trim();
      const email = String(row.email || "").trim().toLowerCase();
      const password = String(row.password || "");

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

      if (
        !approvedRecord ||
        approvedRecord.registered ||
        usedApprovedIds.has(approvedRecord.id)
      ) {
        skippedCount++;
        continue;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existingUser || usedEmails.has(email)) {
        skippedCount++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      userData.push({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isBlocked: false,
        isProfilePublic: true,
        fatherName,
        graduatedYear,
      });
      approvedIds.push(approvedRecord.id);
      usedApprovedIds.add(approvedRecord.id);
      usedEmails.add(email);
    }

    if (userData.length > 0) {
      const created = await prisma.$transaction(async (tx) => {
        const rows = await tx.user.createManyAndReturn({
          data: userData,
          select: { id: true },
        });
        await tx.approvedStudent.updateMany({
          where: { id: { in: approvedIds } },
          data: { registered: true },
        });
        return rows;
      });
      createdCount = created.length;
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
