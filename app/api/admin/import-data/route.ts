// file: app/api/admin/import-data/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeList } from "@/lib/db";
import { getDelegate, resolveCollectionName } from "@/lib/admin-collections";

export const runtime = "nodejs";
// Long imports are allowed to run; self-hosted Next ignores this, Vercel honors it.
export const maxDuration = 3600;

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

// How many rows to insert per SQL statement. Kept small enough to stay well
// under SQLite's bound-variable limit while still being fast.
const INSERT_CHUNK = 100;

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

function toExperience(e: any, userId: string | undefined) {
  return {
    userId: userId ?? "",
    company: e.company != null ? String(e.company) : "",
    position: e.position != null ? String(e.position) : "",
    employmentType: e.employmentType != null ? String(e.employmentType) : "",
    location: e.location != null ? String(e.location) : "",
    phone: e.phone != null ? String(e.phone) : "",
    email: e.email != null ? String(e.email) : "",
    salary: e.salary != null ? String(e.salary) : "",
    website: e.website != null ? String(e.website) : "",
    startDate: e.startDate != null ? String(e.startDate) : "",
    endDate: e.isCurrent ? "" : e.endDate != null ? String(e.endDate) : "",
    isCurrent: Boolean(e.isCurrent),
    experienceYear: e.experienceYear != null ? String(e.experienceYear) : "",
  };
}

/**
 * Incremental parser for a JSON file whose top level is either an array of
 * values (the usual export shape) or a single value. Elements are emitted as
 * soon as they are complete, so arbitrarily large files never have to be held
 * in memory in full.
 */
function createJsonStreamer(onValue: (value: any) => void) {
  let buf = "";
  let i = 0;
  let depth = 0; // >0 nested object/array, -1 bare primitive
  let inString = false;
  let topString = false; // current element is a bare top-level string
  let esc = false;
  let elemStart = -1;
  let sawOpen = false;
  let closed = false;

  function emit(slice: string) {
    const text = slice.trim();
    if (!text) return;
    try {
      onValue(JSON.parse(text));
    } catch {
      onValue(undefined);
    }
  }

  function reset() {
    depth = 0;
    inString = false;
    topString = false;
    esc = false;
    elemStart = -1;
  }

  function process() {
    const n = buf.length;
    while (i < n) {
      const ch = buf[i];

      if (inString) {
        if (esc) { esc = false; i++; continue; }
        if (ch === "\\") { esc = true; i++; continue; }
        if (ch === '"') {
          inString = false;
          if (topString) {
            emit(buf.slice(elemStart, i + 1));
            i++;
            reset();
            continue;
          }
          i++;
          continue;
        }
        i++;
        continue;
      }

      if (depth === 0) {
        if (ch === "\uFEFF" || ch === "," || ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
          i++;
          continue;
        }
        if (ch === "]") { closed = true; i++; continue; }
        if (ch === "[" && !sawOpen) { sawOpen = true; i++; continue; }

        elemStart = i;
        if (ch === "{" || ch === "[") { depth = 1; i++; continue; }
        if (ch === '"') { inString = true; topString = true; i++; continue; }
        depth = -1;
        i++;
        continue;
      }

      if (depth === -1) {
        if (ch === "," || ch === "]") {
          emit(buf.slice(elemStart, i));
          reset();
          continue; // let the top-level branch consume the delimiter
        }
        i++;
        continue;
      }

      // depth >= 1 (inside an object or array)
      if (ch === '"') { inString = true; i++; continue; }
      if (ch === "{" || ch === "[") { depth++; i++; continue; }
      if (ch === "}" || ch === "]") {
        depth--;
        if (depth === 0) {
          emit(buf.slice(elemStart, i + 1));
          i++;
          reset();
          continue;
        }
        i++;
        continue;
      }
      i++;
    }

    // Only discard the consumed prefix once no element is mid-flight, otherwise
    // the start of the pending element would be lost.
    if (elemStart === -1 && i > 0) {
      buf = buf.slice(i);
      i = 0;
    }
  }

  return {
    feed(chunk: string) {
      if (!chunk) return;
      buf += chunk;
      process();
    },
    finish() {
      process();
      if (depth === -1 && elemStart >= 0) {
        emit(buf.slice(elemStart, buf.length));
        reset();
      }
    },
    get closed() {
      return closed;
    },
  };
}

