// file: app/api/vote/projects/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Adjust path to your auth.ts if needed
import { connectDB } from "@/lib/mongodb";
import VoteProject from "@/models/VoteProject";

// =======================================================================
// GET: Fetches all submitted projects to display on the voting page
// (Publicly accessible so voters can see projects without being logged in)
// =======================================================================
export async function GET() {
  try {
    await connectDB();
    
    // Fetch all projects and populate the team's name from the VoteUser collection
    const projects = await VoteProject.find({})
      .populate("teamId", "name")
      .sort({ createdAt: -1 }); // Sort by newest first

    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// =======================================================================
// POST: Allows a TEAM to submit their project details (Create)
// =======================================================================
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
      return NextResponse.json({ error: "Project title and description are required." }, { status: 400 });
    }

    if (languagesAndTools && !Array.isArray(languagesAndTools)) {
      return NextResponse.json({ error: "languagesAndTools must be an array of strings." }, { status: 400 });
    }

    if (photos && !Array.isArray(photos)) {
      return NextResponse.json({ error: "photos must be an array of strings (URLs)." }, { status: 400 });
    }

    await connectDB();
    const teamId = (session.user as any).id;

    // Enforce One-Project-Per-Team Rule
    const existingProject = await VoteProject.findOne({ teamId });
    
    if (existingProject) {
      return NextResponse.json(
        { error: "Your team has already submitted a project. Please use the update function." },
        { status: 409 }
      );
    }

    const newProject = await VoteProject.create({
      teamId,
      title: title.trim(),
      description: description.trim(),
      languagesAndTools: languagesAndTools || [],
      photos: photos || [],
      voteCount: 0,
    });

    return NextResponse.json(
      { message: "Project submitted successfully!", project: newProject },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to submit VoteProject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// =======================================================================
// PUT: Allows a TEAM to update their own project, or an ADMIN to update any
// =======================================================================
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).isVoteSystem) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== "TEAM" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized role for this action." }, { status: 403 });
    }

    const body = await req.json();
    const { id, title, description, languagesAndTools, photos } = body;

    await connectDB();

    // Determine the query based on the user's role
    let query: any = {};
    if (userRole === "ADMIN") {
      if (!id) return NextResponse.json({ error: "Project ID is required for Admin updates." }, { status: 400 });
      query = { _id: id }; // Admin can target any project by ID
    } else if (userRole === "TEAM") {
      query = { teamId: userId }; // Team can only target their own project
    }

    // Build dynamic update object
    const updateData: any = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (languagesAndTools) updateData.languagesAndTools = languagesAndTools;
    if (photos) updateData.photos = photos;

    const updatedProject = await VoteProject.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found or you do not have permission to edit it." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Project updated successfully!", project: updatedProject },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to update VoteProject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// =======================================================================
// DELETE: Allows a TEAM to delete their own project, or an ADMIN to delete any
// =======================================================================
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).isVoteSystem) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 403 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== "TEAM" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized role for this action." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("id");

    await connectDB();

    let deletedProject;

    if (userRole === "ADMIN") {
      // Admin must provide the project ID they want to delete
      if (!projectId) {
        return NextResponse.json({ error: "Project ID is required for Admin to delete." }, { status: 400 });
      }
      deletedProject = await VoteProject.findByIdAndDelete(projectId);
    } else if (userRole === "TEAM") {
      // Teams delete their own project (ignores query ID for safety)
      deletedProject = await VoteProject.findOneAndDelete({ teamId: userId });
    }

    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found or already deleted." }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully." }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete VoteProject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}