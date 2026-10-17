// file: app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // --- DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Identify current user either by Mobile Header ID or Web Session Email
    let currentUser: any = null;

    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.notification.deleteMany({
      where: { id, receiver: currentUser.id },
    });

    return NextResponse.json({
      success: true,
      message: "Notification cleared only",
    });
  } catch (error) {
    console.error("Delete notification failed:", error);

    return NextResponse.json(
      { error: "Delete notification failed" },
      { status: 500 }
    );
  }
}
