// file: app/admin/update-student/page.tsx
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import AdminSidebar from "@/components/admin/admin-sidebar";
import DynamicStudentRegistrationForm from "@/components/admin/update-student-form";

export default async function UpdateStudentPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: "en" | "mm"; search?: string }> | { lang?: "en" | "mm"; search?: string };
}) {
  // 1. Authenticate the admin
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  await connectDB();
  const admin: any = await User.findOne({ email: session.user.email }).select("_id role").lean();
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  // 2. Handle Search Params
  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const initialSearch = resolvedSearchParams.search || "";

  // 3. Fetch all non-admin users to pass to the client component
  const rawUsers = await User.find({ role: { $ne: "admin" } })
    .select("_id name email phone contactInfo graduatedYear degree department")
    .lean();

  // Normalize data for the client
  const allUsers = rawUsers.map((u: any) => ({
    _id: String(u._id),
    name: u.name || "",
    email: u.email || "",
    phone: u.contactInfo?.phone || u.phone || u.phoneNumber || "",
    graduatedYear: u.graduatedYear || "",
    degree: u.degree || u.department || "",
  }));

  // 4. Server Action for updating the user
  async function updateUserAction(
    userId: string,
    data: { name: string; email: string; phone: string; password?: string }
  ) {
    "use server";
    await connectDB();

    // Re-verify admin for security
    const currentSession = await auth();
    if (!currentSession?.user?.email) return { error: "Unauthorized" };
    const adminCheck = await User.findOne({ email: currentSession.user.email }).select("role").lean();
    if (!adminCheck || adminCheck.role !== "admin") return { error: "Forbidden" };

    const updateData: any = {
      name: data.name,
      email: data.email,
    };

    if (data.phone) {
      updateData.phone = data.phone;
      updateData["contactInfo.phone"] = data.phone;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    try {
      // Check for duplicate emails
      const existing = await User.findOne({ email: data.email, _id: { $ne: userId } });
      if (existing) return { error: "Email is already taken by another user." };

      await User.findByIdAndUpdate(userId, { $set: updateData });
      
      revalidatePath("/admin/update-student");
      revalidatePath("/admin/manage-users");
      revalidatePath("/admin/create-users");
      
      return { success: true };
    } catch (err: any) {
      return { error: err.message || "Failed to update user." };
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">

        <section className="min-w-0 flex-1 px-4 pb-8 pt-16 sm:px-6 md:px-8 lg:pt-8">
          <div className="mx-auto max-w-4xl space-y-6">
            
            {/* Page Header */}
            <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {lang === "mm" ? "အကောင့် အချက်အလက်ပြင်ရန်" : "Update Alumni Account"}
              </h1>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
                {lang === "mm" 
                  ? "ကျောင်းသား၏ အမည်၊ အီးမေးလ်၊ ဖုန်းနှင့် စကားဝှက်တို့ကို ပြင်ဆင်နိုင်သည်။" 
                  : "Search for a student to quickly update their Name, Email, Phone, and Password."}
              </p>
            </div>

            {/* The Interactive Form Component */}
            <DynamicStudentRegistrationForm 
              users={allUsers} 
              lang={lang} 
              initialSearch={initialSearch}
              onUpdate={updateUserAction}
            />

          </div>
        </section>
      </div>
    </main>
  );
}