// file: app/api/staff/profile/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    // 1. Verify user authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const body = await req.json();
    const { name, password } = body;

    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Staff name is required." },
        { status: 400 }
      );
    }

    // 3. Connect to database
    await connectDB();

    // 4. Verify staff or admin role
    const currentUser: any = await User.findOne({ email: session.user.email }).lean();
    if (!currentUser || (currentUser.role !== "staff" && currentUser.role !== "admin")) {
      return NextResponse.json(
        { error: "Forbidden. Staff access required." },
        { status: 403 }
      );
    }

    // 5. Prepare update payload (name and optional password only)
    const updateData: { name: string; password?: string } = {
      name: trimmedName,
    };

    // 6. Handle password hashing if provided
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // 7. Update user profile in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Staff user not found." },
        { status: 404 }
      );
    }

    // 8. Return response
    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",
        user: {
          name: updatedUser.name,
          email: updatedUser.email,
          position: updatedUser.position || "Staff",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Staff Profile Update Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}