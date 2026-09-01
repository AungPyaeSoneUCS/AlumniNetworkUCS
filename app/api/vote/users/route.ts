// file: app/api/vote/users/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Adjust this import path if your auth.ts is elsewhere
import { connectDB } from "@/lib/mongodb";
import VoteUser from "@/models/VoteUser";

// --- Helper Functions ---

// 1. Verify Admin access to keep code DRY
async function verifyAdminAccess() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user ||
    (session.user as any).role !== "ADMIN" ||
    !(session.user as any).isVoteSystem
  ) {
    return false;
  }
  return true;
}

// 2. Strict Email Domain Validation
const isValidDomain = (email: string) => {
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@ucsh.edu.mm");
};

// ==========================================
// POST: Create a new user (Add)
// ==========================================
export async function POST(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized: Only Admins can create accounts." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required." }, { status: 400 });
    }

    if (!isValidDomain(email)) {
      return NextResponse.json({ error: "Email must end with @gmail.com or @ucsh.edu.mm only." }, { status: 400 });
    }

    if (!["TEAM", "VOTER"].includes(role.toUpperCase())) {
      return NextResponse.json({ error: "Invalid role. Must be 'TEAM' or 'VOTER'." }, { status: 400 });
    }

    await connectDB();
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await VoteUser.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await VoteUser.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role.toUpperCase(),
    });

    return NextResponse.json(
      {
        message: `${newUser.role} account created successfully.`,
        user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, role: newUser.role },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create VoteUser:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// GET: Fetch list of users (Read)
// ==========================================
export async function GET(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    await connectDB();

    // Support optional role filtering (e.g., /api/vote/users?role=VOTER)
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");

    const query = roleFilter ? { role: roleFilter.toUpperCase() } : { role: { $ne: "ADMIN" } }; // Hide admins by default

    // Fetch users and exclude passwords from the payload
    const users = await VoteUser.find(query).select("-password").sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch VoteUsers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// PUT: Update an existing user (Update)
// ==========================================
export async function PUT(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized: Only Admins can update accounts." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, email, role, password } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required for updating." }, { status: 400 });
    }

    await connectDB();

    // Prepare update object
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role.toUpperCase();
    
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      
      // Server-side Domain check for updates
      if (!isValidDomain(normalizedEmail)) {
        return NextResponse.json({ error: "Email must end with @gmail.com or @ucsh.edu.mm only." }, { status: 400 });
      }

      // Ensure the new email isn't already taken by someone else
      const existingEmail = await VoteUser.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existingEmail) {
        return NextResponse.json({ error: "This email is already in use by another account." }, { status: 409 });
      }
      updateData.email = normalizedEmail;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await VoteUser.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Account updated successfully.", user: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update VoteUser:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// DELETE: Remove a user entirely (Delete)
// ==========================================
export async function DELETE(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json({ error: "Unauthorized: Only Admins can delete accounts." }, { status: 403 });
    }

    // Get the ID from the query URL (e.g., /api/vote/users?id=123)
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required to delete." }, { status: 400 });
    }

    await connectDB();

    const deletedUser = await VoteUser.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Account deleted successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete VoteUser:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}