// file: app/api/users/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

function cleanText(value: any) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDegree(user: any) {
  return cleanText(user.degree || user.department);
}

function cleanUser(user: any) {
  const {
    password,
    batch,
    department,
    personalContact,
    professionalContact,
    skills,
    projects,
    ...safeUser
  } = user;

  return {
    ...safeUser,
    _id: String(user._id),

    name: cleanText(user.name),
    email: cleanText(user.email),
    image: cleanText(user.image),
    bio: cleanText(user.bio),
    graduatedYear: user.graduatedYear || null,

    degree: cleanDegree(user),

    contactInfo: {
      phone: cleanText(user.contactInfo?.phone),
      email: cleanText(user.contactInfo?.email),
      address: cleanText(user.contactInfo?.address),
      company: cleanText(user.contactInfo?.company),
      position: cleanText(user.contactInfo?.position),
    },

    experiences: Array.isArray(user.experiences)
      ? user.experiences.map((item: any) => ({
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
        }))
      : [],

    socialLinks: {
      facebook: cleanText(user.socialLinks?.facebook),
      telegram: cleanText(user.socialLinks?.telegram),
      instagram: cleanText(user.socialLinks?.instagram),
      youtube: cleanText(user.socialLinks?.youtube),
      linkedin: cleanText(user.socialLinks?.linkedin),
      github: cleanText(user.socialLinks?.github),
      tiktok: cleanText(user.socialLinks?.tiktok),
      viber: cleanText(user.socialLinks?.viber),
      line: cleanText(user.socialLinks?.line),
      x: cleanText(user.socialLinks?.x || user.socialLinks?.twitter),
      twitter: cleanText(user.socialLinks?.x || user.socialLinks?.twitter),
      whatsapp: cleanText(user.socialLinks?.whatsapp),
      website: cleanText(user.socialLinks?.website),
    },

    isProfilePublic: true,
    profileVisibility: "public",
  };
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email,
    }).select("_id");

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);

    const q = cleanText(searchParams.get("q"));
    const year = cleanText(searchParams.get("year"));
    const degree = cleanText(
      searchParams.get("degree") || searchParams.get("major")
    );

    const query: any = {
      _id: { $ne: currentUser._id },
      $or: [{ isProfilePublic: true }, { isProfilePublic: { $exists: false } }],
    };

    if (q) {
      query.$and = [
        {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { degree: { $regex: q, $options: "i" } },
            { department: { $regex: q, $options: "i" } },
          ],
        },
      ];
    }

    if (year && !Number.isNaN(Number(year))) {
      query.graduatedYear = Number(year);
    }

    if (degree) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [{ degree }, { department: degree }],
        },
      ];
    }

    const users = await User.find(query)
      .select(
        "-password -batch -personalContact -professionalContact -skills -projects"
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users.map(cleanUser));
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}