// app/api/posts/upload/route.ts
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { exec } from "child_process"; 

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Dual Authentication Helper: Web Cookie Session OR Mobile Header
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && mongoose.Types.ObjectId.isValid(mobileHeaderId)) {
    const user = await User.findById(mobileHeaderId).select("_id email").lean();
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id email")
        .lean();
      if (user) return user;
    }
  } catch (err) {
    // No active web session
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const currentUser = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    // MIME type check
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, and GIF allowed" },
        { status: 400 }
      );
    }

    // Size limit check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 15MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension safely
    const originalName = (file as File).name || "";
    let ext = originalName.split(".").pop()?.toLowerCase() || "";

    if (!ext || ext === originalName) {
      if (file.type === "image/png") ext = "png";
      else if (file.type === "image/webp") ext = "webp";
      else if (file.type === "image/gif") ext = "gif";
      else ext = "jpg";
    }

    const fileName = `post-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "photo",
      "posts",
      "upload"
    );

    // Create the directory if it does not exist WITH 755 PERMISSIONS
    await mkdir(uploadDir, { recursive: true, mode: 0o755 });
    
    // Save the file to the disk WITH 644 PERMISSIONS
    await writeFile(path.join(uploadDir, fileName), buffer, { mode: 0o644 });

    // Trigger PM2 restart with a 1-second delay
    setTimeout(() => {
      exec("pm2 restart next-app", (error, stdout, stderr) => {
        if (error) {
          console.error(`PM2 Restart Error: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`PM2 Restart stderr: ${stderr}`);
          return;
        }
        console.log(`PM2 Restart stdout: ${stdout}`);
      });
    }, 1000);

    return NextResponse.json(
      {
        url: `/photo/posts/upload/${fileName}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/posts/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}