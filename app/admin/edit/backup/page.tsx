// file: app/admin/edit/backup/page.tsx
import { redirect } from "next/navigation";
import { DatabaseBackup } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EditNav from "@/components/admin/edit-nav";
import BackupClient from "@/components/admin/backup-client";

const ALL_TABLES = [
  { name: "users", model: "user" },
  { name: "posts", model: "post" },
  { name: "messages", model: "message" },
  { name: "notifications", model: "notification" },
  { name: "approved_students", model: "approvedStudent" },
  { name: "students", model: "student" },
  { name: "jobs", model: "job" },
  { name: "job_applications", model: "jobApplication" },
  { name: "otps", model: "otp" },
  { name: "settings", model: "setting" },
  { name: "contact_settings", model: "contactSetting" },
  { name: "vote_users", model: "voteUser" },
  { name: "vote_projects", model: "voteProject" },
  { name: "push_tokens", model: "pushToken" },
  { name: "experiences", model: "experience" },
  { name: "post_comments", model: "postComment" },
  { name: "post_likes", model: "postLike" },
  { name: "message_reactions", model: "messageReaction" },
];

export default async function BackupPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  const admin: any = await prisma.user.findFirst({
    where: { email: session.user.email },
    select: { role: true },
  });
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";

  let collections: { name: string; count: number }[] = [];
  try {
    collections = await Promise.all(
      ALL_TABLES.map(async (t) => {
        try {
          const count = await (prisma as any)[t.model].count();
          return { name: t.name, count };
        } catch {
          return { name: t.name, count: 0 };
        }
      })
    );
    collections.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("Backup page: failed to list collections", err);
  }

  return (
    <div className="flex h-full min-h-screen flex-col lg:flex-row">
      <div className="flex-1">
        <EditNav lang={lang} />

        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm ring-1 ring-white/60 dark:border-slate-800 dark:bg-slate-900/60 dark:ring-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow">
                <DatabaseBackup className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
                  {lang === "mm" ? "ဒေတာဘေ့စ် ဘက်အာပ်" : "Database Backup"}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {lang === "mm"
                    ? "အတည်ပြုပြီးကောက်ယူလိုသည့် collection များကို ရွေးချယ်၍ JSON အဖြစ် ဒေါင်းလုဒ်လုပ်ပါ။"
                    : "Select collections to download them as JSON backup files."}
                </p>
              </div>
            </div>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm ring-1 ring-white/60 dark:border-slate-800 dark:bg-slate-900/60 dark:ring-white/5">
            <BackupClient lang={lang} collections={collections} />
          </section>
        </div>
      </div>
    </div>
  );
}
