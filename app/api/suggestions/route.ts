// app/api/suggestions/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

const FIELDS = ["position", "company", "location", "salary", "graduatedYear"] as const;
const JOB_FIELDS = ["company", "location", "salary"] as const;

async function getAuthenticatedUser(req: Request) {
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && isValidId(mobileHeaderId)) {
    const user = await prisma.user.findUnique({
      where: { id: mobileHeaderId },
      select: { id: true, email: true },
    });
    if (user) return user;
  }

  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
      if (user) return user;
    }
  } catch {
    // No active web session
  }

  return null;
}

function matchesValue(value: unknown, q: string) {
  const trimmed = String(value ?? "").trim();
  if (!q) return trimmed !== "";
  return trimmed.toLowerCase().includes(q.toLowerCase());
}

function groupValues(values: string[]) {
  const map = new Map<string, { sample: string; count: number }>();

  for (const raw of values) {
    const sample = String(raw ?? "").trim();
    if (!sample) continue;
    const key = sample.toLowerCase();
    const current = map.get(key);
    if (current) {
      current.count += 1;
    } else {
      map.set(key, { sample, count: 1 });
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 50);
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

    let experienceGroups: { sample: string; count: number }[] = [];
    let jobGroups: { sample: string; count: number }[] = [];

    if (field === "graduatedYear") {
      const users = await prisma.user.findMany({
        where: { isBlocked: false },
        select: { graduatedYear: true },
      });

      const values = users
        .map((u) => u.graduatedYear)
        .filter((v) => matchesValue(v, q));

      experienceGroups = groupValues(values);
    } else {
      const activeUsers = await prisma.user.findMany({
        where: { isBlocked: false },
        select: { id: true },
      });
      const activeUserIds = activeUsers.map((u) => u.id);

      const experiences = activeUserIds.length
        ? await prisma.experience.findMany({
            where: { userId: { in: activeUserIds } },
          })
        : [];

      const experienceValues = experiences
        .map((exp) => (exp as any)[field])
        .filter((v) => matchesValue(v, q));

      experienceGroups = groupValues(experienceValues);

      if ((JOB_FIELDS as readonly string[]).includes(field)) {
        const where: any = { isActive: true };
        where[field] = q ? { contains: q } : { not: "" };

        const jobs = await prisma.job.findMany({ where });

        const jobValues = jobs
          .map((job) => (job as any)[field])
          .filter((v) => matchesValue(v, q));

        jobGroups = groupValues(jobValues);
      }
    }

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
