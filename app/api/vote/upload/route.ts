// file: app/api/vote/upload/route.ts
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// =======================================================================
// POST: Lets a logged-in TEAM upload an image for their project photo.
// Saves the file to /public/photo/vote and returns its public URL.
// =======================================================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !session.user ||
      (session.user as any).role !== "TEAM" ||
      !(session.user as any).isVoteSystem
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Only Team accounts can upload images." },
        { status: 401 }
      );
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
        { error: "Only JPG, PNG, and WEBP images are allowed." },
        { status: 400 }
      );
    }

    // Size limit check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 15MB." },
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
      else ext = "jpg";
    }

    const fileName = `vote-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "photo", "vote");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), buffer);

    return NextResponse.json(
      { url: `/photo/vote/${fileName}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/vote/upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}