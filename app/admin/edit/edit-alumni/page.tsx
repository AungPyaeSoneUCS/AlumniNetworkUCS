// file: app/admin/edit/edit-alumni/page.tsx
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EditAlumniForm from "@/components/admin/edit-alumni-form";
import EditNav from "@/components/admin/edit-nav";

type CleanedUser = {
  _id: string;
  name: string;
  email: string;
  image: string;
  bio: string;
  degree: string;
  graduatedYear: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    company: string;
    position: string;
  };
  experiences: any[];
  socialLinks: Record<string, string>;
};

function cleanUser(user: any): CleanedUser {
  return {
    _id: String(user._id),
    name: typeof user.name === "string" ? user.name.trim() : "",
    email: typeof user.email === "string" ? user.email.trim() : "",
    image:
      typeof user.image === "string" && user.image
        ? user.image
        : user.profileImage || user.googleImage || user.googleProfileImage || "",
    bio: typeof user.bio === "string" ? user.bio : "",
    degree: typeof user.degree === "string" ? user.degree : "",
    graduatedYear:
      user.graduatedYear && !/^nan$/i.test(String(user.graduatedYear))
        ? String(user.graduatedYear)
        : "",
    contactInfo: {
      phone: user.contactInfo?.phone || "",
      email: user.contactInfo?.email || "",
      address: user.contactInfo?.address || "",
      company: user.contactInfo?.company || "",
      position: user.contactInfo?.position || "",
    },
    experiences: Array.isArray(user.experiences)
      ? user.experiences.map((item: any) => ({
          company: item.company || "",
          position: item.position || "",
          employmentType: item.employmentType || "Student",
          location: item.location || "",
          phone: item.phone || "",
          email: item.email || "",
          salary: item.salary || "",
          website: item.website || "",
          startDate: item.startDate || "",
          endDate: item.isCurrent ? "" : item.endDate || "",
          isCurrent: Boolean(item.isCurrent),
          experienceYear: item.experienceYear || "",
        }))
      : [],
    socialLinks: {
      facebook: user.socialLinks?.facebook || "",
      telegram: user.socialLinks?.telegram || "",
      instagram: user.socialLinks?.instagram || "",
      youtube: user.socialLinks?.youtube || "",
      linkedin: user.socialLinks?.linkedin || "",
      github: user.socialLinks?.github || "",
      tiktok: user.socialLinks?.tiktok || "",
      viber: user.socialLinks?.viber || "",
      line: user.socialLinks?.line || "",
      whatsapp: user.socialLinks?.whatsapp || "",
      website: user.socialLinks?.website || "",
    },
  };
}

function graduatedYearFrom(data: any, existing: any) {
  let value =
    typeof data.graduatedYear === "string"
      ? data.graduatedYear.trim()
      : data.graduatedYear
        ? String(data.graduatedYear)
        : "";

  if (!value || /^nan$/i.test(value)) {
    value =
      existing && !/^nan$/i.test(String(existing))
        ? String(existing)
        : "";
  }

  return value;
}

