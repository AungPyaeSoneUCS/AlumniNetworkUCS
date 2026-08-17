// file: app/admin/users/[id]/page.tsx

import type React from "react";
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
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Newspaper,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import UserModel from "@/models/User";

type Lang = "en" | "mm";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?:
    | Promise<{ lang?: Lang }>
    | { lang?: Lang };
};

const text = {
  en: {
    admin: "Admin",
    alumniPanel: "Alumni Panel",
    dashboard: "Dashboard",
    usersAnalytics: "Users Analytics",
    manageUsers: "Manage Users",
    jobs: "Jobs",
    posts: "Posts",
    registerData: "Register Data",
    logout: "Logout",
    english: "English",
    myanmar: "Myanmar",

    back: "Back to Users",
    unknownUser: "Unknown User",
    noEmail: "No email",
    publicProfile: "Public Profile",
    privateProfile: "Private Profile",
    active: "Active",
    blocked: "Blocked",
    unblock: "Unblock / Active",
    block: "Block",

    profileInfo: "Profile Information",
    contactInfo: "Contact Information",
    experiences: "Experiences",

    degree: "Degree",
    graduatedYear: "Graduated Year",
    email: "Email",
    phone: "Phone",
    address: "Address",
    role: "Role",
    status: "Status",
    company: "Company",
    position: "Position",
    salary: "Salary",
    location: "Location",
    duration: "Duration",
    type: "Type",
    current: "Current",
    unknown: "Unknown",
    notAvailable: "N/A",
    noExperiences: "No experience data found.",
  },

  mm: {
    admin: "အက်မင်",
    alumniPanel: "Alumni Panel",
    dashboard: "Dashboard",
    usersAnalytics: "အသုံးပြုသူ စာရင်းဇယား",
    manageUsers: "အသုံးပြုသူ စီမံရန်",
    jobs: "အလုပ်အကိုင်များ",
    posts: "ပို့စ်များ",
    registerData: "မှတ်ပုံတင်ဒေတာ",
    logout: "ထွက်ရန်",
    english: "English",
    myanmar: "မြန်မာ",

    back: "အသုံးပြုသူများသို့ ပြန်သွားရန်",
    unknownUser: "အမည်မရှိသော အသုံးပြုသူ",
    noEmail: "Email မရှိပါ",
    publicProfile: "Public Profile",
    privateProfile: "Private Profile",
    active: "အသုံးပြုနိုင်",
    blocked: "ပိတ်ထားသည်",
    unblock: "ပြန်ဖွင့်ရန် / Active",
    block: "ပိတ်ရန်",

    profileInfo: "Profile အချက်အလက်",
    contactInfo: "ဆက်သွယ်ရန် အချက်အလက်",
    experiences: "အတွေ့အကြုံများ",

    degree: "Degree",
    graduatedYear: "ဘွဲ့ရခုနှစ်",
    email: "Email",
    phone: "ဖုန်း",
    address: "လိပ်စာ",
    role: "Role",
    status: "အခြေအနေ",
    company: "ကုမ္ပဏီ",
    position: "ရာထူး",
    salary: "လစာ",
    location: "နေရာ",
    duration: "ကာလ",
    type: "အမျိုးအစား",
    current: "လက်ရှိ",
    unknown: "မသိရှိ",
    notAvailable: "မရှိပါ",
    noExperiences: "Experience data မတွေ့ပါ။",
  },
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
  revalidatePath("/admin/manage-users");
}

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function getDegree(user: any, t: typeof text.en) {
  return cleanText(user?.degree || user?.department) || t.notAvailable;
}

function getPhone(user: any, t: typeof text.en) {
  return (
    cleanText(
      user?.contactInfo?.phone ||
        user?.personalContact?.phone ||
        user?.professionalContact?.phone
    ) || t.notAvailable
  );
}

function getAddress(user: any, t: typeof text.en) {
  return (
    cleanText(user?.contactInfo?.address || user?.personalContact?.address) ||
    t.notAvailable
  );
}

function getDuration(item: any, t: typeof text.en) {
  const start = cleanText(item?.startDate) || t.unknown;
  const end = item?.isCurrent
    ? t.current
    : cleanText(item?.endDate) || t.unknown;

  return `${start} - ${end}`;
}

