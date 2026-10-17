// file: app/api/notifications/register-push/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { expoPushToken, platform } = body;

    if (!expoPushToken || typeof expoPushToken !== "string") {
      return NextResponse.json({ error: "expoPushToken is required" }, { status: 400 });
    }

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

    // Upsert the push token for this user (remove stale tokens for same user+token)
    await prisma.pushToken.upsert({
      where: { expoPushToken },
      update: { user: currentUser.id, platform: platform || "android" },
      create: {
        user: currentUser.id,
        expoPushToken,
        platform: platform || "android",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST register-push error:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}
