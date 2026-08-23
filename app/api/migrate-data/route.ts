// file: app/api/migrate-data/route.ts

import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { auth } from "@/auth";
import User from "@/models/User";

// Make sure your MongoDB URI is correctly loaded from your .env file
const MONGODB_URI = process.env.MONGODB_URI || "";

export async function GET(req: Request) {
  try {
    // --- 1. DUAL AUTHENTICATION (WEB & MOBILE) ---
    const session = await auth();
    const mobileUserId = req.headers.get("x-user-id") || req.headers.get("authorization")?.split(" ")[1];

    if (!session?.user?.email && !mobileUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to DB for the auth check and migration
    if (mongoose.connection.readyState !== 1) {
      if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables");
      }
      await mongoose.connect(MONGODB_URI);
    }

    // --- 2. ADMIN ROLE VERIFICATION ---
    let currentUser: any = null;
    
    if (mobileUserId && Types.ObjectId.isValid(mobileUserId)) {
      currentUser = await User.findById(mobileUserId).select("_id role");
    } else if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email }).select("_id role");
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Strictly restrict this route to Administrators
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Only administrators can run migrations" }, { status: 403 });
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error("Failed to get database instance");

    // --- 3. RUN MIGRATION ---
    // Convert 'graduatedYear' from Number to String in the Users collection
    await db.collection("users").updateMany(
      { graduatedYear: { $type: "number" } },
      [{ $set: { graduatedYear: { $toString: "$graduatedYear" } } }]
    );

    // Convert 'graduatedYear' from Number to String in ApprovedStudents collection
    await db.collection("approvedstudents").updateMany(
      { graduatedYear: { $type: "number" } },
      [{ $set: { graduatedYear: { $toString: "$graduatedYear" } } }]
    );

    // Copy approved students to the 'students' collection
    // This pipeline filters for approved users and merges them into 'students'
    await db.collection("approvedstudents").aggregate([
      { $match: { approved: true } },
      { 
        $project: {
          _id: 1, // Keep the original ObjectId
          name: 1,
          fatherName: 1,
          // Ensure it's passed as a string during the copy just in case
          graduatedYear: { $toString: "$graduatedYear" }, 
          registered: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { 
        // $merge inserts new documents or updates existing ones with matching _ids
        $merge: { 
          into: "students", 
          whenMatched: "merge", 
          whenNotMatched: "insert" 
        } 
      }
    ]).toArray(); // Execute the aggregation pipeline

    return NextResponse.json(
      { message: "Migration completed successfully! Data updated and copied." },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}