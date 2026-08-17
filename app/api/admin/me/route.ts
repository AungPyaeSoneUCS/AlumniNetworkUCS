// file: app/api/admin/me/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function cleanAdmin(user: any) {
  return {
    _id: String(user._id),
    name: user.name || "",
    email: user.email || "",
    image: user.image || "",
    role: user.role || "user",
    isBlocked: Boolean(user.isBlocked),
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const admin: any = await User.findOne({
      email: session.user.email,
    })
      .select("_id name email image role isBlocked createdAt updatedAt")
      .lean();

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (admin.isBlocked) {
      return NextResponse.json(
        { error: "Your account is blocked" },
        { status: 403 }
      );
    }

    if (admin.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access only" },
        { status: 403 }
      );
    }

    return NextResponse.json(cleanAdmin(admin));
  } catch (error) {
    console.error("GET /api/admin/me error:", error);

    return NextResponse.json(
      { error: "Failed to load admin" },
      { status: 500 }
    );
  }
}