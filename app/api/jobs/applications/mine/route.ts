// file: app/api/jobs/applications/mine/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

// GET /api/jobs/applications/mine - List current user's job applications
export async function GET(req: Request) {
  try {
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let currentUser: { id: string } | null = null;
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

    const applications = await prisma.jobApplication.findMany({
      where: { applicant: currentUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      applications.map((app) => ({
        _id: String(app.id),
        jobId: String(app.jobId),
        title: app.title || "",
        company: app.company || "",
        coverLetter: app.coverLetter || "",
        name: app.name || "",
        email: app.email || "",
        phone: app.phone || "",
        status: app.status,
        createdAt: app.createdAt,
      }))
    );
  } catch (error) {
    console.error("GET my applications error:", error);
    return NextResponse.json(
      { error: "Failed to load applications" },
      { status: 500 }
    );
  }
}
