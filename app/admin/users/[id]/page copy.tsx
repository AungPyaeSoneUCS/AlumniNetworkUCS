// file: app/admin/users/[id]/page.tsx

import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Calendar,
  CheckCircle2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/User";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateUserStatus(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");

  if (!id) return;

  const session = await auth();

  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await UserModel.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  await UserModel.findByIdAndUpdate(id, {
    isBlocked: status === "blocked",
  });

  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin/users");
}

export default async function AdminUserDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await UserModel.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const user: any = await UserModel.findById(id)
    .select(
      "_id name email image role isBlocked department graduatedYear bio contactInfo personalContact professionalContact experiences skills projects createdAt isProfilePublic"
    )
    .lean();

  if (!user) notFound();

  const experiences = Array.isArray(user.experiences) ? user.experiences : [];
  const skills = Array.isArray(user.skills) ? user.skills : [];
  const projects = Array.isArray(user.projects) ? user.projects : [];

  const profilePercent = Math.min(
    [
      user.name,
      user.email,
      user.image,
      user.bio,
      user.department,
      user.graduatedYear,
      skills.length,
      experiences.length,
      projects.length,
    ].filter(Boolean).length * 12,
    100
  );

  const degreePercent = user.graduatedYear ? 100 : 35;
  const activePercent = user.isBlocked ? 20 : 100;

  return (
    <main className="h-screen overflow-hidden bg-[#eef2f7] p-4 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex h-full max-w-[1600px] gap-5 overflow-hidden">
        {/* LEFT ROUNDED SIDEBAR */}
        <aside className="hidden h-full w-[270px] shrink-0 flex-col justify-between rounded-[34px] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 lg:flex">
          <div>
            <div className="rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl shadow-indigo-500/25">
              <p className="text-sm font-bold text-white/75">Admin</p>
              <h1 className="mt-2 text-2xl font-black">Alumni Panel</h1>
            </div>

            <nav className="mt-7 space-y-3">
              <SideLink href="/admin/dashboard" icon={<LayoutDashboard />} text="Dashboard" />
              <SideLink href="/admin/users" icon={<Users />} text="Users" active />
              <SideLink href="/admin/jobs" icon={<Briefcase />} text="Jobs" />
              <SideLink href="/admin/posts" icon={<Newspaper />} text="Posts" />
            </nav>
          </div>

          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </Link>
        </aside>

        {/* RIGHT ROUNDED CONTENT */}
        <section className="min-w-0 flex-1 overflow-hidden rounded-[34px] border border-slate-200 bg-white/80 shadow-2xl shadow-slate-200/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30">
          <div className="h-full overflow-y-auto p-4 sm:p-5 lg:p-6">
            <div className="mb-5 flex items-center justify-between">
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Link>

              <div className="lg:hidden">
                <Link
                  href="/api/auth/signout"
                  className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white"
                >
                  Logout
                </Link>
              </div>
            </div>

            <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
              {/* PROFILE CARD */}
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20">
                <div className="flex flex-col items-center text-center">
                  <Image
                    src={user.image || "/avatar.png"}
                    alt={user.name || "User"}
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-[34px] object-cover shadow-xl"
                  />

                  <h1 className="mt-5 text-3xl font-black">
                    {user.name || "Unknown User"}
                  </h1>

                  <p className="mt-1 text-sm font-bold text-slate-400">
                    {user.email || "No email"}
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <RoleBadge role={user.role || "user"} />
                    <StatusBadge blocked={Boolean(user.isBlocked)} />
                    <Badge>
                      {user.isProfilePublic ? "Public Profile" : "Private Profile"}
                    </Badge>
                  </div>
                </div>

                <form
                  action={updateUserStatus}
                  className="mt-6 grid grid-cols-2 gap-3"
                >
                  <input type="hidden" name="id" value={String(user._id)} />

                  <button
                    name="status"
                    value="active"
                    className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-600"
                  >
                    Unblock / Active
                  </button>

                  <button
                    name="status"
                    value="blocked"
                    className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-600"
                  >
                    Block
                  </button>
                </form>

                <div className="mt-6 grid gap-3">
                  <InfoLine icon={<GraduationCap />} label="Department" value={user.department || "N/A"} />
                  <InfoLine icon={<Calendar />} label="Graduated Year" value={user.graduatedYear || "-"} />
                  <InfoLine icon={<Mail />} label="Email" value={user.email || "-"} />
                  <InfoLine icon={<Phone />} label="Phone" value={user.contactInfo?.phone || user.personalContact?.phone || "-"} />
                  <InfoLine icon={<MapPin />} label="Address" value={user.contactInfo?.address || user.personalContact?.address || "-"} />
                </div>
              </div>

              {/* ANALYTICS CARD */}
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20">
                <h2 className="text-2xl font-black">Account Analytics</h2>

                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Profile, degree, account status and activities.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <CircleChart
                    label="Profile"
                    percent={profilePercent}
                    value={`${profilePercent}%`}
                    color="text-indigo-500"
                  />

                  <CircleChart
                    label="Degree"
                    percent={degreePercent}
                    value={user.graduatedYear || "N/A"}
                    color="text-blue-500"
                  />

                  <CircleChart
                    label="Status"
                    percent={activePercent}
                    value={user.isBlocked ? "Blocked" : "Active"}
                    color={user.isBlocked ? "text-red-500" : "text-emerald-500"}
                  />
                </div>

                <div className="mt-7 space-y-5">
                  <Bar label="Experiences" value={experiences.length} color="bg-indigo-500" />
                  <Bar label="Skills" value={skills.length} color="bg-blue-500" />
                  <Bar label="Projects" value={projects.length} color="bg-emerald-500" />
                </div>

                <p className="mt-6 whitespace-pre-line rounded-[24px] bg-slate-50 p-5 text-sm font-semibold leading-7 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {user.bio || "No bio added yet."}
                </p>
              </div>
            </section>

            {experiences.length > 0 && (
              <section className="mt-5">
                <Panel title="Experiences">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {experiences.map((item: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-[24px] bg-slate-50 p-5 shadow-inner dark:bg-slate-900"
                      >
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                          <Briefcase className="h-5 w-5" />
                        </div>

                        <h3 className="text-lg font-black">
                          {item.position || "Position N/A"}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-400">
                          {item.company || "Company N/A"}
                        </p>

                        <p className="mt-3 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500 dark:bg-slate-950 dark:text-slate-300">
                          {item.startDate || "Unknown"} -{" "}
                          {item.isCurrent ? "Current" : item.endDate || "Unknown"}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function SideLink({
  href,
  icon,
  text,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-[22px] px-5 py-4 text-sm font-black transition ${
        active
          ? "bg-slate-950 text-white shadow-xl shadow-slate-900/20 dark:bg-white dark:text-slate-950"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      {text}
    </Link>
  );
}

function CircleChart({
  label,
  percent,
  value,
  color,
}: {
  label: string;
  percent: number;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className={`rounded-[24px] bg-slate-50 p-5 text-center dark:bg-slate-900 ${color}`}
    >
      <div
        className="mx-auto flex h-28 w-28 items-center justify-center rounded-full"
        style={{
          background: `conic-gradient(currentColor ${Math.min(
            percent,
            100
          )}%, #e5e7eb 0)`,
        }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-slate-950">
          <span className="text-sm font-black">{value}</span>
        </div>
      </div>

      <p className="mt-4 text-sm font-black text-slate-900 dark:text-white">
        {label}
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm font-black">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-900">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(value * 20, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20">
      <h2 className="mb-5 text-2xl font-black">{title}</h2>
      {children}
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>

        <p className="line-clamp-1 text-sm font-black">{value}</p>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-black text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
      {role === "admin" ? <ShieldCheck size={13} /> : <User size={13} />}
      {role}
    </span>
  );
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
        blocked
          ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      }`}
    >
      {blocked ? <Ban size={13} /> : <CheckCircle2 size={13} />}
      {blocked ? "Blocked" : "Active"}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </span>
  );
}