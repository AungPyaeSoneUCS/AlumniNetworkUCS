// file: app/admin/edit/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import Link from "next/link";
import { PenSquare, UserCog, UserPlus, LayoutDashboard, Users, ArrowRight, DatabaseBackup, CloudUpload, Trash2 } from "lucide-react";

import EditNav from "@/components/admin/edit-nav";

type Lang = "en" | "mm";

const text = {
  en: {
    title: "Edit Home",
    subtitle: "Manage alumni accounts: create new accounts, update account details, or edit full alumni profiles.",
    toolsTitle: "Edit Tools",
    backupLabel: "Database Backup",
    backupHint: "Download all database collections as JSON files.",
    importLabel: "Import Data",
    importHint: "Restore backup JSON files back into the database.",
    deleteLabel: "Delete Data",
    deleteHint: "Permanently clear documents from any collection.",
    dashboardLabel: "Go to Dashboard",
    dashboardHint: "Return to the main admin dashboard.",
    cards: {
      createUsers: {
        title: "Create Users",
        desc: "Create verified alumni accounts directly or in bulk from the approved student list.",
        open: "Open",
      },
      updateStudent: {
        title: "Update Account",
        desc: "Search a student and update their Name, Email, Phone, and Password.",
        open: "Open",
      },
      editAlumni: {
        title: "Edit Alumni",
        desc: "Edit all alumni data: personal info, experiences, and social links.",
        open: "Open",
      },
    },
  },
  mm: {
    title: "ပြင်ဆင်ရန် ပင်မ",
    subtitle: "ကျောင်းသားဟောင်း အကောင့်များ စီမံရန်- အကောင့်အသစ်ဖွင့်ခြင်း၊ အကောင့်အချက်အလက် ပြင်ခြင်း သို့မဟုတ် ပရိုဖိုင်အပြည့်အစုံ ပြင်ခြင်း။",
    toolsTitle: "ပြင်ဆင်ရန် အသုံးပြုခန်းများ",
    backupLabel: "Database Backup",
    backupHint: "Database collection များအားလုံးကို JSON ဖိုင်များအဖြစ် ဒေါင်းလုဒ်လုပ်ပါ။",
    importLabel: "Import ပြန်တင်ရန်",
    importHint: "Backup JSON ဖိုင်များကို Database ထဲသို့ ပြန်တင်ပါ။",
    deleteLabel: "ဒေတာ ဖျက်ရန်",
    deleteHint: "Collection များမှ document များကို အပြီးအပိုင် ဖျက်ပါ။",
    dashboardLabel: "Dashboard သို့ သွားမည်",
    dashboardHint: "ပင်မ အက်ဒမင် Dashboard သို့ ပြန်သွားမည်။",
    cards: {
      createUsers: {
        title: "အကောင့်ဖွင့်ရန်",
        desc: "အတည်ပြုပြီးကျောင်းသားစာရင်းမှ အကောင့်များကို တိုက်ရိုက် သို့မဟုတ် အများအပြား ဖွင့်နိုင်သည်။",
        open: "ဖွင့်မည်",
      },
      updateStudent: {
        title: "အကောင့်ပြင်ရန်",
        desc: "ကျောင်းသားကို ရှာပြီး အမည်၊ အီးမေးလ်၊ ဖုန်းနှင့် စကားဝှက်ကို ပြင်နိုင်သည်။",
        open: "ဖွင့်မည်",
      },
      editAlumni: {
        title: "ကျောင်းသားဟောင်း ပြင်ရန်",
        desc: "ကိုယ်ရေး၊ အတွေ့အကြုံ နှင့် လူမှုကွန်ရက် အပါအဝင် ပရိုဖိုင်အားလုံးကို ပြင်နိုင်သည်။",
        open: "ဖွင့်မည်",
      },
    },
  },
} as const;

export default async function AdminEditHomePage({
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
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const tools = [
    {
      href: "/admin/edit/create-users",
      icon: UserPlus,
      title: t.cards.createUsers.title,
      desc: t.cards.createUsers.desc,
      accent: "from-cyan-400 to-[#008B8B]",
    },
    {
      href: "/admin/edit/update-student",
      icon: UserCog,
      title: t.cards.updateStudent.title,
      desc: t.cards.updateStudent.desc,
      accent: "from-teal-400 to-emerald-600",
    },
    {
      href: "/admin/edit/edit-alumni",
      icon: PenSquare,
      title: t.cards.editAlumni.title,
      desc: t.cards.editAlumni.desc,
      accent: "from-[#00BFC4] to-[#008B8B]",
    },
    {
      href: "/admin/edit/backup",
      icon: DatabaseBackup,
      title: t.backupLabel,
      desc: t.backupHint,
      accent: "from-teal-500 to-emerald-700",
    },
    {
      href: "/admin/edit/import-data",
      icon: CloudUpload,
      title: t.importLabel,
      desc: t.importHint,
      accent: "from-cyan-400 to-blue-600",
    },
    {
      href: "/admin/edit/delete-data",
      icon: Trash2,
      title: t.deleteLabel,
      desc: t.deleteHint,
      accent: "from-rose-500 to-red-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <EditNav lang={lang} userName={admin.name || "Admin"} />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:px-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-[#008B8B] ring-1 ring-cyan-100 dark:bg-[#008B8B]/20 dark:text-cyan-400 dark:ring-[#008B8B]/40">
              <PenSquare size={20} />
            </span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {t.title}
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                {t.subtitle}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Users size={14} />
            {t.toolsTitle}
          </h2>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={`${tool.href}?lang=${lang}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/80 dark:bg-slate-900/50"
                >
                  <span
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.accent} text-white shadow-lg shadow-cyan-500/20 transition group-hover:scale-110`}
                  >
                    <Icon size={22} />
                  </span>

                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {tool.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
                    {tool.desc}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-[#008B8B] transition group-hover:gap-2.5 dark:text-[#25C9C8]">
                    {lang === "mm" ? "ဖွင့်မည်" : "Open"}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
          <Link
            href="/admin/dashboard"
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#00BFC4] hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#008B8B]/10 text-[#008B8B] dark:text-[#25C9C8]">
                <LayoutDashboard size={20} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {t.dashboardLabel}
                </p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t.dashboardHint}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-slate-400" />
          </Link>
        </section>
      </div>
    </main>
  );
}