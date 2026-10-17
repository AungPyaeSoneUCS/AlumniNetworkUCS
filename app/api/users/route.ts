// app/api/users/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma, isValidId } from "@/lib/db";

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDegree(user: any) {
  return cleanText(user.degree || user.department);
}

function cleanExperiences(experiences: any[]) {
  return experiences.map((item: any) => ({
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

function cleanUser(user: any, experiences: any[] = []) {
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

    contactInfo: {
      phone: cleanText(user.contactPhone),
      email: cleanText(user.contactEmail),
      address: cleanText(user.contactAddress),
      company: cleanText(user.contactCompany),
      position: cleanText(user.contactPosition),
    },

    experiences: cleanExperiences(experiences),

    socialLinks: {
      facebook: cleanText(user.socialFacebook),
      telegram: cleanText(user.socialTelegram),
      instagram: cleanText(user.socialInstagram),
      youtube: cleanText(user.socialYoutube),
      linkedin: cleanText(user.socialLinkedin),
      github: cleanText(user.socialGithub),
      tiktok: cleanText(user.socialTiktok),
      viber: cleanText(user.socialViber),
      line: cleanText(user.socialLine),
      x: cleanText(user.socialX || user.socialTwitter),
      twitter: cleanText(user.socialX || user.socialTwitter),
      whatsapp: cleanText(user.socialWhatsapp),
      website: cleanText(user.socialWebsite),
    },

    isProfilePublic: true,
    profileVisibility: "public",
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

    const { searchParams } = new URL(req.url);

    const q = cleanText(searchParams.get("q"));
    const year = cleanText(searchParams.get("year"));
    const degree = cleanText(
      searchParams.get("degree") || searchParams.get("major")
    );

    const query: any = {
      id: { not: currentUser.id }, // Don't show the logged-in user in the directory
      isProfilePublic: true,
    };

    if (q) {
      query.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { degree: { contains: q } },
      ];
    }

    if (year) {
      query.graduatedYear = year;
    }

    if (degree) {
      query.degree = degree;
    }

    const users = await prisma.user.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
    });

    const userIds = users.map((u) => u.id);
    const experienceRows = userIds.length
      ? await prisma.experience.findMany({
          where: { userId: { in: userIds } },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const experiencesByUser = experienceRows.reduce<Record<string, any[]>>(
      (acc, exp) => {
        if (!acc[exp.userId]) acc[exp.userId] = [];
        acc[exp.userId].push(exp);
        return acc;
      },
      {}
    );

    return NextResponse.json(
      users.map((u) => cleanUser(u, experiencesByUser[u.id] || [])),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}
