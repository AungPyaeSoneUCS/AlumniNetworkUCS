// file: app/api/upload/profile-photo/route.ts

import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

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

    const maxSize = 5 * 1024 * 1024; // 5MB

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

    // Create the directory if it does not exist
    await mkdir(uploadDir, { recursive: true });

    // FIX: Extract the actual extension from the uploaded file (e.g., .jpg, .png)
    // Fallback to .jpg if no extension is found
    const ext = path.extname(file.name) || ".jpg";
    const fileName = `profile-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Save the file to the disk
    await writeFile(filePath, buffer);

    // Save the public URL to the database
    const imageUrl = `/uploads/photo/${userId}/profile/${fileName}`;

    user.image = imageUrl;
    await user.save();

    return NextResponse.json(
      {
        message: "Profile photo uploaded successfully",
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