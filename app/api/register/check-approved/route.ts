// file: app/api/register/check-approved/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { connectDB } from "@/lib/mongodb";
import ApprovedStudent from "@/models/ApprovedStudent";
import User from "@/models/User";

type Lang = "en" | "mm";

const CheckApprovedSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().min(1, "Father Name is required"),
  normalizedName: z.string().optional(),
  normalizedFatherName: z.string().optional(),
  graduatedYear: z.coerce
    .number()
    .min(2020, "Invalid graduated year")
    .max(2100, "Invalid graduated year"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  lang: z.enum(["en", "mm"]).optional(),
});

function looseValue(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function cleanValue(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function msg(lang: Lang, en: string, mm: string) {
  return lang === "mm" ? mm : en;
}

function getRequiredMessage(lang: Lang) {
  return msg(
    lang,
    "Please fill Alumni Name, Father Name, and Graduated Year.",
    "Alumni Name, Father Name, နှင့် Graduated Year ဖြည့်ပါ။",
  );
}

function getMismatchMessage(lang: Lang) {
  return msg(
    lang,
    "Not approved. Register data and admin approved data do not match.",
    "အတည်ပြုမထားပါ။ Register data နှင့် Admin approved data မကိုက်ညီပါ။",
  );
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const lang: Lang = body?.lang === "mm" ? "mm" : "en";

    const parsed = CheckApprovedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          approved: false,
          emailAvailable: false,
          message: parsed.error.issues[0]?.message || getRequiredMessage(lang),
        },
        { status: 400 },
      );
    }

    const inputName = cleanValue(parsed.data.name);
    const inputFatherName = cleanValue(parsed.data.fatherName);
    const inputGraduatedYear = parsed.data.graduatedYear;
    const inputEmail = normalizeEmail(parsed.data.email);

    // Fetch all approved students for the given year 
    const studentsInYear = await ApprovedStudent.find({
      graduatedYear: inputGraduatedYear,
      approved: true,
    }).lean();

    // Use looseValue to match the DB string regardless of spacing or capitalization
    const approvedStudent = studentsInYear.find(
      (student) =>
        looseValue(student.name) === looseValue(inputName) &&
        looseValue(student.fatherName) === looseValue(inputFatherName)
    );

    if (!approvedStudent) {
      return NextResponse.json({
        approved: false,
        emailAvailable: false,
        message: getMismatchMessage(lang),
        mismatch: {
          name: true,
          fatherName: true,
          graduatedYear: false,
        },
      });
    }

    // Check if the alumni has already successfully registered an account
    if (approvedStudent.registered) {
      return NextResponse.json({
        approved: false,
        emailAvailable: false,
        message: msg(
          lang,
          "This approved register data is already registered with an account.",
          "ဤ approved register data ဖြင့် account ပြုလုပ်ပြီးသား ဖြစ်ပါသည်။",
        ),
        duplicate: {
          alumni: true,
        },
      });
    }

    // Fallback check against User collection just in case
    const existingUser = await User.findOne({ 
      name: approvedStudent.name, 
      fatherName: approvedStudent.fatherName, 
      graduatedYear: approvedStudent.graduatedYear 
    }).select("_id").lean();

    if (existingUser) {
      return NextResponse.json({
        approved: false,
        emailAvailable: false,
        message: msg(
          lang,
          "This approved register data is already registered with an account.",
          "ဤ approved register data ဖြင့် account ပြုလုပ်ပြီးသား ဖြစ်ပါသည်။",
        ),
        duplicate: {
          alumni: true,
        },
      });
    }

    // If they typed an email (happens during the second step validation checks)
    if (inputEmail) {
      const emailUser = await User.findOne({ email: inputEmail })
        .select("_id email")
        .lean();

      if (emailUser) {
        return NextResponse.json({
          approved: true,
          emailAvailable: false,
          message: msg(
            lang,
            "Approved data matched, but this email is already registered.",
            "Approved data ကိုက်ညီပါသည်။ သို့သော် ဤ Email သည် register လုပ်ပြီးသား ဖြစ်ပါသည်။",
          ),
          duplicate: {
            email: true,
            alumni: false,
          },
          student: {
            id: String(approvedStudent._id),
            name: approvedStudent.name,
            fatherName: approvedStudent.fatherName,
            graduatedYear: approvedStudent.graduatedYear,
          },
        });
      }
    }

    return NextResponse.json({
      approved: true,
      emailAvailable: true,
      message: msg(
        lang,
        "Approved. Register data matches admin approved data.",
        "အတည်ပြုပြီးပါပြီ။ Register data သည် Admin approved data နှင့် ကိုက်ညီပါသည်။",
      ),
      student: {
        id: String(approvedStudent._id),
        name: approvedStudent.name,
        fatherName: approvedStudent.fatherName,
        graduatedYear: approvedStudent.graduatedYear,
      },
    });
  } catch (error) {
    console.error("Check approved error:", error);

    return NextResponse.json(
      {
        approved: false,
        emailAvailable: false,
        message: "Server error.",
      },
      { status: 500 },
    );
  }
}