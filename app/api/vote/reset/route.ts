import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth"; // Adjust path if your auth.ts is located elsewhere
import { connectDB } from "@/lib/mongodb";
import VoteUser from "@/models/VoteUser";
import VoteProject from "@/models/VoteProject";

// Reusable Admin Verification
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
    // 1. Verify Authorization
    if (!(await verifyAdminAccess())) {
      return NextResponse.json(
        { error: "Unauthorized: Only Admins can perform system resets." },
        { status: 403 }
      );
    }

    // 2. Parse Request
    const body = await req.json();
    const { mode } = body; // Expects "votes" or "factory"

    if (!mode || (mode !== "votes" && mode !== "factory")) {
      return NextResponse.json({ error: "Invalid reset mode provided." }, { status: 400 });
    }

    // 3. Connect DB
    await connectDB();

    if (mode === "votes") {
      // ----------------------------------------------------
      // MODE 1: RESET VOTES ONLY
      // Keeps users/teams/projects. Zeros out the vote counts.
      // ----------------------------------------------------
      
      // A. Reset all Voter accounts so they can vote again
      await VoteUser.updateMany(
        { role: "VOTER" }, 
        { 
          $set: { hasVoted: false }, 
          $unset: { votedProjectId: "" } // Removes the votedProjectId field
        }
      );

      // B. Reset all Project vote counts to 0
      await VoteProject.updateMany(
        {}, 
        { $set: { voteCount: 0 } }
      );

      return NextResponse.json(
        { message: "All votes have been successfully reset to zero." },
        { status: 200 }
      );

    } else if (mode === "factory") {
      // ----------------------------------------------------
      // MODE 2: FULL FACTORY RESET
      // Destroys ALL data except ADMIN accounts
      // ----------------------------------------------------

      // A. Delete all Users that are NOT Admins (Deletes Voters, Teams, and Guests)
      await VoteUser.deleteMany({ role: { $ne: "ADMIN" } });

      // B. Delete all Projects
      await VoteProject.deleteMany({});

      // Note: If you have a separate Settings schema/model, you could also clear it here.
      // e.g., await VoteSettings.deleteMany({});

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