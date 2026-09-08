// file: app/api/jobs/applications/mine/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import JobApplication from "@/models/JobApplication";

// GET /api/jobs/applications/mine - List current user's job applications
export async function GET(req: Request) {
  try {
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    let currentUser: any = null;
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id").lean();
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id").lean();
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const applications = await JobApplication.find({ applicant: currentUser._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      applications.map((app: any) => ({
        _id: String(app._id),
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
