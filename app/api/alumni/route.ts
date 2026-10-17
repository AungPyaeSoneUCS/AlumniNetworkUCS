// app/api/alumni/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseList } from "@/lib/db";

function serializeExperience(exp: any) {
  return {
    company: exp.company || "",
    position: exp.position || "",
    employmentType: exp.employmentType || "",
    location: exp.location || "",
    phone: exp.phone || "",
    email: exp.email || "",
    salary: exp.salary || "",
    website: exp.website || "",
    startDate: exp.startDate || "",
    endDate: exp.endDate || "",
    isCurrent: Boolean(exp.isCurrent),
    experienceYear: exp.experienceYear || "",
  };
}

function serializeUser(user: any, experiences: any[] = []) {
  return {
    _id: String(user.id),
    name: user.name || "",
    email: user.email || "",
    role: user.role || "user",
    position: user.position || "",
    isBlocked: Boolean(user.isBlocked),
    image: user.image || "",
    bio: user.bio || "",
    graduatedYear: user.graduatedYear || "",
    degree: user.degree || "",
    department: user.degree || "",
    isVerified: Boolean(user.isVerified),
    fatherName: user.fatherName || "",
    contactInfo: {
      phone: user.contactPhone || "",
      email: user.contactEmail || "",
      address: user.contactAddress || "",
      company: user.contactCompany || "",
      position: user.contactPosition || "",
    },
    socialLinks: {
      facebook: user.socialFacebook || "",
      telegram: user.socialTelegram || "",
      instagram: user.socialInstagram || "",
      youtube: user.socialYoutube || "",
      linkedin: user.socialLinkedin || "",
      github: user.socialGithub || "",
      tiktok: user.socialTiktok || "",
      viber: user.socialViber || "",
      line: user.socialLine || "",
      x: user.socialX || "",
      twitter: user.socialTwitter || "",
      whatsapp: user.socialWhatsapp || "",
      website: user.socialWebsite || "",
    },
    isProfilePublic: user.isProfilePublic !== false,
    profileVisibility: user.profileVisibility || "public",
    languagePreference: user.languagePreference || "en",
    themePreference: user.themePreference || "light",
    experiences,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
  };
}

function serializePost(post: any) {
  const { id, ...rest } = post;
  return {
    ...rest,
    _id: String(id),
    images: parseList(post.images),
    likes: [],
    comments: [],
  };
}

function serializeJob(job: any) {
  const { id, ...rest } = job;
  return {
    ...rest,
    _id: String(id),
  };
}

