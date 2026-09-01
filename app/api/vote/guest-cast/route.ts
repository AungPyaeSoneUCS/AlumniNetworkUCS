// file app/api/vote/guest-cast/route.ts
// file: app/api/vote/guest-cast/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import VoteUser from "@/models/VoteUser";
import VoteProject from "@/models/VoteProject";

export async function POST(req: Request) {
  try {
    // 1. Parse the request body
    const body = await req.json();
    const { projectId } = body;

    // Validate the projectId format
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid or missing Project ID." },
        { status: 400 }
      );
    }

    // 2. Connect to the database
    await connectDB();

    // 3. Verify the target project actually exists
    const projectExists = await VoteProject.findById(projectId);
    if (!projectExists) {
      return NextResponse.json(
        { error: "The project you are trying to vote for does not exist." },
        { status: 404 }
      );
    }

    // 4. Generate the Guest User securely
    let guestCreated = false;
    let attempts = 0;
    let newGuestEmail = "";
    
    // Hash a dummy password for the guest account to satisfy schema requirements
    const dummyPassword = await bcrypt.hash("guest_no_password_random_hash", 10);

    // Loop to prevent collision if multiple guests vote at the exact same millisecond
    while (!guestCreated && attempts < 5) {
      try {
        // Count existing guests that match the pattern guest[number]@gmail.com
        const guestCount = await VoteUser.countDocuments({ 
          email: { $regex: /^guest\d+@gmail\.com$/ } 
        });

        // Generate the new email (add attempts to offset if a collision just happened)
        newGuestEmail = `guest${guestCount + 1 + attempts}@gmail.com`;

        // Attempt to create the user
        await VoteUser.create({
          name: "Anonymous Guest",
          email: newGuestEmail,
          password: dummyPassword,
          role: "VOTER",
          hasVoted: true,
          votedProjectId: projectId,
        });

        guestCreated = true; // Success! Break out of the loop.
      } catch (error: any) {
        // 11000 is the MongoDB error code for duplicate keys (e.g., email already exists)
        if (error.code === 11000) {
          attempts++;
        } else {
          // If it's a different error (e.g., validation), throw it to the outer catch block
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

    // 5. Increment the Project's vote count
    await VoteProject.findByIdAndUpdate(
      projectId,
      { $inc: { voteCount: 1 } }
    );

    // 6. Return success
    return NextResponse.json(
      { 
        message: "Your guest vote has been successfully cast!", 
        success: true 
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