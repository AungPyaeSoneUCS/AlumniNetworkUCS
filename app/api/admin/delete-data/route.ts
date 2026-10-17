// file: app/api/admin/delete-data/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDelegate, resolveCollectionName } from "@/lib/admin-collections";

export const runtime = "nodejs";
export const maxDuration = 3600;

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
    const requested = (searchParams.get("name") || "").trim();
    const confirm = (searchParams.get("confirm") || "").trim();

    const name = resolveCollectionName(requested);

    if (!name) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Confirmation must match exactly what the caller sees (raw or canonical).
    if (confirm !== requested && confirm !== name) {
      return NextResponse.json(
        { error: "Type the exact collection name to confirm deletion." },
        { status: 409 },
      );
    }

    const delegate = getDelegate(name);
    if (!delegate) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const where =
      name === "users" && admin?.id ? { id: { not: admin.id } } : {};

    const result = await delegate.deleteMany({ where });

    return NextResponse.json(
      {
        success: true,
        collection: name,
        deletedCount: result.count ?? 0,
        protectedAdmin: name === "users" && !!admin?.id,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("DELETE /api/admin/delete-data error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