export default async function AdminUserDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await UserModel.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const user: any = await UserModel.findById(id)
    .select(
      "_id name email image role isBlocked degree department graduatedYear contactInfo personalContact professionalContact experiences createdAt isProfilePublic"
    )
    .lean();

  if (!user) notFound();

  const experiences = Array.isArray(user.experiences) ? user.experiences : [];

  return (
    <main className="min-h-screen bg-[#eef2f7] text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/70">
                    {t.admin}
                  </p>
                  <h1 className="text-2xl font-black">{t.alumniPanel}</h1>
                </div>
              </div>
            </div>

            <nav className="mt-7 space-y-3">
              <SideLink
                href="/admin/dashboard"
                icon={<LayoutDashboard />}
                text={t.dashboard}
              />
              <SideLink
                href={`/admin/users?lang=${lang}`}
                icon={<Users />}
                text={t.usersAnalytics}
              />
              <SideLink
                href={`/admin/manage-users?lang=${lang}`}
                icon={<UserCheck />}
                text={t.manageUsers}
                active
              />
              <SideLink
                href={`/admin/jobs?lang=${lang}`}
                icon={<Briefcase />}
                text={t.jobs}
              />
              <SideLink href="/admin/posts" icon={<Newspaper />} text={t.posts} />
              <SideLink
                href="/admin/register-users"
                icon={<FileSpreadsheet />}
                text={t.registerData}
              />
            </nav>

            <div className="mt-6 rounded-[22px] border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/admin/users/${id}?lang=en`}
                  className={`rounded-2xl px-3 py-2 text-center text-xs font-black transition ${
                    lang === "en"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-white dark:hover:bg-slate-900"
                  }`}
                >
                  {t.english}
                </Link>

                <Link
                  href={`/admin/users/${id}?lang=mm`}
                  className={`rounded-2xl px-3 py-2 text-center text-xs font-black transition ${
                    lang === "mm"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-white dark:hover:bg-slate-900"
                  }`}
                >
                  {t.myanmar}
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-black text-red-500 transition hover:bg-red-500 hover:text-white dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            <LogOut className="h-5 w-5" />
            {t.logout}
          </Link>
        </aside>

        <section className="p-4 sm:p-6 lg:p-8">
          <div className="mb-5 flex items-center justify-between">
            <Link
              href={`/admin/manage-users?lang=${lang}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.back}
            </Link>

            <Link
              href="/api/auth/signout"
              className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white lg:hidden"
            >
              {t.logout}
            </Link>
          </div>

          <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center text-center">
                <Image
                  src={user.image || "/avatar.png"}
                  alt={user.name || t.unknownUser}
                  width={128}
                  height={128}
                  className="h-32 w-32 rounded-[34px] object-cover shadow-xl"
                />

                <h1 className="mt-5 text-3xl font-black">
                  {user.name || t.unknownUser}
                </h1>

                <p className="mt-1 text-sm font-bold text-slate-400">
                  {user.email || t.noEmail}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <RoleBadge role={user.role || "user"} />
                  <StatusBadge blocked={Boolean(user.isBlocked)} t={t} />
                  <Badge>
                    {user.isProfilePublic ? t.publicProfile : t.privateProfile}
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
                  {t.unblock}
                </button>

                <button
                  name="status"
                  value="blocked"
                  className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition hover:bg-red-600"
                >
                  {t.block}
                </button>
              </form>
            </div>

            <div className="grid gap-5">
              <Panel title={t.profileInfo}>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoLine
                    icon={<GraduationCap />}
                    label={t.degree}
                    value={getDegree(user, t)}
                  />
                  <InfoLine
                    icon={<Calendar />}
                    label={t.graduatedYear}
                    value={user.graduatedYear || t.notAvailable}
                  />
                  <InfoLine
                    icon={<User />}
                    label={t.role}
                    value={user.role || "user"}
                  />
                  <InfoLine
                    icon={<CheckCircle2 />}
                    label={t.status}
                    value={user.isBlocked ? t.blocked : t.active}
                  />
                </div>
              </Panel>

              <Panel title={t.contactInfo}>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoLine
                    icon={<Mail />}
                    label={t.email}
                    value={user.email || t.notAvailable}
                  />
                  <InfoLine
                    icon={<Phone />}
                    label={t.phone}
                    value={getPhone(user, t)}
                  />
                  <InfoLine
                    icon={<MapPin />}
                    label={t.address}
                    value={getAddress(user, t)}
                  />
                  <InfoLine
                    icon={<Briefcase />}
                    label={t.company}
                    value={user.professionalContact?.company || t.notAvailable}
                  />
                </div>
              </Panel>
            </div>
          </section>

          <section className="mt-5">
            <Panel title={t.experiences}>
              {experiences.length === 0 ? (
                <EmptyText>{t.noExperiences}</EmptyText>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {experiences.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="rounded-[24px] bg-slate-50 p-5 dark:bg-slate-950"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                        <Briefcase className="h-5 w-5" />
                      </div>

                      <h3 className="text-base font-black">
                        {item.position || t.notAvailable}
                      </h3>

                      <p className="mt-1 text-sm font-bold text-slate-400">
                        {item.company || t.notAvailable}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{item.employmentType || t.notAvailable}</Badge>
                        <Badge>{getDuration(item, t)}</Badge>
                      </div>

                      <div className="mt-4 grid gap-2">
                        <MiniInfo
                          label={t.location}
                          value={item.location || t.notAvailable}
                        />
                        <MiniInfo
                          label={t.salary}
                          value={item.salary || t.notAvailable}
                        />
                        <MiniInfo
                          label={t.email}
                          value={item.email || t.notAvailable}
                        />
                        <MiniInfo
                          label={t.phone}
                          value={item.phone || t.notAvailable}
                        />
                      </div>

                      {item.description && (
                        <p className="mt-4 line-clamp-4 whitespace-pre-line rounded-2xl bg-white p-4 text-sm font-semibold leading-7 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </section>
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
          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      {text}
    </Link>
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
    <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
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
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
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

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black">{value}</p>
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

function StatusBadge({
  blocked,
  t,
}: {
  blocked: boolean;
  t: typeof text.en;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
        blocked
          ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
      }`}
    >
      {blocked ? <Ban size={13} /> : <CheckCircle2 size={13} />}
      {blocked ? t.blocked : t.active}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 dark:bg-slate-950 dark:text-slate-300">
      {children}
    </span>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-400 dark:bg-slate-950">
      {children}
    </div>
  );
}