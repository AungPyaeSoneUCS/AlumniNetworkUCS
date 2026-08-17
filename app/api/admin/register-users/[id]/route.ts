// file: app/api/admin/register-users/[id]/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import ApprovedStudent from "@/models/ApprovedStudent";
import User from "@/models/User";

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

  await connectDB();

  const user = await User.findOne({ email: session.user.email })
    .select("role")
    .lean();

  if (!user || (user.role !== "admin" && user.role !== "staff")) {
    return { error: "Staff or Admin access only.", status: 403 };
  }

  return { ok: true };
}

function isValidMongoId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
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

    if (!id || !isValidMongoId(id)) {
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
    const graduatedYear = Number(body.graduatedYear);

    // Prevent editing into an exact duplicate of another existing record
    const existingStudent = await ApprovedStudent.findOne({
      name,
      fatherName,
      graduatedYear,
      _id: { $ne: id }, // exclude the current record from the search
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "This alumni record already exists for this graduated year." },
        { status: 400 }
      );
    }

    const student = await ApprovedStudent.findByIdAndUpdate(
      id,
      {
        name,
        fatherName,
        graduatedYear,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!student) {
      return NextResponse.json(
        { error: "Register data not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Register data updated successfully.",
      student,
    });
  } catch (error: any) {
    console.error("Edit register data error:", error);

    if (error?.code === 11000) {
      const field = Object.keys(error?.keyPattern || {})[0];
      
      // If the conflict is on an old field, tell the frontend it can be dropped
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

    if (!id || !isValidMongoId(id)) {
      return NextResponse.json(
        { error: "Invalid register data ID." },
        { status: 400 },
      );
    }

    const student = await ApprovedStudent.findByIdAndDelete(id);

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
  } catch (error) {
    console.error("Delete register data error:", error);

    return NextResponse.json(
      { error: "Failed to delete register data." },
      { status: 500 },
    );
  }
}