export default async function EditAlumniPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: "en" | "mm"; search?: string }> | { lang?: "en" | "mm"; search?: string };
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");

  const admin: any = await prisma.user.findFirst({
    where: { email: session.user.email },
    select: { name: true, role: true },
  });
  if (!admin || admin.role !== "admin") redirect("/admin/login");

  const resolvedSearchParams = await Promise.resolve(searchParams || {});
  const lang = resolvedSearchParams.lang === "mm" ? "mm" : "en";
  const initialSearch = resolvedSearchParams.search || "";

  const rawRows: any[] = await prisma.user.findMany({
    where: { role: { not: "admin" } },
    orderBy: [{ graduatedYear: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      degree: true,
      graduatedYear: true,
      contactPhone: true,
      contactEmail: true,
      contactAddress: true,
      contactCompany: true,
      contactPosition: true,
      socialFacebook: true,
      socialTelegram: true,
      socialInstagram: true,
      socialYoutube: true,
      socialLinkedin: true,
      socialGithub: true,
      socialTiktok: true,
      socialViber: true,
      socialLine: true,
      socialWhatsapp: true,
      socialWebsite: true,
    },
  });

  const rawUsers = rawRows.map((u: any) => ({
    _id: String(u.id),
    name: u.name,
    email: u.email,
    image: u.image,
    bio: u.bio,
    degree: u.degree,
    graduatedYear: u.graduatedYear,
    contactInfo: {
      phone: u.contactPhone,
      email: u.contactEmail,
      address: u.contactAddress,
      company: u.contactCompany,
      position: u.contactPosition,
    },
    socialLinks: {
      facebook: u.socialFacebook,
      telegram: u.socialTelegram,
      instagram: u.socialInstagram,
      youtube: u.socialYoutube,
      linkedin: u.socialLinkedin,
      github: u.socialGithub,
      tiktok: u.socialTiktok,
      viber: u.socialViber,
      line: u.socialLine,
      whatsapp: u.socialWhatsapp,
      website: u.socialWebsite,
    },
  }));

  const allUsers = rawUsers.map(cleanUser);

  async function updateAlumniDataAction(userId: string, data: any) {
    "use server";

    const currentSession = await auth();
    if (!currentSession?.user?.email) return { error: "Unauthorized" };
    const adminCheck = await prisma.user.findFirst({
      where: { email: currentSession.user.email },
      select: { role: true },
    });
    if (!adminCheck || adminCheck.role !== "admin") return { error: "Forbidden" };

    try {
      const email = typeof data.email === "string" ? data.email.trim() : "";
      const name = typeof data.name === "string" ? data.name.trim() : "";

      // Name/Email already exist on the alumni record — keep the current
      // values when the update payload does not include them.
      const existingUser: any = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, graduatedYear: true },
      });
      if (!existingUser) return { error: "User not found." };

      const finalName = name || existingUser.name || "";
      const finalEmail = email || existingUser.email || "";

      if (!finalName || !finalEmail) return { error: "Name and Email are required." };

      if (finalEmail !== existingUser.email) {
        const emailTaken = await prisma.user.findFirst({
          where: { email: finalEmail, id: { not: userId } },
        });
        if (emailTaken) return { error: "Email is already taken by another user." };
      }

      const experiences = Array.isArray(data.experiences)
        ? data.experiences.map((item: any) => ({
            company: item.company || "",
            position: item.position || "",
            employmentType: item.employmentType || "",
            location: item.location || "",
            phone: item.phone || "",
            email: item.email || "",
            salary: item.salary || "",
            website: item.website || "",
            startDate: item.startDate || "",
            endDate: item.isCurrent ? "" : item.endDate || "",
            isCurrent: Boolean(item.isCurrent),
            experienceYear: item.experienceYear || "",
          }))
        : [];

      const updateData: any = {
        name: finalName,
        email: finalEmail,
        image: typeof data.image === "string" ? data.image : "",
        bio: typeof data.bio === "string" ? data.bio : "",
        degree: typeof data.degree === "string" ? data.degree : "",
        graduatedYear: graduatedYearFrom(data, existingUser.graduatedYear),
        contactPhone: data.contactInfo?.phone || "",
        contactEmail: data.contactInfo?.email || "",
        contactAddress: data.contactInfo?.address || "",
        contactCompany: data.contactInfo?.company || "",
        contactPosition: data.contactInfo?.position || "",
        socialFacebook: data.socialLinks?.facebook || "",
        socialTelegram: data.socialLinks?.telegram || "",
        socialInstagram: data.socialLinks?.instagram || "",
        socialYoutube: data.socialLinks?.youtube || "",
        socialLinkedin: data.socialLinks?.linkedin || "",
        socialGithub: data.socialLinks?.github || "",
        socialTiktok: data.socialLinks?.tiktok || "",
        socialViber: data.socialLinks?.viber || "",
        socialLine: data.socialLinks?.line || "",
        socialWhatsapp: data.socialLinks?.whatsapp || "",
        socialWebsite: data.socialLinks?.website || "",
      };

      await prisma.$transaction([
        prisma.experience.deleteMany({ where: { userId } }),
        prisma.user.update({ where: { id: userId }, data: updateData }),
        prisma.experience.createMany({
          data: experiences.map((item: any) => ({ ...item, userId })),
        }),
      ]);

      revalidatePath("/admin/edit/edit-alumni");
      revalidatePath("/admin/users");
      revalidatePath("/admin/manage-users");

      return { success: true };
    } catch (err: any) {
      return { error: err.message || "Failed to update alumni." };
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <EditNav lang={lang} userName={admin.name || "Admin"} />

      <div className="min-h-screen px-4 pb-8 pt-6 sm:px-6 md:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="relative z-20 overflow-visible rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 sm:p-5">
            <a
              href="/admin/edit"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-black text-slate-500 transition hover:text-[#008B8B] dark:text-slate-400 dark:hover:text-[#25C9C8]"
            >
              ← {lang === "mm" ? "ပြင်ဆင်ရန် ပင်မသို့" : "Back to Edit Home"}
            </a>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {lang === "mm" ? "ကျောင်းသားဟောင်း အပြည့်အစုံ ပြင်ရန်" : "Edit Alumni Data"}
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">
              {lang === "mm"
                ? "ကိုယ်ရေး၊ အတွေ့အကြုံ နှင့် လူမှုကွန်ရက် အချက်အလက်အားလုံးကို ပြင်ဆင်နိုင်သည်။"
                : "Edit all alumni data: personal info, experience, and social links."}
            </p>
          </div>

          <EditAlumniForm users={allUsers} lang={lang} initialSearch={initialSearch} onUpdate={updateAlumniDataAction} />
        </div>
      </div>
    </main>
  );
}