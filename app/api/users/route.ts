// app/api/users/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";

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
    
    graduatedYear: user.graduatedYear ? String(user.graduatedYear) : "",

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

// Dual Authentication Helper (Web Cookies or Mobile Headers)
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers (x-user-id or Authorization)
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && mongoose.Types.ObjectId.isValid(mobileHeaderId)) {
    const user = await User.findById(mobileHeaderId).select("_id email").lean();
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id email")
        .lean();
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
      _id: { $ne: currentUser._id }, // Don't show the logged-in user in the directory
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

    if (year) {
      query.graduatedYear = year;
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

    return NextResponse.json(users.map(cleanUser), { status: 200 });
  } catch (error) {
    console.error("GET /api/users error:", error);

    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 }
    );
  }
}