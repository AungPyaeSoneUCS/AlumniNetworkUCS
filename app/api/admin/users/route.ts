// file: app/api/admin/users/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function cleanUser(user: any) {
  return {
    _id: String(user._id),
    name: user.name || "",
    email: user.email || "",
    image: user.image || "",
    role: user.role || "user",
    isBlocked: Boolean(user.isBlocked),
    department: user.department || "",
    graduatedYear: user.graduatedYear || null,
    isProfilePublic: Boolean(user.isProfilePublic),
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      admin: null,
    };
  }

  await connectDB();

  const admin: any = await User.findOne({
    email: session.user.email,
  })
    .select("_id role isBlocked")
    .lean();

  if (!admin) {
    return {
      error: NextResponse.json({ error: "Admin not found" }, { status: 404 }),
      admin: null,
    };
  }

  if (admin.isBlocked) {
    return {
      error: NextResponse.json(
        { error: "Your account is blocked" },
        { status: 403 }
      ),
      admin: null,
    };
  }

  if (admin.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access only" },
        { status: 403 }
      ),
      admin: null,
    };
  }

  return { error: null, admin };
}

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";

    const filter: Record<string, any> = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "_id name email image role isBlocked department graduatedYear isProfilePublic createdAt updatedAt"
      )
      .lean();

    return NextResponse.json(users.map(cleanUser));
  } catch (error) {
    console.error("GET /api/admin/users error:", error);

    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { error, admin } = await requireAdmin();
    if (error) return error;

    const body = await req.json();

    const userId = String(body.userId || "").trim();
    const action = String(body.action || "").trim();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Missing userId or action" },
        { status: 400 }
      );
    }

    if (String(admin._id) === userId && action !== "make-admin") {
      return NextResponse.json(
        { error: "You cannot modify your own admin account here" },
        { status: 400 }
      );
    }

    const targetUser: any = await User.findById(userId).select("_id role");

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const update: Record<string, any> = {};

    if (action === "block") {
      update.isBlocked = true;
    } else if (action === "unblock") {
      update.isBlocked = false;
    } else if (action === "make-admin") {
      update.role = "admin";
    } else if (action === "make-user") {
      update.role = "user";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    )
      .select(
        "_id name email image role isBlocked department graduatedYear isProfilePublic createdAt updatedAt"
      )
      .lean();

    return NextResponse.json({
      success: true,
      user: cleanUser(updatedUser),
    });
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);

    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { error, admin } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim() || "";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (String(admin._id) === userId) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account" },
        { status: 400 }
      );
    }

    const targetUser = await User.findById(userId).select("_id");

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      deletedId: userId,
    });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);

    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}