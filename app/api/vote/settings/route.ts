// file: app/api/vote/settings/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.setting.findFirst({
      where: { key: "voteWindow" },
    });
    if (!settings) {
      return NextResponse.json({ startDate: "", endDate: "" }, { status: 200 });
    }
    return NextResponse.json(
      { startDate: settings.startDate, endDate: settings.endDate },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ startDate: "", endDate: "" }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user as any)?.role !== "ADMIN" ||
      !(session.user as any)?.isVoteSystem
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { startDate, endDate } = await req.json();

    const updatedSettings = await prisma.setting.upsert({
      where: { key: "voteWindow" },
      update: { startDate: startDate ?? "", endDate: endDate ?? "" },
      create: {
        key: "voteWindow",
        value: "",
        startDate: startDate ?? "",
        endDate: endDate ?? "",
      },
    });

    return NextResponse.json(
      {
        message: "Settings saved successfully",
        settings: {
          startDate: updatedSettings.startDate,
          endDate: updatedSettings.endDate,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}