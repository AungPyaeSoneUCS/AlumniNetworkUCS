// file: app/api/settings/logo/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/auth";

// 1. Define CORS headers for Web and Mobile cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // In production, replace "*" with your specific domains if needed
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
  "Access-Control-Allow-Credentials": "true",
};

// 2. Mongoose Schema Setup
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times in development
const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

// 3. OPTIONS: Handle preflight CORS requests from Mobile/Web clients
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// 4. GET: Fetch the current logo for the Nav bar (Web & Mobile)
export async function GET() {
  try {
    await connectDB();

    const logoSetting = await Setting.findOne({ key: "siteLogo" });
    
    return NextResponse.json(
      { logoUrl: logoSetting ? logoSetting.value : "/logo/logo-250.png" },
      { status: 200, headers: corsHeaders } // Inject CORS headers
    );
  } catch (error) {
    console.error("GET Logo Error:", error);
    
    // Fail fast with a 500 error to prevent Nginx 504 timeouts
    return NextResponse.json(
      { error: "Failed to fetch logo" },
      { status: 500, headers: corsHeaders } 
    );
  }
}

// 5. POST: Save the newly uploaded dynamic logo (Web & Mobile)
export async function POST(req: Request) {
  try {
    // Authenticate using NextAuth v5
    const session = await auth(); 
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." }, 
        { status: 401, headers: corsHeaders }
      );
    }

    await connectDB(); 

    const body = await req.json();
    const { logoUrl } = body;

    if (!logoUrl) {
      return NextResponse.json(
        { error: "Logo URL (Base64) is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Upsert logic: Update the existing "siteLogo" document, or create it if missing
    const updatedSetting = await Setting.findOneAndUpdate(
      { key: "siteLogo" },
      { value: logoUrl },
      { upsert: true, new: true } 
    );

    return NextResponse.json(
      { success: true, logoUrl: updatedSetting.value },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("POST Logo Error:", error);
    return NextResponse.json(
      { error: "Failed to update logo" },
      { status: 500, headers: corsHeaders }
    );
  }
}