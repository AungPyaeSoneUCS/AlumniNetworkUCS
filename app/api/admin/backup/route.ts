// file: app/api/admin/backup/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  COLLECTION_NAMES,
  getDelegate,
  resolveCollectionName,
} from "@/lib/admin-collections";

export const runtime = "nodejs";
export const maxDuration = 3600;

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

// GET /api/admin/backup            -> JSON: { collections: [{ name, count }] }
// GET /api/admin/backup?name=users -> Downloads `users.json`
export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const requested = (searchParams.get("name") || "").trim();

    if (requested) {
      const name = resolveCollectionName(requested);

      if (!name) {
        return NextResponse.json({ error: "Collection not found" }, { status: 404 });
      }

      const delegate = getDelegate(name);
      const docs = await delegate.findMany();

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

    const collections: { name: string; count: number }[] = [];
    for (const collectionName of COLLECTION_NAMES) {
      try {
        const count = await getDelegate(collectionName).count();
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
