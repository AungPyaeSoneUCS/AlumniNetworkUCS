import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

async function verifyAdminAccess() {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    !session.user ||
    (session.user as any).role !== "ADMIN" ||
    !(session.user as any).isVoteSystem
  ) {
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    if (!(await verifyAdminAccess())) {
      return NextResponse.json(
        { error: "Unauthorized: Only Admins can perform system resets." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { mode } = body;

    if (!mode || (mode !== "votes" && mode !== "factory")) {
      return NextResponse.json({ error: "Invalid reset mode provided." }, { status: 400 });
    }

    if (mode === "votes") {
      await prisma.voteUser.updateMany({
        where: { role: "VOTER" },
        data: { hasVoted: false, votedProjectId: null },
      });

      await prisma.voteProject.updateMany({
        data: { voteCount: 0 },
      });

      return NextResponse.json(
        { message: "All votes have been successfully reset to zero." },
        { status: 200 }
      );
    } else if (mode === "factory") {
      await prisma.voteUser.deleteMany({ where: { role: { not: "ADMIN" } } });
      await prisma.voteProject.deleteMany({});

      return NextResponse.json(
        { message: "Factory Reset complete. All non-admin data has been wiped." },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("System Reset Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error occurred during reset." },
      { status: 500 }
    );
  }
}