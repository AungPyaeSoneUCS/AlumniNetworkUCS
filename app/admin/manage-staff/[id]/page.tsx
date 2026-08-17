// file: app/admin/manage-staff/[id]/page.tsx

import type React from "react";
import Link from "next/link";
import Script from "next/script";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import {
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Save,
  UserCog,
} from "lucide-react";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import AdminSidebar from "@/components/admin/admin-sidebar";

type Lang = "en" | "mm";

const text = {
  en: {
    pageTitle: "Edit Staff Account",
    pageSubtitle: "Update the staff member's details and credentials.",
    back: "Back to Staff List",
    staff: "Name",
    position: "Position",
    email: "Email",
    password: "New Password",
    passwordPlaceholder: "Leave blank to keep current password",
    save: "Save Changes",
    emailExists: "This email is already registered to another user.",
    errorOccurred: "An error occurred while updating.",
    invalidPassword: "Password must be at least 8 chars with 1 uppercase, 1 lowercase, and 1 number.",
    invalidEmail: "Invalid email format.",
  },
  mm: {
    pageTitle: "Staff အကောင့် ပြင်ဆင်ရန်",
    pageSubtitle: "Staff ၏ အချက်အလက်များနှင့် စကားဝှက်ကို ပြင်ဆင်နိုင်သည်။",
    back: "Staff စာရင်းသို့ ပြန်သွားမည်",
    staff: "အမည်",
    position: "ရာထူး",
    email: "အီးမေးလ်",
    password: "စကားဝှက် အသစ်",
    passwordPlaceholder: "စကားဝှက်မပြောင်းလိုပါက ဤနေရာတွင် ဘာမှမရေးပါနှင့်",
    save: "ပြင်ဆင်မှုများကို သိမ်းမည်",
    emailExists: "ဤအီးမေးလ်ဖြင့် အခြားအကောင့်တစ်ခု ဖွင့်ထားပြီးဖြစ်သည်။",
    errorOccurred: "ပြင်ဆင်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။",
    invalidPassword: "စကားဝှက်တွင် စာလုံးကြီး၊ စာလုံးသေး၊ ဂဏန်း ပါဝင်ရမည်ဖြစ်ပြီး အနည်းဆုံး ၈ လုံးဖြစ်ရမည်။",
    invalidEmail: "အီးမေးလ်ပုံစံ မှားယွင်းနေပါသည်။",
  },
};

// SERVER ACTION TO UPDATE STAFF
async function updateStaffAccount(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const position = String(formData.get("position") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const lang = String(formData.get("lang") || "en");

  if (!id || !name || !position || !email) {
    redirect(`/admin/manage-staff/${id}?lang=${lang}&error=missing_fields`);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect(`/admin/manage-staff/${id}?lang=${lang}&error=invalid_email`);
  }

  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  // Verify Admin
  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  // Check if the target user exists and is a staff member
  const targetUser: any = await User.findById(id).select("role").lean();
  if (!targetUser || targetUser.role !== "staff") {
    redirect(`/admin/manage-staff?lang=${lang}`);
  }

  // Check if the new email is already taken by a DIFFERENT user
  const existingEmailUser = await User.findOne({ email, _id: { $ne: id } })
    .select("_id")
    .lean();

  if (existingEmailUser) {
    redirect(`/admin/manage-staff/${id}?lang=${lang}&error=email_exists`);
  }

  // Prepare updates
  const updates: any = { name, position, email };

  // Only update password if a new one is provided
  if (password.length > 0) {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
      redirect(`/admin/manage-staff/${id}?lang=${lang}&error=invalid_password`);
    }
    updates.password = await bcrypt.hash(password, 10);
  }

  await User.findByIdAndUpdate(id, { $set: updates });

  revalidatePath("/admin/manage-staff");
  revalidatePath(`/admin/manage-staff/${id}`);
  
  // Redirect back to the list tab with a success message
  redirect(`/admin/manage-staff?tab=list&lang=${lang}&success=updated`);
}

export default async function EditStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }> | any;
  searchParams?: Promise<{ lang?: Lang; error?: string }> | any;
}) {
  const resolvedParams = await Promise.resolve(params || {});
  const resolvedSearchParams = await Promise.resolve(searchParams || {});

  const id = resolvedParams.id;
  const lang: Lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const t = text[lang];

  const errorMsg =
    resolvedSearchParams.error === "email_exists"
      ? t.emailExists
      : resolvedSearchParams.error === "invalid_password"
      ? t.invalidPassword
      : resolvedSearchParams.error === "invalid_email"
      ? t.invalidEmail
      : resolvedSearchParams.error
      ? t.errorOccurred
      : null;

  // Authenticate Admin
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();

  const admin: any = await User.findOne({ email: session.user.email })
    .select("_id role")
    .lean();

  if (!admin || admin.role !== "admin") redirect("/admin/login");

  // Fetch the Staff Member's details
  const staffMember: any = await User.findById(id)
    .select("_id name email position role")
    .lean();

  // If user doesn't exist or isn't staff, boot them back to the manage list
  if (!staffMember || staffMember.role !== "staff") {
    redirect(`/admin/manage-staff?lang=${lang}`);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <AdminSidebar active="manage-staff" lang={lang} />

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-3xl space-y-4 md:space-y-6">
            
            {/* Header & Back Button */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {t.pageTitle}
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs font-semibold text-slate-500 sm:text-sm">
                    {t.pageSubtitle}
                  </p>
                </div>

                <Link
                  href={`/admin/manage-staff?tab=list&lang=${lang}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.back}
                </Link>
              </div>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* Edit Form */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-6 lg:p-8">
              <form action={updateStaffAccount} className="space-y-5">
                <input type="hidden" name="lang" value={lang} />
                <input type="hidden" name="id" value={String(staffMember._id)} />
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.staff}
                  </label>
                  <div className="relative">
                    <UserCog className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={staffMember.name}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.position}
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="position"
                      required
                      defaultValue={staffMember.position}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.email}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                      title={lang === "mm" ? "အီးမေးလ်ပုံစံ မှန်ကန်စွာရိုက်ထည့်ပါ။" : "Please enter a valid email address."}
                      defaultValue={staffMember.email}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.password}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password-input"
                      type="password"
                      name="password"
                      pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                      title={lang === "mm" ? t.invalidPassword : t.invalidPassword}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white placeholder:text-slate-400/70 dark:placeholder:text-slate-500"
                      placeholder={t.passwordPlaceholder}
                    />
                    <label className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-[#008B8B] transition-colors">
                      <input type="checkbox" id="show-pwd-checkbox" className="peer sr-only" />
                      <Eye className="h-4 w-4 peer-checked:hidden" />
                      <EyeOff className="h-4 w-4 hidden peer-checked:block" />
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-8 py-3 text-sm font-black text-white shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
                  >
                    <Save className="h-4 w-4" />
                    {t.save}
                  </button>
                </div>
              </form>

              <Script id="pwd-toggle-edit" strategy="afterInteractive">
                {`
                  document.getElementById('show-pwd-checkbox')?.addEventListener('change', function(e) {
                    const pwd = document.getElementById('password-input');
                    if (pwd) pwd.type = e.target.checked ? 'text' : 'password';
                  });
                `}
              </Script>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}