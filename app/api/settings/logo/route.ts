// file: app/api/settings/logo/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/auth";

// Mongoose Schema Setup
// We use a generic 'Setting' collection to store the logo, allowing you to add more settings later
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times in development
const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

// GET: Fetch the current logo for the Nav bar
export async function GET() {
  try {
    // <-- Use centralized, cached database connection
    await connectDB(); 

    // Look for the specific setting with the key "siteLogo"
    const logoSetting = await Setting.findOne({ key: "siteLogo" });
    
    return NextResponse.json(
      { logoUrl: logoSetting ? logoSetting.value : "/logo/logo-250.png" },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Logo Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500 }
    );
  }
}

// POST: Save the newly uploaded dynamic logo
export async function POST(req: Request) {
  try {
    // <-- Use NextAuth v5 pattern to match the rest of your app
    const session = await auth(); 
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // <-- Use centralized, cached database connection
    await connectDB(); 

    const body = await req.json();
    const { logoUrl } = body;

    if (!logoUrl) {
      return NextResponse.json(
        { error: "Logo URL (Base64) is required" },
        { status: 400 }
      );
    }

    // Upsert logic: Update the existing "siteLogo" document, or create it if it doesn't exist
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: "siteLogo" },
      { value: logoUrl },
      { upsert: true, new: true } // upsert: true creates it if missing
    );

    return NextResponse.json(
      { success: true, logoUrl: updatedSetting.value },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Logo Error:", error);
    return NextResponse.json(
      { error: "Failed to update logo" },
      { status: 500 }
    );
  }
}