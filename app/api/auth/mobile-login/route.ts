// app/api/auth/mobile-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // or your hashing library
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user and include password field
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, message: "Your account is temporarily suspended" },
        { status: 403 }
      );
    }

    // Verify password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Prepare safe user object (omit password)
    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: userObject,
        // If you use JWT, you can also generate and return: token: generateToken(user._id)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}