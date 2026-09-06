// file: app/api/admin/import-data/route.ts

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

  const admin: any = await User.findOne({ email: session.user.email })
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

function toDocId(value: any) {
  if (typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return value;
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value === "object" && value !== null && "name" in value && "arrayBuffer" in value;
}

// POST /api/admin/import-data
// Accepts one or more `files` (multipart). Each filename becomes the collection:
//   posts.json -> collection `posts`
// Documents that already exist (same `_id`) are skipped, never overwritten.
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    await connectDB();
    const db = await getDb();

    const formData = await req.formData();
    const files = formData.getAll("files").filter(isFile);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results: {
      filename: string;
      collection: string;
      inserted: number;
      skipped: number;
      error?: string;
    }[] = [];

    for (const file of files) {
      const filename = file.name || "";
      const collectionName = filename.replace(/\.json$/i, "");

      if (!/^[a-zA-Z0-9_]+$/.test(collectionName) || collectionName.startsWith("system.")) {
        results.push({
          filename,
          collection: "",
          inserted: 0,
          skipped: 0,
          error: "Invalid collection name",
        });
        continue;
      }

try {
          const text = await file.text();
          let docs: any = JSON.parse(text);
          if (!Array.isArray(docs)) docs = [docs];

          const coll = db.collection(collectionName);
          let inserted = 0;
          let skipped = 0;

          for (const doc of docs) {
            if (!doc || typeof doc !== "object") {
              skipped++;
              continue;
            }

            delete doc.__v;

            try {
              const id = toDocId(doc._id);
              const copy = { ...doc };
              delete copy._id;

              if (id === undefined || id === null || id === "") {
                await coll.insertOne(copy);
                inserted++;
                continue;
              }

              const exists = await coll.findOne({ _id: id });
              if (exists) {
                skipped++;
                continue;
              }

              copy._id = id;
              await coll.insertOne(copy);
              inserted++;
            } catch {
              // duplicate or invalid document — skip it
              skipped++;
            }
          }

          results.push({ filename, collection: collectionName, inserted, skipped });
        } catch (err: any) {
          results.push({
            filename,
            collection: collectionName,
            inserted: 0,
            skipped: 0,
            error: (err?.message as string) || String(err),
          });
        }
    }

    return NextResponse.json({ success: true, results }, { status: 200 });
  } catch (err) {
    console.error("POST /api/admin/import-data error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}