// file: app/api/me/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { exec } from "child_process";

import { auth } from "@/auth";
import { prisma, isValidId } from "@/lib/db";

const degreeValues = [
  "B.C.Sc",
  "B.C.Tech",
  "M.C.Sc",
  "M.C.Tech",
  "D.C.Sc",
  "M.I.Sc",
  "Ph.D",
  "",
] as const;

const ExperienceSchema = z.object({
  company: z.string().optional(),
  position: z.string().optional(),
  employmentType: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  salary: z.string().optional(),
  website: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().optional(),
  experienceYear: z.string().optional(),
});

const ContactInfoSchema = z.object({
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
});

const SocialLinksSchema = z.object({
  facebook: z.string().optional(),
  telegram: z.string().optional(),
  instagram: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  tiktok: z.string().optional(),
  viber: z.string().optional(),
  line: z.string().optional(),
  x: z.string().optional(),
  twitter: z.string().optional(),
  whatsapp: z.string().optional(),
  website: z.string().optional(),
});

const ProfileSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().optional(),
  bio: z.string().optional(),
  graduatedYear: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .optional()
    .nullable(),
  degree: z.enum(degreeValues).optional(),
  contactInfo: ContactInfoSchema.optional(),
  experiences: z.array(ExperienceSchema).optional(),
  socialLinks: SocialLinksSchema.optional(),
  isProfilePublic: z.boolean().optional(),
  profileVisibility: z.enum(["public"]).optional(),
  languagePreference: z.enum(["en", "mm"]).optional(),
  themePreference: z.enum(["light", "dark"]).optional(),
});

function trimValue(value?: string | null) {
  return value?.trim() || "";
}

function removeBase64Image(image?: string) {
  const cleanImage = trimValue(image);
  if (!cleanImage) return "";
  if (cleanImage.startsWith("data:")) return "";
  return cleanImage;
}

