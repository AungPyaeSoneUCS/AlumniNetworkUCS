// file: app/api/posts/upload/route.ts

import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { auth } from "@/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 }
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, GIF allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
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

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json({
      url: `/photo/posts/upload/${fileName}`,
    });
  } catch (error) {
    console.error("POST /api/posts/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}