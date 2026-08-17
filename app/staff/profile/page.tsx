// file: app/staff/profile/page.tsx

import type React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import StaffSidebar from "@/components/staff/staff-sidebar";
import ProfileClientForm from "./client-form";

type Lang = "en" | "mm";

export default async function StaffProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: Lang }> | { lang?: Lang };
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";

  const session = await auth();
  if (!session?.user?.email) redirect("/staff/login");

  await connectDB();
  // We added "position" to the select query
  const staffUser: any = await User.findOne({ email: session.user.email })
    .select("_id name email position role")
    .lean();

  if (!staffUser || (staffUser.role !== "staff" && staffUser.role !== "admin")) {
    redirect("/staff/login");
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <StaffSidebar active="profile" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-4xl space-y-4 md:space-y-6">
            <ProfileClientForm 
               user={{ 
                 name: staffUser.name, 
                 email: staffUser.email, 
                 position: staffUser.position || "Staff" // Pass position safely
               }} 
               lang={lang} 
            />
          </div>
        </section>
      </div>
    </div>
  );
}