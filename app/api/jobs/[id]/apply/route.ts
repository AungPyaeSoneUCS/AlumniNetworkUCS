// file: app/api/jobs/[id]/apply/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

// POST /api/jobs/[id]/apply - Submit a job application
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const body = await req.json();
    const { coverLetter, name, email, phone, experienceId } = body;

    if (!coverLetter || !name || !email) {
      return NextResponse.json({ error: "name, email and coverLetter are required" }, { status: 400 });
    }

    let currentUser: { id: string; name: string; email: string } | null = null;
    if (mobileUserId && isValidId(mobileUserId)) {
      currentUser = await prisma.user.findUnique({
        where: { id: mobileUserId },
        select: { id: true, name: true, email: true },
      });
    } else if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true },
      });
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Look up the job. Jobs are community-posted; if not in Job model, allow applying
    // by recording the experience reference. Keep it simple and permissive.
    let jobTitle = "";
    let jobCompany = "";
    const jobDoc = await prisma.job.findUnique({
      where: { id },
      select: { title: true, company: true },
    });
    if (jobDoc) {
      jobTitle = jobDoc.title;
      jobCompany = jobDoc.company;
    }

    // Prevent duplicate applications to the same job from the same applicant
    const existing = await prisma.jobApplication.findFirst({
      where: { jobId: id, applicant: currentUser.id },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already applied to this job." }, { status: 409 });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        applicant: currentUser.id,
        title: jobTitle,
        company: jobCompany,
        coverLetter,
        name,
        email,
        phone: phone || "",
        experienceId: experienceId || "",
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      application: {
        _id: String(application.id),
        status: application.status,
        jobId: String(application.jobId),
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("POST job apply error:", error);
    return NextResponse.json(
      { error: "Failed to submit job application" },
      { status: 500 }
    );
  }
}
