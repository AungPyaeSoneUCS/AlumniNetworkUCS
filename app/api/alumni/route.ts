// app/api/alumni/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

// Pre-register all models to avoid Mongoose MissingSchemaError during population / relations
import "@/models/User";
import "@/models/ApprovedStudent";
import "@/models/ContactSetting";
import "@/models/Job";
import "@/models/Message";
import "@/models/Notification";
import "@/models/Otp";
import "@/models/Post";

import User from "@/models/User";
import Post from "@/models/Post";
import Job from "@/models/Job";

// ==========================================
// 1. GET: Fetch Alumni List or Single Alumni
// ==========================================
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search")?.trim() || "";
    const degree = searchParams.get("degree")?.trim() || "";
    const graduatedYear = searchParams.get("graduatedYear")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // --- CASE A: Fetch Single Alumni by ID with related activity ---
    if (id) {
      const user = await User.findById(id)
        .select("-password")
        .lean();

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Alumni profile not found" },
          { status: 404 }
        );
      }

      // Fetch user's recent posts and posted jobs in parallel
      const [recentPosts, recentJobs] = await Promise.all([
        Post.find({ author: id })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .catch(() => []),
        Job.find({ postedBy: id })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .catch(() => []),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...user,
            recentPosts,
            recentJobs,
          },
        },
        { status: 200 }
      );
    }

    // --- CASE B: Fetch Filtered Alumni Directory ---
    const query: Record<string, any> = {
      isBlocked: false,
      isProfilePublic: true,
    };

    if (role) {
      query.role = role;
    }

    if (degree) {
      query.degree = degree;
    }

    if (graduatedYear) {
      query.graduatedYear = graduatedYear;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
        { "contactInfo.company": { $regex: search, $options: "i" } },
        { "experiences.company": { $regex: search, $options: "i" } },
      ];
    }

    const [total, alumniList] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select("-password")
        .sort({ graduatedYear: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: alumniList,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + alumniList.length < total,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/alumni GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. PUT: Update Alumni Profile Info
// ==========================================
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent direct modification of sensitive authentication fields through this route
    delete updateData.password;
    delete updateData.role;
    delete updateData.isBlocked;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/alumni PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}