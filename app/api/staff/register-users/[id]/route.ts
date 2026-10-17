// file: app/api/admin/register-users/[id]/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

type StaffCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

async function checkStaffOrAdmin(): Promise<StaffCheckResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true },
  });

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { error: "Staff or Admin access only.", status: 403 };
  }

  return { ok: true };
}

function withId<T extends { id: string }>(row: T) {
  return { ...row, _id: row.id };
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const staffCheck = await checkStaffOrAdmin();

    if (!staffCheck.ok) {
      return NextResponse.json(
        { error: staffCheck.error },
        { status: staffCheck.status },
      );
    }

    const { id } = await Promise.resolve(params);

    if (!id || !isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid register data ID." },
        { status: 400 },
      );
    }

    const body = await req.json();

    if (!body.name || !body.fatherName || !body.graduatedYear) {
      return NextResponse.json(
        { error: "Alumni Name, Father Name, and Graduated Year are required." },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const fatherName = body.fatherName.trim();
    const graduatedYear = String(body.graduatedYear).trim();

    const existingStudent = await prisma.approvedStudent.findFirst({
      where: {
        name,
        fatherName,
        graduatedYear,
        id: { not: id },
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "This alumni record already exists for this graduated year." },
        { status: 400 }
      );
    }

    const student = await prisma.approvedStudent.update({
      where: { id },
      data: {
        name,
        fatherName,
        graduatedYear,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Register data updated successfully.",
      student: withId(student),
    });
  } catch (error: any) {
    console.error("Edit register data error:", error);

    if (error?.code === "P2002" || error?.code === 11000) {
      const field = error?.meta?.target?.[0] || Object.keys(error?.keyPattern || {})[0];

      if (["studentId", "rollNumber", "nrc"].includes(field)) {
        return NextResponse.json(
          {
            error: `Legacy database index conflict on field: ${field}`,
            requiresIndexDrop: true,
            conflictingIndex: field
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: "Duplicate register data exists." }, { status: 400 });
    }

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Register data not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update register data." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const staffCheck = await checkStaffOrAdmin();

    if (!staffCheck.ok) {
      return NextResponse.json(
        { error: staffCheck.error },
        { status: staffCheck.status },
      );
    }

    const { id } = await Promise.resolve(params);

    if (!id || !isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid register data ID." },
        { status: 400 },
      );
    }

    const student = await prisma.approvedStudent.delete({ where: { id } });

    if (!student) {
      return NextResponse.json(
        { error: "Register data not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Register data deleted.",
    });
  } catch (error: any) {
    console.error("Delete register data error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Register data not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to delete register data." },
      { status: 500 },
    );
  }
}
