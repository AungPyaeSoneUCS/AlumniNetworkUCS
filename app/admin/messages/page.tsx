// file: app/admin/messages/page.tsx

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Newspaper,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Message from "@/models/Message";

export default async function AdminMessagesPage() {
  const session = await auth();

  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id name email image role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const messages: any[] = await Message.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("sender", "name email image department graduatedYear")
    .populate("receiver", "name email image department graduatedYear")
    .lean();

  const seenCount = messages.filter((message) => message.seen).length;
  const unseenCount = messages.length - seenCount;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#ecfeff] via-white to-[#f8fafc] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur-xl lg:block">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-md">
              <Image
                src="/logo/logo-250.png"
                alt="Admin"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-950">Admin</h1>
              <p className="text-xs font-bold text-slate-400">Alumni Panel</p>
            </div>
          </Link>

          <nav className="mt-10 space-y-2">
            <SideLink href="/admin/dashboard" icon={<LayoutDashboard />} text="Dashboard" />
            <SideLink href="/admin/users" icon={<Users />} text="Users" />
            <SideLink href="/admin/posts" icon={<Newspaper />} text="Posts" />
            <SideLink href="/admin/messages" icon={<MessageCircle />} text="Messages" active />
            <SideLink href="/admin/notifications" icon={<Bell />} text="Notifications" />
            <SideLink href="/jobs" icon={<Briefcase />} text="Jobs" />
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="hidden max-w-md flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex">
                <Search size={18} className="text-slate-400" />
                <input
                  placeholder="Search messages..."
                  disabled
                  className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="ml-auto flex items-center gap-3">
                <Link
                  href="/admin/dashboard"
                  className="rounded-2xl bg-[#00A8A8] px-4 py-2.5 text-sm font-black text-white shadow-lg"
                >
                  Dashboard
                </Link>

                <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200">
                  <Image
                    src={admin.image || "/avatar.png"}
                    alt={admin.name || "Admin"}
                    width={38}
                    height={38}
                    className="h-10 w-10 rounded-xl object-cover"
                  />

                  <div className="hidden sm:block">
                    <p className="text-sm font-black">{admin.name || "Admin"}</p>
                    <p className="text-xs font-bold text-slate-400">
                      Administrator
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-[#008B8B]">
                  Message Monitoring
                </p>

                <h2 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  Messages
                </h2>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  Review latest alumni conversations and message status.
                </p>
              </div>

              <Link
                href="/admin/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft size={18} />
                Back
              </Link>
            </div>

            <section className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Latest Messages" value={messages.length} icon={<MessageCircle />} />
              <StatCard title="Seen" value={seenCount} icon={<CheckCircle2 />} />
              <StatCard title="Unseen" value={unseenCount} icon={<ShieldCheck />} />
              <StatCard title="Limit" value={200} icon={<Calendar />} />
            </section>

            {messages.length === 0 ? (
              <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-slate-100 text-[#008B8B]">
                  <MessageCircle size={36} />
                </div>

                <h2 className="mt-5 text-2xl font-black">No Messages Found</h2>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  Alumni messages will appear here.
                </p>
              </section>
            ) : (
              <section className="grid gap-5">
                {messages.map((message) => {
                  const sender = message.sender || {};
                  const receiver = message.receiver || {};

                  return (
                    <article
                      key={String(message._id)}
                      className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="grid gap-5 p-5 xl:grid-cols-[1fr_1.2fr_1fr] xl:items-center">
                        <UserBlock title="Sender" user={sender} />

                        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-[#008B8B]">
                              <MessageCircle size={18} />
                              <p className="text-xs font-black uppercase tracking-widest">
                                Message
                              </p>
                            </div>

                            <StatusBadge seen={Boolean(message.seen)} />
                          </div>

                          <p className="whitespace-pre-line break-words text-sm font-bold leading-7 text-slate-700">
                            {message.text || "No message text"}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <InfoBadge
                              icon={<Calendar size={14} />}
                              text={formatDate(message.createdAt)}
                            />
                          </div>
                        </div>

                        <UserBlock title="Receiver" user={receiver} />
                      </div>
                    </article>
                  );
                })}
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
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-[#eef2ff] text-[#4f46e5]"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <span className="h-5 w-5">{icon}</span>
      {text}
    </Link>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4f46e5]">
          {icon}
        </div>

        <p className="text-3xl font-black">{value}</p>
      </div>

      <p className="mt-5 text-sm font-bold text-slate-500">{title}</p>
    </div>
  );
}

function UserBlock({ title, user }: { title: string; user: any }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-4 text-xs font-black uppercase tracking-widest text-[#008B8B]">
        {title}
      </p>

      <div className="flex items-center gap-4">
        <Image
          src={user.image || "/avatar.png"}
          alt={user.name || "Alumni"}
          width={56}
          height={56}
          className="h-14 w-14 rounded-2xl object-cover shadow-sm"
        />

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-black text-slate-950">
            {user.name || "Unknown Alumni"}
          </h3>

          <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
            <Mail size={13} />
            <span className="line-clamp-1">{user.email || "No email"}</span>
          </p>

          <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-400">
            <UserRound size={13} />
            <span className="line-clamp-1">
              {user.department || "Alumni"}
              {user.graduatedYear ? ` • ${user.graduatedYear}` : ""}
            </span>
          </p>
        </div>
      </div>

      {user._id && (
        <Link
          href={`/profile/${user._id}`}
          className="mt-4 flex items-center justify-center rounded-2xl bg-slate-50 px-4 py-3 text-xs font-black text-[#008B8B] ring-1 ring-slate-200 transition hover:bg-white hover:shadow-md"
        >
          View Profile
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ seen }: { seen: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
        seen ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <ShieldCheck size={14} />
      {seen ? "Seen" : "Unseen"}
    </span>
  );
}

function InfoBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 ring-1 ring-slate-200">
      <span className="text-[#008B8B]">{icon}</span>
      {text}
    </span>
  );
}

function formatDate(value?: string | Date) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}