// file: app/admin/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Database,
  Lock,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.email) {
    await connectDB();

    const admin = await User.findOne({ email: session.user.email })
      .select("role")
      .lean();

    if (admin && admin.role === "admin") {
      redirect("/admin/dashboard");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef2f7] px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-500/20" />
      <div className="pointer-events-none absolute bottom-[-140px] right-[-140px] h-[360px] w-[360px] rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />

      <section className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-black text-indigo-600 shadow-lg shadow-slate-300/50 dark:border-indigo-500/20 dark:bg-slate-900 dark:text-indigo-300 dark:shadow-black/20">
            <Sparkles className="h-4 w-4" />
            Admin Control Center
          </div>

          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              Manage your alumni system with a clean admin panel.
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-500 dark:text-slate-400 sm:text-lg">
              Login to manage users, analytics, posts, jobs, register data and
              platform activity from one responsive dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/admin/login"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-1 hover:bg-indigo-600 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-100"
            >
              <Lock className="h-4 w-4" />
              Login as Admin
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 shadow-lg shadow-slate-300/40 transition hover:-translate-y-1 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:shadow-black/20 dark:hover:bg-slate-800"
            >
              Back to Home
            </Link>
          </div>

          {session?.user?.email && (
            <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              You are logged in, but this account does not have admin
              permission.
            </div>
          )}
        </div>

        <div className="relative">
          <div className="rounded-[36px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
            <div className="rounded-[30px] bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-white/40 dark:text-slate-400">
                    Overview
                  </p>
                  <h2 className="mt-1 text-2xl font-black">
                    Alumni Network
                  </h2>
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                  <ShieldCheck className="h-7 w-7" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DashboardTile
                  icon={<Users />}
                  title="Users"
                  value="Manage"
                  text="Alumni accounts"
                />
                <DashboardTile
                  icon={<BarChart3 />}
                  title="Analytics"
                  value="Track"
                  text="Year and job data"
                />
                <DashboardTile
                  icon={<Newspaper />}
                  title="Posts"
                  value="Review"
                  text="Community content"
                />
                <DashboardTile
                  icon={<Briefcase />}
                  title="Jobs"
                  value="Monitor"
                  text="Experience data"
                />
              </div>

              <div className="mt-5 rounded-[26px] bg-white/10 p-4 dark:bg-slate-950/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Register Data</p>
                    <p className="text-xs font-bold opacity-60">
                      Import, export and approve alumni records
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-3 -top-3 hidden rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-xl shadow-indigo-500/30 sm:block">
            Secure
          </div>

          <div className="absolute -bottom-3 -left-3 hidden rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-xl shadow-slate-300/60 dark:bg-slate-900 dark:text-slate-200 dark:shadow-black/30 sm:block">
            Responsive
          </div>
        </div>
      </section>
    </main>
  );
}

function DashboardTile({
  icon,
  title,
  value,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-[24px] bg-white/10 p-4 dark:bg-slate-950/10">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 dark:bg-slate-950/10 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="text-xs font-black uppercase tracking-widest opacity-50">
        {title}
      </p>
      <h3 className="mt-1 text-xl font-black">{value}</h3>
      <p className="mt-1 text-xs font-bold opacity-60">{text}</p>
    </div>
  );
}