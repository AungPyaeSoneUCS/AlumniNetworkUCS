// file: app/api/vote/guest-cast/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId || !isValidId(projectId)) {
      return NextResponse.json(
        { error: "Invalid or missing Project ID." },
        { status: 400 }
      );
    }

    const projectExists = await prisma.voteProject.findUnique({
      where: { id: projectId },
    });
    if (!projectExists) {
      return NextResponse.json(
        { error: "The project you are trying to vote for does not exist." },
        { status: 404 }
      );
    }

    let guestCreated = false;
    let attempts = 0;
    const dummyPassword = await bcrypt.hash("guest_no_password_random_hash", 10);

    while (!guestCreated && attempts < 5) {
      try {
        const allGuests = await prisma.voteUser.findMany({
          where: { email: { contains: "guest", endsWith: "@gmail.com" } },
          select: { email: true },
        });

        const guestNumbers = allGuests
          .map((g) => {
            const match = g.email.match(/^guest(\d+)@gmail\.com$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter((n) => !isNaN(n));

        const nextNumber = guestNumbers.length > 0 ? Math.max(...guestNumbers) + 1 : 1;
        const emailCandidate = `guest${nextNumber + attempts}@gmail.com`;

        await prisma.voteUser.create({
          data: {
            name: "Anonymous Guest",
            email: emailCandidate,
            password: dummyPassword,
            role: "VOTER",
            hasVoted: true,
            votedProjectId: projectId,
          },
        });

        guestCreated = true;
      } catch (error: any) {
        if (error.code === "P2002") {
          attempts++;
        } else {
          throw error;
        }
      }
    }

    if (!guestCreated) {
      return NextResponse.json(
        { error: "Server is currently busy. Please try voting again." },
        { status: 503 }
      );
    }

    await prisma.voteProject.update({
      where: { id: projectId },
      data: { voteCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        message: "Your guest vote has been successfully cast!",
        success: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Guest voting failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}