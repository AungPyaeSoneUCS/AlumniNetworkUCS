// file: app/api/notifications/[id]/route.ts

import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await connectDB();

    await Notification.findOneAndDelete({
      _id: id,
      receiver: (session.user as any).id,
    });

    return NextResponse.json({
      success: true,
      message: "Notification cleared only",
    });
  } catch (error) {
    console.error("Delete notification failed:", error);

    return NextResponse.json(
      { error: "Delete notification failed" },
      { status: 500 }
    );
  }
}