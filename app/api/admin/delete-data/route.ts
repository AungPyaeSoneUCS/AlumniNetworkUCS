// file: app/api/admin/delete-data/route.ts

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
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), admin: null };
  }

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, isBlocked: true },
  });

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

    const delegate = TABLE_DELEGATES[name];
    if (!delegate) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const where =
      name === "users" && admin?.id
        ? { id: { not: admin.id } }
        : {};

    const result = await delegate.deleteMany({ where });

    return NextResponse.json(
      {
        success: true,
        collection: name,
        deletedCount: result.count ?? 0,
        protectedAdmin: name === "users" && !!admin?.id,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /api/admin/delete-data error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
