// file: app/api/admin/register-users/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import ApprovedStudent from "@/models/ApprovedStudent";

type AdminCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

type NormalizedStudent = {
  name: string;
  fatherName: string;
  graduatedYear: number;
};

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

function cleanValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function cleanYear(value: unknown) {
  const year = Number(cleanValue(value));
  return Number.isFinite(year) ? year : 0;
}

function normalizeStudent(row: any): NormalizedStudent {
  const name = cleanValue(row.name || row.Name);

  const fatherName = cleanValue(
    row.fatherName ||
      row.father_name ||
      row["Father Name"] ||
      row["father name"],
  );

  const graduatedYear = cleanYear(
    row.graduatedYear ||
      row.graduated_year ||
      row["Graduated Year"] ||
      row["graduated year"],
  );

  return {
    name,
    fatherName,
    graduatedYear,
  };
}

function isValidStudent(student: NormalizedStudent) {
  const currentYear = new Date().getFullYear();
  return (
    Boolean(student.name) &&
    Boolean(student.fatherName) &&
    student.graduatedYear >= 2020 &&
    student.graduatedYear <= currentYear + 1
  );
}

function getRequiredError() {
  return "Alumni Name, Father Name, and Graduated Year are required.";
}

function getDuplicateError(error?: any) {
  const field = Object.keys(error?.keyPattern || {})[0];

  if (field === "studentId" || field === "rollNumber" || field === "nrc") {
    return "Old database index still exists in MongoDB. Please drop old indexes.";
  }

  return "Duplicate register data exists.";
}

// Helper to prevent duplicate entries based on Name + Father Name + Year
async function findExistingStudent(student: NormalizedStudent) {
  return ApprovedStudent.findOne({
    name: student.name,
    fatherName: student.fatherName,
    graduatedYear: student.graduatedYear,
  });
}

export async function GET() {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    const students = await ApprovedStudent.find()
      .sort({ graduatedYear: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ students });
  } catch (error) {
    console.error("GET register users failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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

    // Handle Bulk Import Array
    if (Array.isArray(body.students)) {
      let added = 0;
      let skipped = 0;
      const createdStudents = [];

      for (const row of body.students) {
        const student = normalizeStudent(row);

        if (!isValidStudent(student)) {
          skipped++;
          continue;
        }

        const exists = await findExistingStudent(student);
        if (exists) {
          skipped++;
          continue;
        }

        const created = await ApprovedStudent.create({
          name: student.name,
          fatherName: student.fatherName,
          graduatedYear: student.graduatedYear,
          approved: true,
        });

        createdStudents.push(created);
        added++;
      }

      return NextResponse.json({
        success: true,
        message: `${added} added, ${skipped} skipped.`,
        added,
        skipped,
        students: createdStudents,
      });
    }

    // Handle Single Addition
    const student = normalizeStudent(body);

    if (!isValidStudent(student)) {
      return NextResponse.json({ error: getRequiredError() }, { status: 400 });
    }

    const exists = await findExistingStudent(student);
    if (exists) {
      return NextResponse.json(
        { error: "This alumni record already exists for this graduated year." },
        { status: 400 }
      );
    }

    const createdStudent = await ApprovedStudent.create({
      name: student.name,
      fatherName: student.fatherName,
      graduatedYear: student.graduatedYear,
      approved: true,
    });

    return NextResponse.json({
      success: true,
      message: "Register user data added successfully.",
      student: createdStudent,
    });
  } catch (error: any) {
    console.error("POST register users failed:", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { error: getDuplicateError(error) },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}