// ==========================================
// 1. GET: Fetch Alumni List or Single Alumni
// ==========================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search")?.trim() || "";
    const degree = searchParams.get("degree")?.trim() || "";
    const graduatedYear = searchParams.get("graduatedYear")?.trim() || "";
    const role = searchParams.get("role")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // --- CASE A: Fetch Single Alumni by ID with related activity ---
    if (id) {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "Alumni profile not found" },
          { status: 404 }
        );
      }

      // Fetch user's recent posts and posted jobs in parallel
      const [experiences, recentPosts, recentJobs] = await Promise.all([
        prisma.experience
          .findMany({ where: { userId: id }, orderBy: { createdAt: "asc" } })
          .catch(() => []),
        prisma.post
          .findMany({ where: { author: id }, orderBy: { createdAt: "desc" }, take: 5 })
          .catch(() => []),
        prisma.job
          .findMany({ where: { postedBy: id }, orderBy: { createdAt: "desc" }, take: 5 })
          .catch(() => []),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...serializeUser(user, experiences.map(serializeExperience)),
            recentPosts: recentPosts.map(serializePost),
            recentJobs: recentJobs.map(serializeJob),
          },
        },
        { status: 200 }
      );
    }

    // --- CASE B: Fetch Filtered Alumni Directory ---
    const query: any = {
      isBlocked: false,
      isProfilePublic: true,
    };

    if (role) {
      query.role = role;
    }

    if (degree) {
      query.degree = degree;
    }

    if (graduatedYear) {
      query.graduatedYear = graduatedYear;
    }

    if (search) {
      const matchingExperiences = await prisma.experience.findMany({
        where: { company: { contains: search } },
        select: { userId: true },
        distinct: ["userId"],
      });
      const experienceUserIds = matchingExperiences.map((e) => e.userId);

      query.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { position: { contains: search } },
        { contactCompany: { contains: search } },
        { id: { in: experienceUserIds } },
      ];
    }

    const [total, alumniList] = await Promise.all([
      prisma.user.count({ where: query }),
      prisma.user.findMany({
        where: query,
        orderBy: [{ graduatedYear: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const alumniIds = alumniList.map((u) => u.id);
    const experienceRows = alumniIds.length
      ? await prisma.experience.findMany({
          where: { userId: { in: alumniIds } },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const experiencesByUser = experienceRows.reduce<Record<string, any[]>>((acc, exp) => {
      if (!acc[exp.userId]) acc[exp.userId] = [];
      acc[exp.userId].push(serializeExperience(exp));
      return acc;
    }, {});

    const data = alumniList.map((user) =>
      serializeUser(user, experiencesByUser[user.id] || [])
    );

    return NextResponse.json(
      {
        success: true,
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: skip + alumniList.length < total,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/alumni GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. PUT: Update Alumni Profile Info
// ==========================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent direct modification of sensitive authentication fields through this route
    delete updateData.password;
    delete updateData.role;
    delete updateData.isBlocked;

    const existing = await prisma.user.findUnique({ where: { id: userId } });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const data: any = {};

    if (updateData.name !== undefined) data.name = String(updateData.name || "");
    if (updateData.email !== undefined) data.email = String(updateData.email || "");
    if (updateData.image !== undefined) data.image = String(updateData.image || "");
    if (updateData.bio !== undefined) data.bio = String(updateData.bio || "");
    if (updateData.degree !== undefined) data.degree = String(updateData.degree || "");
    if (updateData.graduatedYear !== undefined)
      data.graduatedYear = String(updateData.graduatedYear || "");
    if (updateData.position !== undefined) data.position = String(updateData.position || "");
    if (updateData.fatherName !== undefined)
      data.fatherName = String(updateData.fatherName || "");

    if (updateData.contactInfo && typeof updateData.contactInfo === "object") {
      const c = updateData.contactInfo;
      if ("phone" in c) data.contactPhone = String(c.phone || "");
      if ("email" in c) data.contactEmail = String(c.email || "");
      if ("address" in c) data.contactAddress = String(c.address || "");
      if ("company" in c) data.contactCompany = String(c.company || "");
      if ("position" in c) data.contactPosition = String(c.position || "");
    }

    if (updateData.socialLinks && typeof updateData.socialLinks === "object") {
      const s = updateData.socialLinks;
      if ("facebook" in s) data.socialFacebook = String(s.facebook || "");
      if ("telegram" in s) data.socialTelegram = String(s.telegram || "");
      if ("instagram" in s) data.socialInstagram = String(s.instagram || "");
      if ("youtube" in s) data.socialYoutube = String(s.youtube || "");
      if ("linkedin" in s) data.socialLinkedin = String(s.linkedin || "");
      if ("github" in s) data.socialGithub = String(s.github || "");
      if ("tiktok" in s) data.socialTiktok = String(s.tiktok || "");
      if ("viber" in s) data.socialViber = String(s.viber || "");
      if ("line" in s) data.socialLine = String(s.line || "");
      if ("x" in s) data.socialX = String(s.x || "");
      if ("twitter" in s) data.socialTwitter = String(s.twitter || "");
      if ("whatsapp" in s) data.socialWhatsapp = String(s.whatsapp || "");
      if ("website" in s) data.socialWebsite = String(s.website || "");
    }

    const hasExperiences = Array.isArray(updateData.experiences);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    if (hasExperiences) {
      await prisma.experience.deleteMany({ where: { userId } });

      const experienceItems = (updateData.experiences as any[]).map((item) => ({
        userId,
        company: item?.company || "",
        position: item?.position || "",
        employmentType: item?.employmentType || "",
        location: item?.location || "",
        phone: item?.phone || "",
        email: item?.email || "",
        salary: item?.salary || "",
        website: item?.website || "",
        startDate: item?.startDate || "",
        endDate: item?.isCurrent ? "" : item?.endDate || "",
        isCurrent: Boolean(item?.isCurrent),
        experienceYear: item?.experienceYear || "",
      }));

      if (experienceItems.length > 0) {
        await prisma.experience.createMany({ data: experienceItems });
      }
    }

    const experiences = await prisma.experience.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: serializeUser(updatedUser, experiences.map(serializeExperience)),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/alumni PUT Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
