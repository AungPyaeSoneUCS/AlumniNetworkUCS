// file: app/api/vote/cast/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !session.user ||
      (session.user as any).role !== "VOTER" ||
      !(session.user as any).isVoteSystem
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Only registered Voters can cast a vote." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId || !isValidId(projectId)) {
      return NextResponse.json(
        { error: "Invalid or missing Project ID." },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    const projectExists = await prisma.voteProject.findUnique({
      where: { id: projectId },
    });
    if (!projectExists) {
      return NextResponse.json(
        { error: "The project you are trying to vote for does not exist." },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.voteUser.updateMany({
      where: { id: userId, hasVoted: false },
      data: { hasVoted: true, votedProjectId: projectId },
    });

    if (updatedUser.count === 0) {
      return NextResponse.json(
        { error: "You have already cast your vote." },
        { status: 403 }
      );
    }

    await prisma.voteProject.update({
      where: { id: projectId },
      data: { voteCount: { increment: 1 } },
    });

    return NextResponse.json(
      { message: "Your vote has been successfully cast!" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Voting failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
