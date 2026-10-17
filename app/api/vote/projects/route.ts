// file: app/api/vote/projects/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId, parseList, serializeList } from "@/lib/db";

export async function GET() {
  try {
    const projects = await prisma.voteProject.findMany({
      orderBy: { createdAt: "desc" },
    });

    const teamIds = projects.map((p) => p.teamId);
    const uniqueTeamIds = Array.from(new Set(teamIds)).filter(isValidId);
    const teams = await prisma.voteUser.findMany({
      where: { id: { in: uniqueTeamIds } },
      select: { id: true, name: true },
    });
    const teamMap = new Map(teams.map((t) => [t.id, t]));

    const shaped = projects.map((p) => ({
      _id: p.id,
      id: p.id,
      title: p.title,
      description: p.description,
      languagesAndTools: parseList<string>(p.languagesAndTools),
      photos: parseList<string>(p.photos),
      voteCount: p.voteCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      teamId: teamMap.get(p.teamId)
        ? { _id: teamMap.get(p.teamId)!.id, name: teamMap.get(p.teamId)!.name }
        : p.teamId,
    }));

    return NextResponse.json(shaped, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      !session.user ||
      (session.user as any).role !== "TEAM" ||
      !(session.user as any).isVoteSystem
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Only Team accounts can submit projects." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, languagesAndTools, photos } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Project title and description are required." },
        { status: 400 }
      );
    }

    if (languagesAndTools && !Array.isArray(languagesAndTools)) {
      return NextResponse.json(
        { error: "languagesAndTools must be an array of strings." },
        { status: 400 }
      );
    }

    if (photos && !Array.isArray(photos)) {
      return NextResponse.json(
        { error: "photos must be an array of strings (URLs)." },
        { status: 400 }
      );
    }

    const teamId = (session.user as any).id;

    const existingProject = await prisma.voteProject.findFirst({
      where: { teamId },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          error:
            "Your team has already submitted a project. Please use the update function.",
        },
        { status: 409 }
      );
    }

    const newProject = await prisma.voteProject.create({
      data: {
        teamId,
        title: title.trim(),
        description: description.trim(),
        languagesAndTools: serializeList(languagesAndTools),
        photos: serializeList(photos),
        voteCount: 0,
      },
    });

    const shaped = {
      ...newProject,
      _id: newProject.id,
      languagesAndTools: parseList<string>(newProject.languagesAndTools),
      photos: parseList<string>(newProject.photos),
    };

    return NextResponse.json(
      { message: "Project submitted successfully!", project: shaped },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to submit VoteProject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).isVoteSystem) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== "TEAM" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized role for this action." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, title, description, languagesAndTools, photos } = body;

    let where: any = {};
    if (userRole === "ADMIN") {
      if (!id) {
        return NextResponse.json(
          { error: "Project ID is required for Admin updates." },
          { status: 400 }
        );
      }
      where = { id };
    } else if (userRole === "TEAM") {
      where = { teamId: userId };
    }

    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (languagesAndTools !== undefined)
      updateData.languagesAndTools = serializeList(languagesAndTools);
    if (photos !== undefined) updateData.photos = serializeList(photos);

    const updatedProject = await prisma.voteProject.updateMany({
      where,
      data: updateData,
    });

    if (updatedProject.count === 0) {
      return NextResponse.json(
        { error: "Project not found or you do not have permission to edit it." },
        { status: 404 }
      );
    }

    const project = await prisma.voteProject.findFirst({ where });

    return NextResponse.json(
      {
        message: "Project updated successfully!",
        project: project
          ? {
              ...project,
              _id: project.id,
              languagesAndTools: parseList<string>(project.languagesAndTools),
              photos: parseList<string>(project.photos),
            }
          : project,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update VoteProject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).isVoteSystem) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== "TEAM" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized role for this action." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("id");

    let deletedProject;

    if (userRole === "ADMIN") {
      if (!projectId) {
        return NextResponse.json(
          { error: "Project ID is required for Admin to delete." },
          { status: 400 }
        );
      }
      deletedProject = await prisma.voteProject.deleteMany({
        where: { id: projectId },
      });
    } else if (userRole === "TEAM") {
      deletedProject = await prisma.voteProject.deleteMany({
        where: { teamId: userId },
      });
    }

    if (!deletedProject || deletedProject.count === 0) {
      return NextResponse.json(
        { error: "Project not found or already deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Project deleted successfully." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to delete VoteProject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}