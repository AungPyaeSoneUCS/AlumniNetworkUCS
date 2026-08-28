// file: app/api/vote/cast/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import VoteUser from "@/models/VoteUser";
import VoteProject from "@/models/VoteProject";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    // 1. Authenticate and Authorize
    const session = await getServerSession(authOptions);

    // Ensure the user is logged in, part of the voting system, and is a VOTER
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

    // 2. Parse the request body
    const body = await req.json();
    const { projectId } = body;

    // Validate the projectId format
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid or missing Project ID." },
        { status: 400 }
      );
    }

    // 3. Connect to the database
    await connectDB();
    const userId = (session.user as any).id;

    // 4. Verify the target project actually exists before doing anything
    const projectExists = await VoteProject.findById(projectId);
    if (!projectExists) {
      return NextResponse.json(
        { error: "The project you are trying to vote for does not exist." },
        { status: 404 }
      );
    }

    // 5. ATOMIC UPDATE: Attempt to update the user ONLY if hasVoted is false
    // This strictly prevents double-voting race conditions.
    const updatedUser = await VoteUser.findOneAndUpdate(
      { _id: userId, hasVoted: false }, // The query condition
      { $set: { hasVoted: true, votedProjectId: projectId } }, // The update
      { new: true }
    );

    // If updatedUser is null, it means the query failed because hasVoted was already true
    if (!updatedUser) {
      return NextResponse.json(
        { error: "You have already cast your vote." },
        { status: 403 }
      );
    }

    // 6. Increment the Project's vote count
    // Since we locked the user above, it is now safe to add the vote
    await VoteProject.findByIdAndUpdate(
      projectId,
      { $inc: { voteCount: 1 } }
    );

    // 7. Return success
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
