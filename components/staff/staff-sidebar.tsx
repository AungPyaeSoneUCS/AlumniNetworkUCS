// file: components/staff/staff-sidebar.tsx

"use client";

import Image from "next/image";
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
  TrendingUp,
  UserCircle, 
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  | "contact"
  | "profile";

type NavItem = {
  key: ActivePage;
  label: string;
  href: string;
  icon: React.ElementType;
};

const SIDEBAR_COLLAPSED_KEY = "staff-sidebar-collapsed";

export default function StaffSidebar({
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
  const [loadedCollapsed, setLoadedCollapsed] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const urlLang = searchParams.get("lang");
  const currentLang: Lang = urlLang === "mm" ? "mm" : lang === "mm" ? "mm" : "en";
  const currentPath = pathname || "/staff/dashboard";
  const year = new Date().getFullYear();

  const isAnalyticsActive =
    active === "users" ||
    active === "users-graduated-years" ||
    active === "users-salary-ranges" ||
    active === "users-job-status";

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    setCollapsed(saved === "true");
    setLoadedCollapsed(true);
  }, []);

  useEffect(() => {
    if (!loadedCollapsed) return;
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, [collapsed, loadedCollapsed]);

  useEffect(() => {
    if (collapsed) {
      setAnalyticsOpen(false);
      return;
    }

    if (isAnalyticsActive) {
      setAnalyticsOpen(true);
    }
  }, [collapsed, isAnalyticsActive]);

  const labels = useMemo(
    () => ({
      en: {
        dashboard: "Dashboard",
        manageUsers: "Manage Alumni",
        jobs: "Manage Jobs",
        posts: "Manage Posts",
        users: "User Analysis",
        graduatedYears: "Yearly Graduate Count",
        salaryRanges: "Income Range",
        jobStatus: "Alumni Job Status",
        registerUsers: "Alumni Registration Lists",
        contact: "Contacts",
        profile: "Profile ",
        logout: "Logout",
        english: "English",
        myanmar: "Myanmar",
        copyright: `© ${year} Alumni Network`,
        expand: "Expand sidebar",
        collapse: "Collapse sidebar",
        openMenu: "Open staff menu",
        closeMenu: "Close staff menu",
      },
      mm: {
        dashboard: "Dashboard",
        manageUsers: "Alumni စီမံခန့်ခွဲမှု",
        jobs: "အလုပ်အကိုင်များ စီမံခန့်ခွဲမှု",
        posts: "ပို့စ်များ စီမံခန့်ခွဲမှု",
        users: "User Analysis",
        graduatedYears: "နှစ်အလိုက်ဘွဲ့ရ အရေအတွက်",
        salaryRanges: "ဝင်ငွေနှုန်း အပိုင်းအခြား",
        jobStatus: "ဘွဲ့ရအလုပ်အကိုင် အခြေအနေ",
        registerUsers: "စာရင်းသွင်းပြီးကျောင်းသားများ",
        contact: "ဆက်သွယ်ရန်",
        profile: "ပရိုဖိုင် ",
        logout: "ထွက်ရန်",
        english: "English",
        myanmar: "မြန်မာ",
        copyright: `© ${year} Alumni Network`,
        expand: "Sidebar ဖွင့်ရန်",
        collapse: "Sidebar ပိတ်ရန်",
        openMenu: "Staff menu ဖွင့်ရန်",
        closeMenu: "Staff menu ပိတ်ရန်",
      },
    }),
    [year],
  );

  const t = labels[currentLang];

  const makeHref = (path: string, nextLang: Lang = currentLang, keepParams = false) => {
    const params = keepParams
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();

    params.set("lang", nextLang);
    return `${path}?${params.toString()}`;
  };

  // Top navigation sequence excluding manage-staff
  const topNavs: NavItem[] = [
    { key: "dashboard", label: t.dashboard, href: makeHref("/staff/dashboard"), icon: LayoutDashboard },
    { key: "manage-users", label: t.manageUsers, href: makeHref("/staff/manage-users"), icon: Users },
    { key: "jobs", label: t.jobs, href: makeHref("/staff/jobs"), icon: Briefcase },
    { key: "posts", label: t.posts, href: makeHref("/staff/posts"), icon: Newspaper },
  ];

  const analyticsItems: NavItem[] = [
    { key: "users-graduated-years", label: t.graduatedYears, href: makeHref("/staff/users/graduated-years"), icon: GraduationCap },
    { key: "users-salary-ranges", label: t.salaryRanges, href: makeHref("/staff/users/salary-ranges"), icon: TrendingUp },
    { key: "users-job-status", label: t.jobStatus, href: makeHref("/staff/users/job-status"), icon: LineChart },
  ];

  const bottomNavs: NavItem[] = [
    { key: "register-users", label: t.registerUsers, href: makeHref("/staff/register-users"), icon: FileSpreadsheet },
    { key: "contact", label: t.contact, href: makeHref("/staff/contact"), icon: Contact },
    { key: "profile", label: t.profile, href: makeHref("/staff/profile"), icon: UserCircle },
  ];

  function handleCollapseToggle() {
    setCollapsed((prev) => !prev);
  }

  function handleAnalyticsToggle() {
    if (collapsed) return;
    setAnalyticsOpen((prev) => !prev);
  }

  async function handleLogout() {
    await signOut({ redirect: false });
    window.location.href = "https://ucshalumninetwork.netlify.app/staff/login";
  }

  return (
    <>
      {/* MOBILE TOP NAVBAR */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90 lg:hidden">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#25C9C8]/50 bg-white shadow-sm">
            <Image
              src="/logo/logo-250.png"
              alt="Alumni Network Logo"
              fill
              sizes="40px"
              className="object-contain p-0.5"
              priority
            />
          </span>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-[15px] font-black leading-tight text-slate-900 dark:text-white">
              Alumni Network
            </span>
            <span className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Staff Portal
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={t.openMenu}
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-900 dark:text-slate-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      <button
        type="button"
        aria-label={t.closeMenu}
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 dark:border-slate-800/80 dark:bg-slate-950/95 dark:shadow-black/50 lg:transition-all ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${collapsed ? "lg:w-[92px]" : "lg:w-[290px]"} w-[290px]`}
      >
        <div className="flex min-h-0 flex-1 flex-col p-4">
          
          {/* LOGO & DESKTOP TOGGLE HEADER */}
          <div className={`mb-6 flex ${collapsed ? "justify-center" : "items-center justify-between"}`}>
            
            <button
              type="button"
              onClick={handleCollapseToggle}
              title={collapsed ? t.expand : t.collapse}
              className="group flex items-center gap-3 text-left transition-all pointer-events-none lg:pointer-events-auto active:scale-95"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#25C9C8]/50 bg-white shadow-sm transition-transform lg:group-hover:scale-105 lg:group-hover:shadow-md">
                <Image
                  src="/logo/logo-250.png"
                  alt="Alumni Network Logo"
                  fill
                  sizes="44px"
                  className="object-contain p-0.5"
                  priority
                />
              </span>
              
              {!collapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-[15px] font-black text-slate-900 transition-colors dark:text-white lg:group-hover:text-[#008B8B]">
                    Alumni Network
                  </span>
                  <span className="truncate text-xs font-bold text-slate-500 dark:text-slate-400">
                    Staff Portal
                  </span>
                </div>
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              aria-label={t.closeMenu}
              onClick={() => setMobileOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            
            {topNavs.map((item) => (
              <NavLinkItem
                key={item.key}
                item={item}
                active={active}
                collapsed={collapsed}
                closeMobile={() => setMobileOpen(false)}
              />
            ))}

            <div>
              {collapsed ? (
                <a
                  href={makeHref("/staff/users/graduated-years")}
                  title={t.users}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex w-full items-center justify-center rounded-2xl px-0 py-3 text-sm font-black transition-all ${
                    isAnalyticsActive
                      ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                  }`}
                >
                  <BarChart3 className="h-5 w-5 shrink-0" />
                </a>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleAnalyticsToggle}
                    className={`group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition-all ${
                      isAnalyticsActive
                        ? "bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-lg shadow-cyan-500/25"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {isAnalyticsActive && (
                      <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                    )}

                    <BarChart3 className="h-5 w-5 shrink-0" />
                    <span className="truncate">{t.users}</span>

                    <ChevronDown className={`ml-auto h-4 w-4 transition ${analyticsOpen ? "rotate-180" : ""}`} />
                  </button>

                  {analyticsOpen && (
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
                </>
              )}
            </div>

            {bottomNavs.map((item) => (
              <NavLinkItem
                key={item.key}
                item={item}
                active={active}
                collapsed={collapsed}
                closeMobile={() => setMobileOpen(false)}
              />
            ))}
          </nav>

          {/* LANGUAGE TOGGLE */}
          <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
            <div className={`grid gap-2 ${collapsed ? "grid-cols-1" : "grid-cols-2"}`}>
              <a
                href={makeHref(currentPath, "en", true)}
                className={`rounded-2xl px-3 py-2 text-center text-xs font-black transition ${
                  currentLang === "en"
                    ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-950"
                }`}
              >
                {collapsed ? "EN" : t.english}
              </a>

              <a
                href={makeHref(currentPath, "mm", true)}
                className={`rounded-2xl px-3 py-2 text-center text-xs font-black transition ${
                  currentLang === "mm"
                    ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-950"
                }`}
              >
                {collapsed ? "MM" : t.myanmar}
              </a>
            </div>
          </div>

          <p className={`mt-4 text-center text-[11px] font-bold text-slate-400 ${collapsed ? "hidden" : ""}`}>
            {t.copyright}
          </p>
        </div>

        {/* LOGOUT BUTTON */}
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

      {/* DESKTOP FLEX SPACER */}
      <div
        className={`hidden shrink-0 transition-all duration-300 lg:block ${
          collapsed ? "lg:w-[92px]" : "lg:w-[290px]"
        }`}
      />

      <style jsx global>{`
        @media (max-width: 1023px) {
          main,
          [role="main"],
          .staff-main-content {
            padding-top: 3.5rem !important;
          }
        }
      `}</style>
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
    <a
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
    </a>
  );
}