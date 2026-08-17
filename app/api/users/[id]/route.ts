// file: app/api/users/[id]/route.ts

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

function cleanContactInfo(contactInfo: any = {}) {
  return {
    phone: cleanText(contactInfo.phone),
    email: cleanText(contactInfo.email),
    address: cleanText(contactInfo.address),
    company: cleanText(contactInfo.company),
    position: cleanText(contactInfo.position),
  };
}

function cleanSocialLinks(socialLinks: any = {}) {
  const xValue = cleanText(socialLinks.x || socialLinks.twitter);

  return {
    facebook: cleanText(socialLinks.facebook),
    telegram: cleanText(socialLinks.telegram),
    instagram: cleanText(socialLinks.instagram),
    youtube: cleanText(socialLinks.youtube),
    linkedin: cleanText(socialLinks.linkedin),
    github: cleanText(socialLinks.github),
    tiktok: cleanText(socialLinks.tiktok),
    viber: cleanText(socialLinks.viber),
    line: cleanText(socialLinks.line),
    x: xValue,
    twitter: xValue,
    whatsapp: cleanText(socialLinks.whatsapp),
    website: cleanText(socialLinks.website),
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

function cleanUser(user: any, sessionEmail?: string | null) {
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

  const isOwnProfile =
    Boolean(sessionEmail) &&
    String(sessionEmail).toLowerCase() === String(user.email).toLowerCase();

  return {
    ...safeUser,
    _id: String(user._id),

    name: cleanText(user.name),
    email: cleanText(user.email),
    image: cleanText(user.image),
    bio: cleanText(user.bio),
    graduatedYear: user.graduatedYear || null,

    degree: cleanDegree(user),

    contactInfo: cleanContactInfo(user.contactInfo),
    experiences: cleanExperiences(user.experiences),
    socialLinks: cleanSocialLinks(user.socialLinks),

    isOwnProfile,
    isProfilePublic: true,
    profileVisibility: "public",
    languagePreference: user.languagePreference || "en",
    themePreference: user.themePreference || "light",
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = await auth();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const user = await User.findById(id)
      .select(
        "-password -batch -personalContact -professionalContact -skills -projects"
      )
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(cleanUser(user, session?.user?.email));
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}