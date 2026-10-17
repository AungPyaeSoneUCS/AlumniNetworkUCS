// app/api/auth/mobile-login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // or your hashing library
import { prisma } from "@/lib/prisma";

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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user and include password field
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        position: true,
        isBlocked: true,
        image: true,
        bio: true,
        graduatedYear: true,
        degree: true,
        isVerified: true,
        fatherName: true,
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
        socialX: true,
        socialTwitter: true,
        socialWhatsapp: true,
        socialWebsite: true,
        isProfilePublic: true,
        profileVisibility: true,
        languagePreference: true,
        themePreference: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, message: "Your account is temporarily suspended" },
        { status: 403 }
      );
    }

    // Verify password match
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Prepare safe user object (omit password)
    const experiences = await prisma.experience.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const userObject = serializeUser(user, experiences.map(serializeExperience));

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: userObject,
        // If you use JWT, you can also generate and return: token: generateToken(user._id)
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}