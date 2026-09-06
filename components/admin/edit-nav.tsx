// file: components/admin/edit-nav.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { CloudUpload, Home, LayoutDashboard, LogOut, PenSquare, Trash2, UserCog, UserPlus, DatabaseBackup } from "lucide-react";

type Lang = "en" | "mm";

const navText = {
  en: {
    portal: "Edit Portal",
    home: "Edit Home",
    createUsers: "Create Users",
    updateStudent: "Update Account",
    editAlumni: "Edit Alumni",
    backup: "Backup",
    importData: "Import Data",
    deleteData: "Delete Data",
    dashboard: "Dashboard",
    logout: "Logout",
    english: "English",
    myanmar: "Myanmar",
  },
  mm: {
    portal: "ပြင်ဆင်ခြင်း",
    home: "ပြင်ဆင်ရန် ပင်မ",
    createUsers: "အကောင့်ဖွင့်ရန်",
    updateStudent: "အကောင့်ပြင်ရန်",
    editAlumni: "ကျောင်းသားဟောင်း ပြင်ရန်",
    backup: "Backup",
    importData: "Import ပြန်တင်ရန်",
    deleteData: "ဒေတာဖျက်ရန်",
    dashboard: "Dashboard",
    logout: "ထွက်ရန်",
    english: "English",
    myanmar: "မြန်မာ",
  },
} as const;

export default function EditNav({
  lang,
  userName,
}: {
  lang: Lang;
  userName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = navText[lang];

  const makeHref = (path: string, nextLang: Lang = lang, keepParams = true) => {
    const params = keepParams
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();
    params.set("lang", nextLang);
    return `${path}?${params.toString()}`;
  };

  const navLinks = [
    { href: "/admin/edit", label: t.home, icon: Home },
    { href: "/admin/edit/create-users", label: t.createUsers, icon: UserPlus },
    { href: "/admin/edit/update-student", label: t.updateStudent, icon: UserCog },
    { href: "/admin/edit/edit-alumni", label: t.editAlumni, icon: PenSquare },
    { href: "/admin/edit/backup", label: t.backup, icon: DatabaseBackup },
    { href: "/admin/edit/import-data", label: t.importData, icon: CloudUpload },
    { href: "/admin/edit/delete-data", label: t.deleteData, icon: Trash2 },
  ];

  async function handleLogout() {
    await signOut({ redirect: false });
    window.location.href = "/admin/login";
  }

  const basePath = (href: string) => href.split("?")[0];

  return (
    <>
      {/* DESKTOP NAV BAR */}
      <nav className="print:hidden">
        <div className="flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/25">
              <PenSquare size={20} />
            </span>
            <div className="hidden flex-col leading-tight md:flex">
              <span className="text-[15px] font-black text-slate-900 dark:text-white">
                {t.portal}
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {userName ?? "Admin"}
              </span>
            </div>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-1 overflow-x-auto px-2 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === basePath(link.href);
              return (
                <Link
                  key={link.href}
                  href={makeHref(basePath(link.href))}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-black transition ${
                    isActive
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md shadow-cyan-500/20"
                      : "text-slate-500 hover:bg-[#25C9C8]/10 hover:text-[#008B8B] dark:text-slate-400 dark:hover:text-[#25C9C8]"
                  }`}
                >
                  <Icon size={14} />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden rounded-lg bg-slate-100 p-0.5 sm:flex dark:bg-slate-900">
              <Link
                href={makeHref(pathname || "/admin/edit", "en")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-black transition ${
                  lang === "en"
                    ? "bg-white text-[#008B8B] shadow-sm dark:bg-slate-700 dark:text-[#25C9C8]"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                EN
              </Link>
              <Link
                href={makeHref(pathname || "/admin/edit", "mm")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-black transition ${
                  lang === "mm"
                    ? "bg-white text-[#008B8B] shadow-sm dark:bg-slate-700 dark:text-[#25C9C8]"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                {t.myanmar}
              </Link>
            </div>

            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-[#00BFC4] hover:text-[#008B8B] hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-[#25C9C8]"
            >
              <LayoutDashboard size={15} />
              <span className="hidden sm:inline">{t.dashboard}</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-500 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-500 hover:text-white hover:shadow-md active:scale-95 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          </div>
        </div>

        {/* MOBILE NAV LINKS */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200/80 bg-white/90 px-3 py-2.5 backdrop-blur-xl lg:hidden dark:border-slate-800/80 dark:bg-slate-950/90">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === basePath(link.href);
            return (
              <Link
                key={link.href}
                href={makeHref(basePath(link.href))}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-black transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-sm"
                    : "text-slate-500 hover:bg-[#25C9C8]/10 hover:text-[#008B8B] dark:text-slate-400"
                }`}
              >
                <Icon size={13} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}