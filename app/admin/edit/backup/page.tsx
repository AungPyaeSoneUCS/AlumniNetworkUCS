// file: app/admin/edit/backup/page.tsx
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { DatabaseBackup } from "lucide-react";

import { auth } from "@/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import EditNav from "@/components/admin/edit-nav";
import BackupClient from "@/components/admin/backup-client";

async function getDb() {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");
  return db;
}

async function listCollections() {
  const collections: { name: string; count: number }[] = [];

  const raw = await (await getDb()).listCollections().toArray();

  for (const item of raw) {
    if (!item.name || item.name.startsWith("system.")) continue;
    try {
      const count = await (await getDb())
        .collection(item.name)
        .estimatedDocumentCount();
      collections.push({ name: item.name, count });
    } catch {
      collections.push({ name: item.name, count: 0 });
    }
  }

  return collections.sort((a, b) => a.name.localeCompare(b.name));
}

export default async function BackupPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();
  const admin: any = await User.findOne({ email: session.user.email })
    .select("name role")
    .lean();
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";

  let collections: { name: string; count: number }[] = [];
  try {
    collections = await listCollections();
  } catch (err) {
    console.error("Backup page: failed to list collections", err);
  }

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <EditNav lang={lang} userName={admin.name || "Admin"} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
              <DatabaseBackup size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {lang === "mm" ? "Database Backup" : "Database Backup"}
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                {lang === "mm"
                  ? "MongoDB collection တိုင်းကို JSON ဖိုင် အဖြစ် ဒေါင်းလုဒ်လုပ်နိုင်သည်။"
                  : "Download every MongoDB collection as its own JSON file."}
              </p>
            </div>
          </div>
        </section>

        <BackupClient collections={collections} lang={lang} />
      </div>
    </main>
  );
}