async function createWithFallback(delegate: any, rows: any[]) {
  let inserted = 0;
  let skipped = 0;

  for (let k = 0; k < rows.length; k += INSERT_CHUNK) {
    const chunk = rows.slice(k, k + INSERT_CHUNK);
    try {
      await delegate.createMany({ data: chunk });
      inserted += chunk.length;
    } catch {
      // Fall back to one-by-one so a single bad/duplicate row doesn't drop the
      // whole chunk (SQLite does not support createMany skipDuplicates).
      for (const row of chunk) {
        try {
          await delegate.create({ data: row });
          inserted++;
        } catch {
          skipped++;
        }
      }
    }
  }

  return { inserted, skipped };
}

// Consume any remaining request body before sending an early response.
// If the upstream responds while nginx is still pushing the request body,
// nginx aborts the connection and the client sees a 502.
async function drainBody(req: Request) {
  if (!req.body) return;
  try {
    const reader = req.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch {
    // body already closed/aborted - nothing else to do
  }
}

// POST /api/admin/import-data?name=<filename>
// The raw request body is the JSON file. `name` may be the canonical table
// name (`approved_students.json`) or the raw Mongo export name
// (`approvedstudents.json`). Existing rows (same id/email) are skipped.
export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) {
      await drainBody(req);
      return error;
    }

    const { searchParams } = new URL(req.url);
    const rawName = (searchParams.get("name") || "").trim();
    const resolvedName = resolveCollectionName(rawName);

    if (!resolvedName) {
      await drainBody(req);
      return NextResponse.json(
        { error: rawName ? `Unknown collection: ${rawName}` : "Missing collection name" },
        { status: 400 },
      );
    }

    const collectionName: string = resolvedName;

    const delegate = getDelegate(collectionName);
    if (!delegate) {
      await drainBody(req);
      return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
    }

    if (!req.body) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Snapshot the existing ids (and emails for users) so re-imports skip
    // duplicates instead of failing on unique constraints.
    const select: any = { id: true };
    if (collectionName === "users") select.email = true;
    const existingRows: any[] = await delegate.findMany({ select });
    const existingIds = new Set<string>(existingRows.map((r) => String(r.id)));
    const existingEmails = new Set<string>(
      collectionName === "users"
        ? existingRows.map((r) => String(r.email || "").toLowerCase())
        : [],
    );

    let inserted = 0;
    let skipped = 0;
    let processed = 0;

    let batch: any[] = [];
    const batchIds = new Set<string>();
    const batchEmails = new Set<string>();
    let expBatch: any[] = [];

    async function flush() {
      if (batch.length) {
        const current = batch;
        batch = [];
        const res = await createWithFallback(delegate, current);
        inserted += res.inserted;
        skipped += res.skipped;
      }
      if (expBatch.length) {
        const current = expBatch;
        expBatch = [];
        await createWithFallback(prisma.experience, current);
      }
    }

    async function handleValue(value: any) {
      if (value === undefined || value === null || typeof value !== "object") {
        skipped++;
        return;
      }
      processed++;

      const data = toData(collectionName, value);
      const id = data.id ? String(data.id) : null;
      const email =
        collectionName === "users" && data.email
          ? String(data.email).toLowerCase()
          : null;

      if (id && (existingIds.has(id) || batchIds.has(id))) {
        skipped++;
        return;
      }
      if (email && (existingEmails.has(email) || batchEmails.has(email))) {
        skipped++;
        return;
      }

      if (collectionName === "users" && Array.isArray(value.experiences)) {
        for (const e of value.experiences) {
          if (e && typeof e === "object") expBatch.push(toExperience(e, id ?? undefined));
        }
      }

      batch.push(data);
      if (id) batchIds.add(id);
      if (email) batchEmails.add(email);

      if (batch.length >= INSERT_CHUNK || expBatch.length >= INSERT_CHUNK) {
        await flush();
      }
    }

    const pending: any[] = [];
    const streamer = createJsonStreamer((value) => pending.push(value));

    const reader = req.body.getReader();
    const decoder = new TextDecoder("utf-8");

    async function drain() {
      while (pending.length) {
        await handleValue(pending.shift());
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        streamer.feed(decoder.decode(value, { stream: true }));
        await drain();
      }
    }
    streamer.feed(decoder.decode());
    streamer.finish();
    await drain();
    await flush();

    return NextResponse.json(
      { success: true, collection: collectionName, inserted, skipped, processed },
      { status: 200 },
    );
  } catch (err) {
    console.error("POST /api/admin/import-data error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
