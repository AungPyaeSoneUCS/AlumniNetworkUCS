// file: app/admin/edit/import-data/page.tsx
import { redirect } from "next/navigation";
import { CloudUpload } from "lucide-react";

import { auth } from "@/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import EditNav from "@/components/admin/edit-nav";
import ImportDataClient from "@/components/admin/import-data-client";

export default async function ImportDataPage({
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

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <EditNav lang={lang} userName={admin.name || "Admin"} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
              <CloudUpload size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {lang === "mm" ? "ဒေတာ Import ပြန်တင်ရန်" : "Import Data"}
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                {lang === "mm"
                  ? "Backup စာမျက်နှာမှ ဒေါင်းလုဒ်လုပ်ထားသော JSON ဖိုင်များကို ဒေတာဘေ့စ်ထဲသို့ ပြန်တင်ပါ။"
                  : "Restore the JSON backup files back into the database."}
              </p>
            </div>
          </div>
        </section>

        <ImportDataClient lang={lang} />
      </div>
    </main>
  );
}