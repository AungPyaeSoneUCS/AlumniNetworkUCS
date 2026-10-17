// file: app/api/preferences/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { languagePreference: true, themePreference: true },
    });

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

    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        languagePreference,
        themePreference,
      },
      select: { languagePreference: true, themePreference: true },
    });

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
