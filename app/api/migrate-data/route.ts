// file: app/api/migrate-data/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";

// Make sure your MongoDB URI is correctly loaded from your .env file
const MONGODB_URI = process.env.MONGODB_URI || "";

export async function GET() {
  try {
    // 1. Connect to the database if not already connected
    if (mongoose.connection.readyState !== 1) {
      if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables");
      }
      await mongoose.connect(MONGODB_URI);
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error("Failed to get database instance");

    // 2. Convert 'graduatedYear' from Number to String in the Users collection
    await db.collection("users").updateMany(
      { graduatedYear: { $type: "number" } },
      [{ $set: { graduatedYear: { $toString: "$graduatedYear" } } }]
    );

    // 3. Convert 'graduatedYear' from Number to String in ApprovedStudents collection
    await db.collection("approvedstudents").updateMany(
      { graduatedYear: { $type: "number" } },
      [{ $set: { graduatedYear: { $toString: "$graduatedYear" } } }]
    );

    // 4. Copy approved students to the 'students' collection
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