// file: app/api/register/years/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ApprovedStudent from "@/models/ApprovedStudent";

export async function GET() {
  try {
    await connectDB();
    
    // Find all distinct "graduatedYear" values from students who are approved
    const rawYears = await ApprovedStudent.distinct("graduatedYear", { approved: true });
    
    // 1. Ensure every value is a string (prevents the localeCompare error)
    // 2. Sort the strings alphabetically in descending order
    const years = rawYears
      .map((year) => String(year))
      .sort((a, b) => b.localeCompare(a));

    return NextResponse.json({ years }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch graduated years:", error);
    return NextResponse.json(
      { error: "Failed to fetch graduated years" },
      { status: 500 }
    );
  }
}