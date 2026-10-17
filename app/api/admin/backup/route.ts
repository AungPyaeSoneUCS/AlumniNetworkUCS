// file: app/api/admin/backup/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const TABLE_DELEGATES: Record<string, any> = {
  approved_students: prisma.approvedStudent,
  contact_settings: prisma.contactSetting,
  experiences: prisma.experience,
  job_applications: prisma.jobApplication,
  jobs: prisma.job,
  message_reactions: prisma.messageReaction,
  messages: prisma.message,
  notifications: prisma.notification,
  otps: prisma.otp,
  post_comments: prisma.postComment,
  post_likes: prisma.postLike,
  posts: prisma.post,
  push_tokens: prisma.pushToken,
  settings: prisma.setting,
  students: prisma.student,
  users: prisma.user,
  vote_projects: prisma.voteProject,
  vote_users: prisma.voteUser,
};

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, isBlocked: true },
  });

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

  return { error: null, admin };
}

function listTableNames() {
  return Object.keys(TABLE_DELEGATES).sort();
}

// GET /api/admin/backup            -> JSON: { collections: [{ name, count }] }
// GET /api/admin/backup?name=users -> Downloads `users.json`
export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const name = (searchParams.get("name") || "").trim();

    if (name) {
      if (!/^[a-zA-Z0-9_]+$/.test(name)) {
        return NextResponse.json({ error: "Invalid collection name" }, { status: 400 });
      }

      const names = listTableNames();
      if (!names.includes(name)) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }

      const docs = await TABLE_DELEGATES[name].findMany();

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

    const names = listTableNames();

    const collections: { name: string; count: number }[] = [];
    for (const collectionName of names) {
      try {
        const count = await TABLE_DELEGATES[collectionName].count();
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
