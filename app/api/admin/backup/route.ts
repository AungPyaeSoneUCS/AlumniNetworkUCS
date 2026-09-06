// file: app/api/admin/backup/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  await connectDB();

  const admin: any = await User.findOne({
    email: session.user.email,
  })
    .select("_id role isBlocked")
    .lean();

  if (!admin) {
    return { error: NextResponse.json({ error: "Admin not found" }, { status: 404 }) };
  }

  if (admin.isBlocked) {
    return {
      error: NextResponse.json({ error: "Your account is blocked" }, { status: 403 }),
    };
  }

  if (admin.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Admin access only" }, { status: 403 }),
    };
  }

  return { error: null };
}

async function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");
  return db;
}

async function listCollectionNames() {
  const names: string[] = [];
  const collections = await (await getDb()).listCollections().toArray();

  for (const item of collections) {
    if (!item.name || item.name.startsWith("system.")) continue;
    names.push(item.name);
  }

  return names.sort();
}

// GET /api/admin/backup            -> JSON: { collections: [{ name, count }] }
// GET /api/admin/backup?name=users -> Downloads `users.json`
export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") || "").trim();

    // Download a single collection as a JSON file
    if (name) {
      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        return NextResponse.json({ error: "Invalid collection name" }, { status: 400 });
      }

      const names = await listCollectionNames();
      if (!names.includes(name)) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }

      const docs = await (await getDb()).collection(name).find({}).toArray();

      const json = JSON.stringify(docs, null, 2);

      return new Response(json, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}.json"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // Otherwise return the list of all collections with document counts
    const names = await listCollectionNames();

    const collections: { name: string; count: number }[] = [];
    for (const collectionName of names) {
      try {
        const count = await (await getDb())
          .collection(collectionName)
          .estimatedDocumentCount();
        collections.push({ name: collectionName, count });
      } catch {
        collections.push({ name: collectionName, count: 0 });
      }
    }

    return NextResponse.json({ collections }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/backup error:", err);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}