// file: app/api/register/years/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find all distinct "graduatedYear" values from students who are approved
    const rows = await prisma.approvedStudent.groupBy({
      by: ["graduatedYear"],
      where: { approved: true },
    });
    const rawYears = rows.map((r) => r.graduatedYear);

    // 1. Ensure every value is a string (prevents the localeCompare error)
    // 2. Sort the strings alphabetically in descending order
    const years = rawYears
      .map((year: any) => String(year))
      .sort((a: string, b: string) => b.localeCompare(a));

    return NextResponse.json({ years }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch graduated years:", error);
    return NextResponse.json(
      { error: "Failed to fetch graduated years" },
      { status: 500 }
    );
  }
}