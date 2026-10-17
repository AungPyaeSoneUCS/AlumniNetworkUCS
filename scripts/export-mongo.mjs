// scripts/export-mongo.mjs
//
// Exports the live MongoDB collections from the OLD (Mongoose) version of the
// Alumni Network into `backup_data/*.json`, in the exact shape that
// `prisma/seed.ts` expects. Run this on the server (or point MONGODB_URI at the
// remote database) BEFORE switching to the SQLite/Prisma version.
//
// Usage:
//   MONGODB_URI="mongodb://127.0.0.1:27017/graduate_network" npm run db:export-mongo
//
// The MONGODB_URI is also read from a .env file if present.

import "dotenv/config";
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";

const uri =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/graduate_network";

const outDir = path.join(process.cwd(), "backup_data");
fs.mkdirSync(outDir, { recursive: true });

// Output file (read by prisma/seed.ts)  ->  candidate Mongo collection names
const TARGETS = [
  { file: "users.json", candidates: ["users", "user"] },
  {
    file: "approvedstudents.json",
    candidates: ["approvedstudents", "approved_students", "approvedStudents"],
  },
  { file: "posts.json", candidates: ["posts", "post"] },
  { file: "messages.json", candidates: ["messages", "message"] },
  { file: "notifications.json", candidates: ["notifications", "notification"] },
  {
    file: "vote_users.json",
    candidates: ["voteusers", "vote_users", "voteUsers", "votusers"],
  },
  {
    file: "contactsettings.json",
    candidates: ["contactsettings", "contact_settings", "contactSettings"],
  },
  { file: "settings.json", candidates: ["settings", "setting"] },
];

// Convert BSON values to plain JSON-friendly values.
function toPlain(value) {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value.toHexString === "function") return value.toHexString();
  if (Buffer.isBuffer(value)) return value.toString("base64");
  if (t === "object") {
    const bsontype = value._bsontype;
    if (bsontype === "Long" || bsontype === "Decimal128" || bsontype === "Binary" || bsontype === "Double") {
      return String(value);
    }
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toPlain(v);
    return out;
  }
  return String(value);
}

async function main() {
  console.log(`Connecting to MongoDB: ${uri.replace(/\/\/[^@]*@/, "//***@")}`);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  await client.connect();

  // --list : show every database and its collections, then exit.
  if (process.argv.includes("--list")) {
    const { databases } = await client.db().admin().listDatabases();
    console.log("\nDatabases:");
    for (const d of databases) {
      if (["admin", "local", "config"].includes(d.name)) continue;
      const cols = await client.db(d.name).listCollections().toArray();
      console.log(`  ${d.name}`);
      for (const c of cols) {
        const count = await client.db(d.name).collection(c.name).estimatedDocumentCount();
        console.log(`      - ${c.name} (${count})`);
      }
    }
    await client.close();
    return;
  }

  const dryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "1";

  const db = client.db();
  console.log(`Connected. Database: ${db.databaseName}${dryRun ? "  [DRY RUN]" : ""}`);

  const existing = (await db.listCollections().toArray()).map((c) => c.name);
  console.log(`Collections found: ${existing.length ? existing.join(", ") : "(none)"}\n`);

  const manifest = [];

  for (const target of TARGETS) {
    const match = target.candidates.find((c) => existing.includes(c));
    const outPath = path.join(outDir, target.file);

    if (!match) {
      if (!dryRun && !fs.existsSync(outPath)) fs.writeFileSync(outPath, "[]\n");
      console.log(`- ${target.file.padEnd(24)} no collection found (tried: ${target.candidates.join(", ")})`);
      manifest.push({ file: target.file, collection: null, count: 0 });
      continue;
    }

    const docs = await db.collection(match).find({}).toArray();
    const plain = docs.map(toPlain);
    if (!dryRun) fs.writeFileSync(outPath, JSON.stringify(plain, null, 2) + "\n");
    console.log(`+ ${target.file.padEnd(24)} <- ${match}  (${plain.length} docs)`);
    manifest.push({ file: target.file, collection: match, count: plain.length });
  }

  // Remove the obsolete duplicate posts export if it lingers.
  const stalePosts = path.join(outDir, "posts (1).json");
  if (!dryRun && fs.existsSync(stalePosts)) {
    fs.rmSync(stalePosts);
    console.log("- removed stale backup_data/posts (1).json");
  }

  await client.close();

  const total = manifest.reduce((sum, m) => sum + m.count, 0);
  console.log(`\n${dryRun ? "Dry run complete" : "Export complete"}: ${total} documents ${dryRun ? "would be" : ""} written to backup_data/.`);
  if (!dryRun) {
    console.log("Next steps on the new (SQLite) version:");
    console.log("  npm run db:push");
    console.log("  npm run db:seed");
  }
}

main().catch((err) => {
  console.error("\nExport failed:", err?.message || err);
  process.exit(1);
});
