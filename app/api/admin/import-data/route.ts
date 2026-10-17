// file: app/api/admin/import-data/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeList } from "@/lib/db";

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

const USER_SCALARS = [
  "name",
  "email",
  "password",
  "role",
  "position",
  "isBlocked",
  "image",
  "bio",
  "graduatedYear",
  "degree",
  "isVerified",
  "fatherName",
  "isProfilePublic",
  "profileVisibility",
  "languagePreference",
  "themePreference",
];

const CONTACT_MAP: [string, string][] = [
  ["phone", "contactPhone"],
  ["email", "contactEmail"],
  ["address", "contactAddress"],
  ["company", "contactCompany"],
  ["position", "contactPosition"],
];

const SOCIAL_MAP: [string, string][] = [
  ["facebook", "socialFacebook"],
  ["telegram", "socialTelegram"],
  ["instagram", "socialInstagram"],
  ["youtube", "socialYoutube"],
  ["linkedin", "socialLinkedin"],
  ["github", "socialGithub"],
  ["tiktok", "socialTiktok"],
  ["viber", "socialViber"],
  ["line", "socialLine"],
  ["x", "socialX"],
  ["twitter", "socialTwitter"],
  ["whatsapp", "socialWhatsapp"],
  ["website", "socialWebsite"],
];

const JSON_COLUMNS: Record<string, string[]> = {
  posts: ["images"],
  message_reactions: ["users"],
  vote_projects: ["languagesAndTools", "photos"],
};

const STRIP_COLUMNS: Record<string, string[]> = {
  posts: ["likes", "comments"],
  messages: ["reactions"],
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

  return { error: null };
}

function toIdString(value: any): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.$oid === "string") return value.$oid;
  return String(value);
}

function flattenUserDoc(doc: any) {
  const data: Record<string, any> = {};

  for (const key of USER_SCALARS) {
    const value = doc[key];
    if (value !== undefined && value !== null) data[key] = value;
  }

  if (data.graduatedYear !== undefined) data.graduatedYear = String(data.graduatedYear);

  const ci = doc.contactInfo && typeof doc.contactInfo === "object" ? doc.contactInfo : {};
  for (const [from, to] of CONTACT_MAP) {
    const value = ci[from] ?? doc[to];
    if (value !== undefined && value !== null) data[to] = value;
  }

  const sl = doc.socialLinks && typeof doc.socialLinks === "object" ? doc.socialLinks : {};
  for (const [from, to] of SOCIAL_MAP) {
    const value = sl[from] ?? doc[to];
    if (value !== undefined && value !== null) data[to] = value;
  }

  if (doc.createdAt) data.createdAt = new Date(doc.createdAt);
  if (doc.updatedAt) data.updatedAt = new Date(doc.updatedAt);

  return data;
}

function toData(collectionName: string, doc: any) {
  if (collectionName === "users") {
    const data = flattenUserDoc(doc);
    const id = toIdString(doc._id ?? doc.id);
    if (id) data.id = id;
    return data;
  }

  const strip = STRIP_COLUMNS[collectionName] || [];
  const data: Record<string, any> = {};

  for (const [key, value] of Object.entries(doc)) {
    if (key === "_id" || key === "__v" || key === "id") continue;
    if (strip.includes(key)) continue;
    if (value === undefined) continue;
    data[key] = value;
  }

  const id = toIdString(doc._id ?? doc.id);
  if (id) data.id = id;

  if (data.graduatedYear !== undefined && data.graduatedYear !== null) {
    data.graduatedYear = String(data.graduatedYear);
  }
  if (data.createdAt) data.createdAt = new Date(data.createdAt);
  if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);

  for (const column of JSON_COLUMNS[collectionName] || []) {
    if (Array.isArray(data[column])) data[column] = serializeList(data[column]);
  }

  return data;
}

// POST /api/admin/import-data
// Accepts one or more `files` (multipart). Each filename becomes the collection:
//   posts.json -> table `posts`
// Documents that already exist (same `_id`/`id`) are skipped, never overwritten.
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const formData = await req.formData();
    const files: File[] = [];

    for (const value of formData.getAll("files")) {
      if (value instanceof File) files.push(value);
    }

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

      const delegate = TABLE_DELEGATES[collectionName];
      if (!delegate) {
        results.push({
          filename,
          collection: collectionName,
          inserted: 0,
          skipped: 0,
          error: "Unknown collection",
        });
        continue;
      }

      try {
        const text = await file.text();
        let docs: any = JSON.parse(text);
        if (!Array.isArray(docs)) docs = [docs];

        let inserted = 0;
        let skipped = 0;

        for (const doc of docs) {
          if (!doc || typeof doc !== "object") {
            skipped++;
            continue;
          }

          try {
            const data = toData(collectionName, doc);
            const id = data.id as string | undefined;

            if (id) {
              const exists = await delegate.findUnique({ where: { id } });
              if (exists) {
                skipped++;
                continue;
              }
            }

            await delegate.create({ data });
            inserted++;
          } catch {
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
