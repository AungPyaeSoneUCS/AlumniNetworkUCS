// file: app/admin/edit/delete-data/page.tsx
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EditNav from "@/components/admin/edit-nav";
import DeleteDataClient from "@/components/admin/delete-data-client";

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

async function listCollections() {
  const collections: { name: string; count: number }[] = [];

  for (const table of ALL_TABLES) {
    try {
      const count = await (prisma as any)[table.model].count();
      collections.push({ name: table.name, count });
    } catch {
      collections.push({ name: table.name, count: 0 });
    }
  }

  return collections.sort((a, b) => a.name.localeCompare(b.name));
}

export default async function DeleteDataPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }> | { lang?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  const admin: any = await prisma.user.findFirst({
    where: { email: session.user.email },
    select: { name: true, role: true },
  });
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";

  let collections: { name: string; count: number }[] = [];
  try {
    collections = await listCollections();
  } catch (err) {
    console.error("Delete Data page: failed to list collections", err);
  }

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <EditNav lang={lang} userName={admin.name || "Admin"} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100 dark:bg-red-500/20 dark:text-red-400 dark:ring-red-500/40">
              <Trash2 size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {lang === "mm" ? "ဒေတာ ဖျက်ရန်" : "Delete Data"}
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                {lang === "mm"
                  ? "Collection တစ်ခုစီမှ document များ အားလုံးကို ဖျက်နိုင်သည်။ သတိထားပါ - နောက်ပြန်မရနိုင်ပါ။"
                  : "Permanently clear documents from any collection. Use with caution."}
              </p>
            </div>
          </div>
        </section>

        <DeleteDataClient collections={collections} lang={lang} />
      </div>
    </main>
  );
}