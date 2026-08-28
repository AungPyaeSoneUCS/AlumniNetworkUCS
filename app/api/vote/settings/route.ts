// file: app/api/vote/settings/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Adjust path if needed
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

// Define a simple Settings Schema inline so you don't even need a separate model file if you don't want one
const SettingsSchema = new mongoose.Schema({
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
});

const Settings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

// GET: Fetch voting start/end times
export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.findOne() || { startDate: "", endDate: "" };
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json({ startDate: "", endDate: "" }, { status: 200 });
  }
}

// POST: Update voting start/end times (Admin Only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN" || !(session.user as any)?.isVoteSystem) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { startDate, endDate } = await req.json();
    await connectDB();

    // Now Settings is actively used here!
    const updatedSettings = await Settings.findOneAndUpdate(
      {}, 
      { startDate, endDate }, 
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Settings saved successfully", settings: updatedSettings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}