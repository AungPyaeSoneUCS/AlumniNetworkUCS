// file: app/api/me/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";
import { exec } from "child_process";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

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

function cleanProfileResponse(userObject: any) {
  const {
    password,
    batch,
    department,
    personalContact,
    professionalContact,
    skills,
    projects,
    ...safeUser
  } = userObject;

  return {
    ...safeUser,
    _id: String(userObject._id),
    name: userObject.name || "",
    email: userObject.email || "",
    image: userObject.image || "",
    bio: userObject.bio || "",
    graduatedYear: userObject.graduatedYear ? String(userObject.graduatedYear) : "",
    degree: cleanDegree(userObject),
    contactInfo: cleanContactInfo(userObject.contactInfo),
    experiences: Array.isArray(userObject.experiences)
      ? cleanExperiences(userObject.experiences)
      : [],
    socialLinks: cleanSocialLinks(userObject.socialLinks),
    isProfilePublic: true,
    profileVisibility: "public",
    languagePreference: userObject.languagePreference || "en",
    themePreference: userObject.themePreference || "light",
  };
}

// ----------------------------------------------------
// DUAL AUTHENTICATION HELPER (Web Cookies or Mobile Headers)
// ----------------------------------------------------
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

// ==========================================
// 1. GET: Fetch Logged-in User Profile
// ==========================================
export async function GET(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(currentUser._id)
      .select("-password")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(cleanProfileResponse(user), { status: 200 });
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
      updateData.contactInfo = cleanContactInfo(data.contactInfo);
    }

    if (data.experiences !== undefined) {
      updateData.experiences = cleanExperiences(data.experiences);
    }

    if (data.socialLinks !== undefined) {
      updateData.socialLinks = cleanSocialLinks(data.socialLinks);
    }

    if (data.languagePreference !== undefined) {
      updateData.languagePreference = data.languagePreference;
    }

    if (data.themePreference !== undefined) {
      updateData.themePreference = data.themePreference;
    }

    updateData.isProfilePublic = true;
    updateData.profileVisibility = "public";

    const unsetData: Record<string, string> = {
      department: "",
      batch: "",
      personalContact: "",
      professionalContact: "",
      skills: "",
      projects: "",
    };

    if (data.contactInfo === undefined) {
      unsetData["contactInfo.telegram"] = "";
      unsetData["contactInfo.viber"] = "";
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentUser._id,
      {
        $set: updateData,
        $unset: unsetData,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // --- PM2 RESTART LOGIC ---
    // Delay the restart by 1.5 seconds so the client successfully receives the 200 OK response first.
    setTimeout(() => {
      exec("pm2 restart next-app", (error, stdout, stderr) => {
        if (error) {
          console.error("Failed to restart PM2:", error);
          return;
        }
        console.log("PM2 Restart Triggered Successfully after profile update:", stdout);
      });
    }, 1500);

    return NextResponse.json(cleanProfileResponse(updatedUser), { status: 200 });
  } catch (error) {
    console.error("PUT /api/me error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}