function cleanUsername(value?: string) {
  return trimValue(value)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^t\.me\//i, "")
    .replace(/^telegram\.me\//i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^youtube\.com\/@?/i, "")
    .replace(/^linkedin\.com\/in\//i, "")
    .replace(/^linkedin\.com\/company\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^tiktok\.com\/@?/i, "")
    .replace(/^x\.com\//i, "")
    .replace(/^twitter\.com\//i, "")
    .replace(/^wa\.me\//i, "")
    .replace(/^line\.me\/R\/ti\/p\/@?/i, "")
    .replace(/^viber:\/\/chat\?number=/i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
}

function cleanContactInfo(contactInfo?: z.infer<typeof ContactInfoSchema>) {
  return {
    phone: trimValue(contactInfo?.phone),
    email: trimValue(contactInfo?.email),
    address: trimValue(contactInfo?.address),
    company: trimValue(contactInfo?.company),
    position: trimValue(contactInfo?.position),
  };
}

function cleanSocialLinks(socialLinks?: z.infer<typeof SocialLinksSchema>) {
  const xValue = cleanUsername(socialLinks?.x || socialLinks?.twitter);

  return {
    facebook: cleanUsername(socialLinks?.facebook),
    telegram: cleanUsername(socialLinks?.telegram),
    instagram: cleanUsername(socialLinks?.instagram),
    youtube: cleanUsername(socialLinks?.youtube),
    linkedin: cleanUsername(socialLinks?.linkedin),
    github: cleanUsername(socialLinks?.github),
    tiktok: cleanUsername(socialLinks?.tiktok),
    viber: cleanUsername(socialLinks?.viber),
    line: cleanUsername(socialLinks?.line),
    x: xValue,
    twitter: xValue,
    whatsapp: cleanUsername(socialLinks?.whatsapp),
    website: trimValue(socialLinks?.website),
  };
}

function cleanExperiences(experiences?: z.infer<typeof ExperienceSchema>[]) {
  if (!Array.isArray(experiences)) return [];

  return experiences
    .map((item) => ({
      company: trimValue(item.company),
      position: trimValue(item.position),
      employmentType: trimValue(item.employmentType),
      location: trimValue(item.location),
      phone: trimValue(item.phone),
      email: trimValue(item.email),
      salary: trimValue(item.salary),
      website: trimValue(item.website),
      startDate: trimValue(item.startDate),
      endDate: item.isCurrent ? "" : trimValue(item.endDate),
      isCurrent: Boolean(item.isCurrent),
      experienceYear: trimValue(item.experienceYear),
    }))
    .filter(
      (item) =>
        item.company ||
        item.position ||
        item.employmentType ||
        item.location ||
        item.phone ||
        item.email ||
        item.salary ||
        item.website ||
        item.startDate ||
        item.endDate ||
        item.experienceYear
    );
}

function cleanDegree(userObject: any) {
  return trimValue(userObject.degree || userObject.department);
}

function cleanProfileResponse(userObject: any, experiences: any[] = []) {
  return {
    _id: String(userObject.id),
    name: userObject.name || "",
    email: userObject.email || "",
    role: userObject.role || "user",
    position: userObject.position || "",
    isBlocked: Boolean(userObject.isBlocked),
    image: userObject.image || "",
    bio: userObject.bio || "",
    graduatedYear: userObject.graduatedYear ? String(userObject.graduatedYear) : "",
    degree: cleanDegree(userObject),
    isVerified: Boolean(userObject.isVerified),
    fatherName: userObject.fatherName || "",
    contactInfo: cleanContactInfo({
      phone: userObject.contactPhone,
      email: userObject.contactEmail,
      address: userObject.contactAddress,
      company: userObject.contactCompany,
      position: userObject.contactPosition,
    }),
    experiences: cleanExperiences(experiences),
    socialLinks: cleanSocialLinks({
      facebook: userObject.socialFacebook,
      telegram: userObject.socialTelegram,
      instagram: userObject.socialInstagram,
      youtube: userObject.socialYoutube,
      linkedin: userObject.socialLinkedin,
      github: userObject.socialGithub,
      tiktok: userObject.socialTiktok,
      viber: userObject.socialViber,
      line: userObject.socialLine,
      x: userObject.socialX,
      twitter: userObject.socialTwitter,
      whatsapp: userObject.socialWhatsapp,
      website: userObject.socialWebsite,
    }),
    isProfilePublic: true,
    profileVisibility: "public",
    languagePreference: userObject.languagePreference || "en",
    themePreference: userObject.themePreference || "light",
    createdAt: userObject.createdAt || null,
    updatedAt: userObject.updatedAt || null,
  };
}

// ----------------------------------------------------
// DUAL AUTHENTICATION HELPER (Web Cookies or Mobile Headers)
// ----------------------------------------------------
async function getAuthenticatedUser(req: Request) {
  // 1. Check Mobile App Headers (x-user-id or Authorization)
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && isValidId(mobileHeaderId)) {
    const user = await prisma.user.findUnique({
      where: { id: mobileHeaderId },
      select: { id: true, email: true },
    });
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
      if (user) return user;
    }
  } catch (err) {
    // No active web session
  }

  return null;
}

// ==========================================
// 1. GET: Fetch Logged-in User Profile
// ==========================================
export async function GET(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const experiences = await prisma.experience.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(cleanProfileResponse(user, experiences), { status: 200 });
  } catch (error) {
    console.error("GET /api/me error:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. PUT: Update Logged-in User Profile
// ==========================================
export async function PUT(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = ProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid profile data",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) {
      updateData.name = trimValue(data.name);
    }

    if (data.image !== undefined) {
      updateData.image = removeBase64Image(data.image);
    }

    if (data.bio !== undefined) {
      updateData.bio = trimValue(data.bio);
    }

    if (data.graduatedYear !== undefined) {
      updateData.graduatedYear =
        data.graduatedYear === "null" || data.graduatedYear === null
          ? ""
          : data.graduatedYear;
    }

    if (data.degree !== undefined) {
      updateData.degree = data.degree || "";
    }

    if (data.contactInfo !== undefined) {
      const contactInfo = cleanContactInfo(data.contactInfo);
      updateData.contactPhone = contactInfo.phone;
      updateData.contactEmail = contactInfo.email;
      updateData.contactAddress = contactInfo.address;
      updateData.contactCompany = contactInfo.company;
      updateData.contactPosition = contactInfo.position;
    }

    if (data.socialLinks !== undefined) {
      const socialLinks = cleanSocialLinks(data.socialLinks);
      updateData.socialFacebook = socialLinks.facebook;
      updateData.socialTelegram = socialLinks.telegram;
      updateData.socialInstagram = socialLinks.instagram;
      updateData.socialYoutube = socialLinks.youtube;
      updateData.socialLinkedin = socialLinks.linkedin;
      updateData.socialGithub = socialLinks.github;
      updateData.socialTiktok = socialLinks.tiktok;
      updateData.socialViber = socialLinks.viber;
      updateData.socialLine = socialLinks.line;
      updateData.socialX = socialLinks.x;
      updateData.socialTwitter = socialLinks.twitter;
      updateData.socialWhatsapp = socialLinks.whatsapp;
      updateData.socialWebsite = socialLinks.website;
    }

    if (data.languagePreference !== undefined) {
      updateData.languagePreference = data.languagePreference;
    }

    if (data.themePreference !== undefined) {
      updateData.themePreference = data.themePreference;
    }

    updateData.isProfilePublic = true;
    updateData.profileVisibility = "public";

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
    });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (data.experiences !== undefined) {
      const cleanedExperiences = cleanExperiences(data.experiences);
      await prisma.experience.deleteMany({ where: { userId: currentUser.id } });
      if (cleanedExperiences.length > 0) {
        await prisma.experience.createMany({
          data: cleanedExperiences.map((exp) => ({
            userId: currentUser.id,
            ...exp,
          })),
        });
      }
    }

    const experiences = await prisma.experience.findMany({
      where: { userId: currentUser.id },
      orderBy: { createdAt: "asc" },
    });

    // Restart PM2 after a 10s delay so the profile update response goes out
    // first (avoids 502), then flushes the photo cache so the new photo shows.
    setTimeout(() => {
      exec("pm2 restart all", (error, stdout, stderr) => {
        if (error) {
          console.error("Failed to restart PM2:", error);
          return;
        }
        if (stderr) {
          console.error(`PM2 Restart stderr: ${stderr}`);
          return;
        }
        console.log(`PM2 Restart stdout: ${stdout}`);
      });
    }, 10000);

    return NextResponse.json(cleanProfileResponse(updatedUser, experiences), { status: 200 });
  } catch (error) {
    console.error("PUT /api/me error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}