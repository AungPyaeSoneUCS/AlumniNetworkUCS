// file: app/api/migrate-data/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // --- 1. DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- 2. ADMIN ROLE VERIFICATION ---
    let currentUser: { id: string; role: string } | null = null;

    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true, role: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Strictly restrict this route to Administrators
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only administrators can run migrations" }, { status: 403 });
    }

    // --- 3. RUN MIGRATION ---
    // Convert 'graduatedYear' from Number to String in the users table
    const userRows = (await prisma.user.findMany({
      select: { id: true, graduatedYear: true },
    })) as Array<{ id: string; graduatedYear: any }>;

    const userUpdates = userRows
      .filter((row) => row.graduatedYear !== null && typeof row.graduatedYear !== "string")
      .map((row) =>
        prisma.user.update({
          where: { id: row.id },
          data: { graduatedYear: String(row.graduatedYear) },
        })
      );

    // Convert 'graduatedYear' from Number to String in the approved_students table
    const approvedRows = (await prisma.approvedStudent.findMany({
      select: { id: true, graduatedYear: true },
    })) as Array<{ id: string; graduatedYear: any }>;

    const approvedUpdates = approvedRows
      .filter((row) => row.graduatedYear !== null && typeof row.graduatedYear !== "string")
      .map((row) =>
        prisma.approvedStudent.update({
          where: { id: row.id },
          data: { graduatedYear: String(row.graduatedYear) },
        })
      );

    const updates = [...userUpdates, ...approvedUpdates];

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    // Copy approved students into the 'students' table (insert or update by id)
    const approved = await prisma.approvedStudent.findMany({
      where: { approved: true },
    });

    if (approved.length > 0) {
      await prisma.$transaction(
        approved.map((student) =>
          prisma.student.upsert({
            where: { id: student.id },
            update: {
              name: student.name,
              fatherName: student.fatherName,
              graduatedYear: String(student.graduatedYear),
              registered: student.registered,
            },
            create: {
              id: student.id,
              name: student.name,
              fatherName: student.fatherName,
              graduatedYear: String(student.graduatedYear),
              approved: student.approved,
              registered: student.registered,
            },
          })
        )
      );
    }

    return NextResponse.json(
      { message: "Migration completed successfully! Data updated and copied." },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}
