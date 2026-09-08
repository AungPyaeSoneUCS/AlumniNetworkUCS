// file: app/api/jobs/[id]/apply/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import JobApplication from "@/models/JobApplication";
import Job from "@/models/Job";

// POST /api/jobs/[id]/apply - Submit a job application
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
    }

    const body = await req.json();
    const { coverLetter, name, email, phone, experienceId } = body;

    if (!coverLetter || !name || !email) {
      return NextResponse.json({ error: "name, email and coverLetter are required" }, { status: 400 });
    }

    await connectDB();

    let currentUser: any = null;
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id name email").lean();
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id name email").lean();
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Look up the job. Jobs are community-posted; if not in Job model, allow applying
    // by recording the experience reference. Keep it simple and permissive.
    let jobTitle = "";
    let jobCompany = "";
    const jobDoc = await Job.findById(id).select("title company").lean();
    if (jobDoc) {
      jobTitle = jobDoc.title;
      jobCompany = jobDoc.company;
    }

    // Prevent duplicate applications to the same job from the same applicant
    const existing = await JobApplication.findOne({ jobId: id, applicant: currentUser._id }).lean();
    if (existing) {
      return NextResponse.json({ error: "You have already applied to this job." }, { status: 409 });
    }

    const application = await JobApplication.create({
      jobId: id,
      applicant: currentUser._id,
      title: jobTitle,
      company: jobCompany,
      coverLetter,
      name,
      email,
      phone: phone || "",
      experienceId: experienceId || "",
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      application: {
        _id: String(application._id),
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
