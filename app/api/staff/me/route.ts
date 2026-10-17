// file: app/api/staff/me/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function cleanStaff(user: any) {
  return {
    _id: String(user.id),
    name: user.name || "",
    email: user.email || "",
    image: user.image || "",
    role: user.role || "user",
    position: user.position || "",
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

    const staff: any = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        position: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    if (staff.isBlocked) {
      return NextResponse.json(
        { error: "Your account is blocked" },
        { status: 403 }
      );
    }

    // Allow both "staff" and "admin" roles to log into the staff portal
    if (staff.role !== "staff" && staff.role !== "admin") {
      return NextResponse.json(
        { error: "Staff or Admin access only" },
        { status: 403 }
      );
    }

    return NextResponse.json(cleanStaff(staff));
  } catch (error) {
    console.error("GET /api/staff/me error:", error);

    return NextResponse.json(
      { error: "Failed to load staff session" },
      { status: 500 }
    );
  }
}
