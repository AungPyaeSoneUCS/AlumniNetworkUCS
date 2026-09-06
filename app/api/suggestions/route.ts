// app/api/suggestions/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import "@/models/User";
import "@/models/Job";
import User from "@/models/User";
import Job from "@/models/Job";

const FIELDS = ["position", "company", "location", "salary"] as const;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getAuthenticatedUser(req: Request) {
  await connectDB();

  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && mongoose.Types.ObjectId.isValid(mobileHeaderId)) {
    const user = await User.findById(mobileHeaderId).select("_id email").lean();
    if (user) return user;
  }

  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id email")
        .lean();
      if (user) return user;
    }
  } catch {
    // No active web session
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawField = searchParams.get("field")?.trim() || "position";
    const field = (FIELDS as readonly string[]).includes(rawField)
      ? rawField
      : "position";
    const q = searchParams.get("q")?.trim() || "";

    await connectDB();

    const cleanExpr = {
      $trim: { input: { $toString: `$experiences.${field}` } },
    };

    const matchExpr = q
      ? { $regexMatch: { input: cleanExpr, regex: escapeRegex(q), options: "i" } }
      : { $ne: [cleanExpr, ""] };

    const [experienceGroups, jobGroups] = await Promise.all([
      User.aggregate([
        { $unwind: { path: "$experiences", preserveNullAndEmptyArrays: false } },
        { $match: { isBlocked: { $ne: true }, $expr: matchExpr } },
        {
          $group: {
            _id: { $toLower: cleanExpr },
            sample: { $first: cleanExpr },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Job.aggregate([
        {
          $match: q
            ? { isActive: true, [field]: { $regex: escapeRegex(q), $options: "i" } }
            : { isActive: true, [field]: { $ne: "" } },
        },
        {
          $group: {
            _id: { $toLower: { $trim: { input: { $toString: `$${field}` } } } },
            sample: { $first: { $trim: { input: { $toString: `$${field}` } } } },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
    ]);

    const counts = new Map<string, { value: string; total: number }>();

    for (const group of [...experienceGroups, ...jobGroups]) {
      const value = group.sample ? String(group.sample).trim() : "";
      if (!value) continue;

      const key = value.toLowerCase();

      const current = counts.get(key);
      if (current) {
        current.total += group.count ?? 1;
      } else {
        counts.set(key, { value, total: group.count ?? 1 });
      }
    }

    let suggestions = [...counts.values()];

    if (field === "salary") {
      suggestions = suggestions
        .map((item) => ({ ...item, value: item.value.replace(/[^\d]/g, "") }))
        .filter((item) => item.value.length >= 3);
    }

    suggestions = [
      ...suggestions
        .reduce((seen, item) => {
          const key = item.value.toLowerCase();
          if (!seen.has(key)) seen.set(key, item);
          return seen;
        }, new Map<string, (typeof suggestions)[number]>())
        .values(),
    ]
      .sort(
        field === "salary"
          ? (a, b) => Number(a.value) - Number(b.value)
          : (a, b) => b.total - a.total || a.value.localeCompare(b.value),
      )
      .slice(0, 20);

    return NextResponse.json(
      { success: true, field, suggestions: suggestions.map((item) => item.value) },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/suggestions error:", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}