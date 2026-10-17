// file: app/api/admin/register-users/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type StaffCheckResult =
  | { ok: true }
  | { ok?: false; error: string; status: number };

type NormalizedStudent = {
  name: string;
  fatherName: string;
  graduatedYear: string;
};

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
    return { error: "Forbidden", status: 403 };
  }

  return { ok: true };
}

function cleanValue(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeStudent(row: any): NormalizedStudent {
  const name = cleanValue(row.name || row.Name);

  const fatherName = cleanValue(
    row.fatherName ||
      row.father_name ||
      row["Father Name"] ||
      row["father name"],
  );

  const graduatedYear = cleanValue(
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
  return (
    Boolean(student.name) &&
    Boolean(student.fatherName) &&
    Boolean(student.graduatedYear)
  );
}

function getRequiredError() {
  return "Alumni Name, Father Name, and Graduated Year are required.";
}

function getDuplicateError(error?: any) {
  const field = error?.meta?.target?.[0] || Object.keys(error?.keyPattern || {})[0];

  if (field === "studentId" || field === "rollNumber" || field === "nrc") {
    return "Old database index still exists in MongoDB. Please drop old indexes.";
  }

  return "Duplicate register data exists.";
}

async function findExistingStudent(student: NormalizedStudent) {
  return prisma.approvedStudent.findFirst({
    where: {
      name: student.name,
      fatherName: student.fatherName,
      graduatedYear: student.graduatedYear,
    },
  });
}

function withId<T extends { id: string }>(row: T) {
  return { ...row, _id: row.id };
}

export async function GET() {
  try {
    const staffCheck = await checkStaffOrAdmin();

    if (!staffCheck.ok) {
      return NextResponse.json(
        { error: staffCheck.error },
        { status: staffCheck.status },
      );
    }

    const students = await prisma.approvedStudent.findMany({
      orderBy: [{ graduatedYear: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ students: students.map(withId) });
  } catch (error) {
    console.error("GET register users failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const staffCheck = await checkStaffOrAdmin();

    if (!staffCheck.ok) {
      return NextResponse.json(
        { error: staffCheck.error },
        { status: staffCheck.status },
      );
    }

    const body = await req.json();

    if (Array.isArray(body.students)) {
      let added = 0;
      let skipped = 0;

      const toCreate: NormalizedStudent[] = [];
      const seen = new Set<string>();

      for (const row of body.students) {
        const student = normalizeStudent(row);

        if (!isValidStudent(student)) {
          skipped++;
          continue;
        }

        const key = `${student.name}||${student.fatherName}||${student.graduatedYear}`;
        if (seen.has(key)) {
          skipped++;
          continue;
        }

        const exists = await findExistingStudent(student);
        if (exists) {
          skipped++;
          continue;
        }

        seen.add(key);
        toCreate.push(student);
      }

      const createdStudents =
        toCreate.length > 0
          ? await prisma.approvedStudent.createManyAndReturn({
              data: toCreate.map((student) => ({
                name: student.name,
                fatherName: student.fatherName,
                graduatedYear: student.graduatedYear,
                approved: true,
              })),
            })
          : [];

      added = createdStudents.length;

      return NextResponse.json({
        success: true,
        message: `${added} added, ${skipped} skipped.`,
        added,
        skipped,
        students: createdStudents.map(withId),
      });
    }

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

    const createdStudent = await prisma.approvedStudent.create({
      data: {
        name: student.name,
        fatherName: student.fatherName,
        graduatedYear: student.graduatedYear,
        approved: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Register user data added successfully.",
      student: withId(createdStudent),
    });
  } catch (error: any) {
    console.error("POST register users failed:", error);

    if (error?.code === "P2002" || error?.code === 11000) {
      return NextResponse.json(
        { error: getDuplicateError(error) },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
