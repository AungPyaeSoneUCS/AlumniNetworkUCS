// file: components/admin/admin-sidebar.tsx

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  Contact,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type Lang = "en" | "mm";

type ActivePage =
  | "dashboard"
  | "users"
  | "users-graduated-years"
  | "users-salary-ranges"
  | "users-job-status"
  | "manage-users"
  | "jobs"
  | "posts"
  | "register-users"
  | "contact";

type NavItem = {
  key: ActivePage;
  label: string;
  href: string;
  icon: React.ElementType;
};

export default function AdminSidebar({
  active,
  lang = "en",
}: {
  active: ActivePage;
  lang?: Lang;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(
    active === "users" ||
      active === "users-graduated-years" ||
      active === "users-salary-ranges" ||
      active === "users-job-status",
  );

  const urlLang = searchParams.get("lang");
  const currentLang: Lang = urlLang === "mm" ? "mm" : lang === "mm" ? "mm" : "en";
  const year = new Date().getFullYear();

  const labels = useMemo(
    () => ({
      en: {
        dashboard: "Dashboard",
        users: "Users Analytics",
        graduatedYears: "Graduated Year Count",
        salaryRanges: "Salary Range",
        jobStatus: "Graduate Job Status",
        manageUsers: "Manage Users",
        jobs: "Jobs",
        posts: "Posts",
        registerUsers: "Register Data",
        contact: "Contact",
        logout: "Logout",
        english: "English",
        myanmar: "Myanmar",
        copyright: `© ${year} Alumni Network`,
        expand: "Expand sidebar",
        collapse: "Collapse sidebar",
        openMenu: "Open admin menu",
        closeMenu: "Close admin menu",
      },
      mm: {
        dashboard: "Dashboard",
        users: "အသုံးပြုသူ စာရင်းဇယား",
        graduatedYears: "ဘွဲ့ရခုနှစ် စာရင်း",
        salaryRanges: "လစာအပိုင်းအခြား",
        jobStatus: "အလုပ်အကိုင် အခြေအနေ",
        manageUsers: "အသုံးပြုသူ စီမံရန်",
        jobs: "အလုပ်အကိုင်များ",
        posts: "ပို့စ်များ",
        registerUsers: "မှတ်ပုံတင်ဒေတာ",
        contact: "ဆက်သွယ်ရန်",
        logout: "ထွက်ရန်",
        english: "English",
        myanmar: "မြန်မာ",
        copyright: `© ${year} Alumni Network`,
        expand: "Sidebar ဖွင့်ရန်",
        collapse: "Sidebar ချုံ့ရန်",
        openMenu: "Admin menu ဖွင့်ရန်",
        closeMenu: "Admin menu ပိတ်ရန်",
      },
    }),
    [year],
  );

  const t = labels[currentLang];

  const makeHref = (
    path: string,
    nextLang: Lang = currentLang,
    keepCurrentParams = false,
  ) => {
    const params = keepCurrentParams
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();

    params.set("lang", nextLang);

    return `${path}?${params.toString()}`;
  };

  const currentPath = pathname || "/admin/dashboard";

  const navs: NavItem[] = [
    {
      key: "dashboard",
      label: t.dashboard,
      href: makeHref("/admin/dashboard"),
      icon: LayoutDashboard,
    },
    {
      key: "manage-users",
      label: t.manageUsers,
      href: makeHref("/admin/manage-users"),
      icon: Users,
    },
    {
      key: "jobs",
      label: t.jobs,
      href: makeHref("/admin/jobs"),
      icon: Briefcase,
    },
    {
      key: "posts",
      label: t.posts,
      href: makeHref("/admin/posts"),
      icon: Newspaper,
    },
    {
      key: "register-users",
      label: t.registerUsers,
      href: makeHref("/admin/register-users"),
      icon: FileSpreadsheet,
    },
    {
      key: "contact",
      label: t.contact,
      href: makeHref("/admin/contact"),
      icon: Contact,
    },
  ];

  const analyticsItems: NavItem[] = [
    {
      key: "users-graduated-years",
      label: t.graduatedYears,
      href: makeHref("/admin/users/graduated-years"),
      icon: GraduationCap,
    },
    {
      key: "users-salary-ranges",
      label: t.salaryRanges,
      href: makeHref("/admin/users/salary-ranges"),
      icon: TrendingUp,
    },
    {
      key: "users-job-status",
      label: t.jobStatus,
      href: makeHref("/admin/users/job-status"),
      icon: LineChart,
    },
  ];

  const isAnalyticsActive =
    active === "users" ||
    active === "users-graduated-years" ||
    active === "users-salary-ranges" ||
    active === "users-job-status";

  async function handleLogout() {
    await signOut({
      callbackUrl: "/admin/login",
      redirect: true,
    });
  }

  function handleAnalyticsClick() {
    if (collapsed) {
      setCollapsed(false);
      setAnalyticsOpen(false);
      return;
    }

    setAnalyticsOpen((prev) => !prev);
  }

  function handleCollapseToggle() {
    setCollapsed((prev) => {
      const next = !prev;
      if (next) setAnalyticsOpen(false);
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={t.openMenu}
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[80] flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/90 text-slate-950 shadow-xl shadow-slate-300/60 backdrop-blur-xl transition hover:scale-105 active:scale-95 dark:border-slate-800 dark:bg-slate-950/90 dark:text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        aria-label={t.closeMenu}
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/70 bg-white/90 shadow-2xl shadow-slate-300/50 backdrop-blur-2xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-black/30 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[92px]" : "lg:w-[290px]"} w-[290px]`}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div
            className={`mb-4 flex items-center ${
              collapsed ? "justify-center" : "justify-between"
            }`}
          >
            <button
              type="button"
              onClick={handleCollapseToggle}
              title={collapsed ? t.expand : t.collapse}
              aria-label={collapsed ? t.expand : t.collapse}
              className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20 transition hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-950 lg:flex"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>

            {!collapsed && <div className="hidden flex-1 lg:block" />}

            <button
              type="button"
              aria-label={t.closeMenu}
              onClick={() => setMobileOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            <NavLinkItem
              item={navs[0]}
              active={active}
              collapsed={collapsed}
              closeMobile={() => setMobileOpen(false)}
            />

            <div>
              <button
                type="button"
                onClick={handleAnalyticsClick}
                title={collapsed ? t.users : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                  isAnalyticsActive
                    ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                {isAnalyticsActive && !collapsed && (
                  <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                )}

                <BarChart3 className="h-5 w-5 shrink-0" />

                {!collapsed && <span className="truncate">{t.users}</span>}

                {!collapsed && (
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition ${
                      analyticsOpen ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {!collapsed && analyticsOpen && (
                <div className="mt-2 space-y-1 rounded-[22px] bg-slate-50 p-2 dark:bg-slate-900">
                  {analyticsItems.map((item) => (
                    <NavLinkItem
                      key={item.key}
                      item={item}
                      active={active}
                      collapsed={false}
                      child
                      closeMobile={() => setMobileOpen(false)}
                    />
                  ))}
                </div>
              )}
            </div>

            {navs.slice(1).map((item) => (
              <NavLinkItem
                key={item.key}
                item={item}
                active={active}
                collapsed={collapsed}
                closeMobile={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
            <div className={`grid gap-2 ${collapsed ? "grid-cols-1" : "grid-cols-2"}`}>
              <Link
                href={makeHref(currentPath, "en", true)}
                className={`rounded-2xl px-3 py-2 text-center text-xs font-black transition ${
                  currentLang === "en"
                    ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-950"
                }`}
              >
                {collapsed ? "EN" : t.english}
              </Link>

              <Link
                href={makeHref(currentPath, "mm", true)}
                className={`rounded-2xl px-3 py-2 text-center text-xs font-black transition ${
                  currentLang === "mm"
                    ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-950"
                }`}
              >
                {collapsed ? "MM" : t.myanmar}
              </Link>
            </div>
          </div>

          <p
            className={`mt-4 text-center text-[11px] font-bold text-slate-400 ${
              collapsed ? "hidden" : ""
            }`}
          >
            {t.copyright}
          </p>
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? t.logout : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-500 transition hover:bg-red-500 hover:text-white active:scale-95 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 ${
              collapsed ? "justify-center px-0" : "justify-center"
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>

      <div
        className={`hidden shrink-0 transition-all duration-300 lg:block ${
          collapsed ? "w-[92px]" : "w-[290px]"
        }`}
      />
    </>
  );
}

function NavLinkItem({
  item,
  active,
  collapsed,
  child = false,
  closeMobile,
}: {
  item: NavItem;
  active: ActivePage;
  collapsed: boolean;
  child?: boolean;
  closeMobile: () => void;
}) {
  const Icon = item.icon;
  const isActive = active === item.key;

  return (
    <Link
      href={item.href}
      onClick={closeMobile}
      title={collapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all ${
        isActive
          ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
      } ${collapsed ? "justify-center px-0" : ""} ${
        child && !isActive ? "bg-white/70 dark:bg-slate-950/70" : ""
      }`}
    >
      {isActive && !collapsed && !child && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white" />
      )}

      <Icon className={`${child ? "h-4 w-4" : "h-5 w-5"} shrink-0`} />

      {!collapsed && (
        <span className={`${child ? "text-xs" : "text-sm"} truncate`}>
          {item.label}
        </span>
      )}

      {!collapsed && isActive && !child && (
        <span className="ml-auto h-2 w-2 rounded-full bg-white" />
      )}
    </Link>
  );
}