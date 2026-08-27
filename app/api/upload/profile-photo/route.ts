// file: app/api/upload/profile-photo/route.ts
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Identify current user either by Mobile Header ID or Web Session Email
    let user: any = null;
    
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      user = await User.findById(mobileUserId);
    } else if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 15 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const userId = user._id.toString();

    // Safely build the path to the directory
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "photo",
      userId,
      "profile"
    );

    // Create the directory if it does not exist WITH 755 PERMISSIONS
    await mkdir(uploadDir, { recursive: true, mode: 0o755 });

    // Extract the actual extension from the uploaded file (e.g., .jpg, .png)
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `profile-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Save the file to the disk WITH 644 PERMISSIONS
    await writeFile(filePath, buffer, { mode: 0o644 });

    // Save the public URL to the database
    const imageUrl = `/uploads/photo/${userId}/profile/${fileName}`;

    user.image = imageUrl;
    await user.save();

    // --- PM2 RESTART LOGIC ---
    // We use setTimeout to ensure the success response reaches the user's device FIRST.
    // If we restart immediately, the connection drops and the app throws a network error.
    setTimeout(() => {
      // Restart PM2 with a umask that ensures 755 directory and 644 file permissions
      exec("pm2 restart next-app --update-env -- -umask 0022", (error, stdout, stderr) => {
        if (error) {
          console.error("Failed to restart PM2:", error);
          return;
        }
        console.log("PM2 Restart Triggered Successfully:", stdout);
      });
    }, 1500);

    return NextResponse.json(
      {
        message: "Profile photo uploaded successfully. Server is restarting.",
        image: imageUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile photo upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload profile photo" },
      { status: 500 }
    );
  }
}