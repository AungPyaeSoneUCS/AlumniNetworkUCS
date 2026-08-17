// file: app/api/preferences/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";

const PreferenceSchema = z.object({
  languagePreference: z.enum(["en", "mm"]).optional(),
  themePreference: z.enum(["light", "dark"]).optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          languagePreference: "en",
          themePreference: "light",
        },
        { status: 200 }
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: session.user.email,
    }).select("languagePreference themePreference");

    return NextResponse.json(
      {
        languagePreference:
          user?.languagePreference === "mm" ? "mm" : "en",

        themePreference:
          user?.themePreference === "dark" ? "dark" : "light",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Preferences GET Error:", error);

    return NextResponse.json(
      {
        languagePreference: "en",
        themePreference: "light",
      },
      { status: 200 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const parsed = PreferenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Invalid preference data",
        },
        {
          status: 400,
        }
      );
    }

    const languagePreference =
      parsed.data.languagePreference === "mm"
        ? "mm"
        : "en";

    const themePreference =
      parsed.data.themePreference === "dark"
        ? "dark"
        : "light";

    await connectDB();

    const updatedUser = await User.findOneAndUpdate(
      {
        email: session.user.email,
      },
      {
        $set: {
          languagePreference,
          themePreference,
        },
      },
      {
        new: true,
      }
    ).select("languagePreference themePreference");

    if (!updatedUser) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        languagePreference:
          updatedUser.languagePreference === "mm"
            ? "mm"
            : "en",

        themePreference:
          updatedUser.themePreference === "dark"
            ? "dark"
            : "light",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Preferences PUT Error:", error);

    return NextResponse.json(
      {
        error: "Failed to update preferences",
      },
      {
        status: 500,
      }
    );
  }
}