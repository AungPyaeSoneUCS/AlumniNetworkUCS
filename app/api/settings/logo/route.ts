// file: app/api/settings/logo/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";

// 1. Database Connection Setup
const MONGODB_URI = process.env.MONGODB_URI as string;

async function dbConnect() {
  // If already connected, do nothing
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for Logo Settings");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// 2. Mongoose Schema Setup
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

// 3. GET: Fetch the current logo for the Nav bar
export async function GET() {
  try {
    await dbConnect();

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

// 4. POST: Save the newly uploaded dynamic logo
export async function POST(req: Request) {
  try {
    // Optional: Protect this route using next-auth so only logged-in users/admins can change the logo
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    await dbConnect();

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