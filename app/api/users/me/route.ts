// app/api/users/me/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma, isValidId } from "@/lib/db";

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDegree(user: any) {
  return cleanText(user.degree || user.department);
}

function cleanContactInfo(user: any = {}) {
  return {
    phone: cleanText(user.contactPhone),
    email: cleanText(user.contactEmail),
    address: cleanText(user.contactAddress),
    company: cleanText(user.contactCompany),
    position: cleanText(user.contactPosition),
  };
}

function cleanSocialLinks(user: any = {}) {
  const xValue = cleanText(user.socialX || user.socialTwitter);

  return {
    facebook: cleanText(user.socialFacebook),
    telegram: cleanText(user.socialTelegram),
    instagram: cleanText(user.socialInstagram),
    youtube: cleanText(user.socialYoutube),
    linkedin: cleanText(user.socialLinkedin),
    github: cleanText(user.socialGithub),
    tiktok: cleanText(user.socialTiktok),
    viber: cleanText(user.socialViber),
    line: cleanText(user.socialLine),
    x: xValue,
    twitter: xValue,
    whatsapp: cleanText(user.socialWhatsapp),
    website: cleanText(user.socialWebsite),
  };
}

function cleanExperiences(experiences: any[] = []) {
  if (!Array.isArray(experiences)) return [];

  return experiences.map((item) => ({
    company: cleanText(item.company),
    position: cleanText(item.position),
    employmentType: cleanText(item.employmentType),
    location: cleanText(item.location),
    phone: cleanText(item.phone),
    email: cleanText(item.email),
    salary: cleanText(item.salary),
    website: cleanText(item.website),
    startDate: cleanText(item.startDate),
    endDate: item.isCurrent ? "" : cleanText(item.endDate),
    isCurrent: Boolean(item.isCurrent),
    experienceYear: cleanText(item.experienceYear),
  }));
}

function cleanUser(user: any, experiences: any[] = [], sessionEmail?: string | null) {
  const {
    id,
    contactPhone,
    contactEmail,
    contactAddress,
    contactCompany,
    contactPosition,
    socialFacebook,
    socialTelegram,
    socialInstagram,
    socialYoutube,
    socialLinkedin,
    socialGithub,
    socialTiktok,
    socialViber,
    socialLine,
    socialX,
    socialTwitter,
    socialWhatsapp,
    socialWebsite,
    ...rest
  } = user;

  const isOwnProfile =
    Boolean(sessionEmail) &&
    String(sessionEmail).toLowerCase() === String(user.email).toLowerCase();

  return {
    ...rest,
    _id: String(id),

    name: cleanText(user.name),
    email: cleanText(user.email),
    image: cleanText(user.image),
    bio: cleanText(user.bio),

    graduatedYear: user.graduatedYear ? String(user.graduatedYear) : "",

    degree: cleanDegree(user),
    department: cleanDegree(user),

    contactInfo: cleanContactInfo(user),
    experiences: cleanExperiences(experiences),
    socialLinks: cleanSocialLinks(user),

    isOwnProfile,
    isProfilePublic: true,
    profileVisibility: "public",
    languagePreference: user.languagePreference || "en",
    themePreference: user.themePreference || "light",
  };
}

// Dual Authentication Helper (Web Cookies or Mobile Headers)
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

    return NextResponse.json(cleanUser(user, experiences, currentUser.email), {
      status: 200,
    });
  } catch (error) {
    console.error("GET /api/users/me error:", error);

    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}
