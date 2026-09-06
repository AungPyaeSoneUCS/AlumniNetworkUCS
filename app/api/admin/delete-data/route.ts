// file: app/api/admin/delete-data/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), admin: null };
  }

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role isBlocked")
    .lean();

  if (!admin) {
    return { error: NextResponse.json({ error: "Admin not found" }, { status: 404 }), admin: null };
  }

  if (admin.isBlocked) {
    return {
      error: NextResponse.json({ error: "Your account is blocked" }, { status: 403 }),
      admin: null,
    };
  }

  if (admin.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Admin access only" }, { status: 403 }),
      admin: null,
    };
  }

  return { error: null, admin };
}

async function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");
  return db;
}

// DELETE /api/admin/delete-data?name=posts&confirm=posts
export async function DELETE(req: Request) {
  try {
    const { error, admin } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") || "").trim();
    const confirm = (searchParams.get("confirm") || "").trim();

    if (!/^[a-zA-Z0-9_]+$/.test(name) || name.startsWith("system.")) {
      return NextResponse.json({ error: "Invalid collection name" }, { status: 400 });
    }

    if (confirm !== name) {
      return NextResponse.json(
        { error: "Type the exact collection name to confirm deletion." },
        { status: 409 }
      );
    }

    await connectDB();
    const db = await getDb();

    const names = (await db.listCollections().toArray())
      .map((item) => item.name)
      .filter((item) => !item.startsWith("system."));

    if (!names.includes(name)) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const filter =
      name === "users" && admin?._id
        ? { _id: { $ne: admin._id } } // keep the current admin login safe
        : {};

    const result = await db.collection(name).deleteMany(filter);

    return NextResponse.json(
      {
        success: true,
        collection: name,
        deletedCount: result.deletedCount ?? 0,
        protectedAdmin: name === "users" && !!admin?._id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/admin/delete-data error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}