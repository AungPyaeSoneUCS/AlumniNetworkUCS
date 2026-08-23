// app/api/posts/[id]/like/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

type Props = {
  params: Promise<{ id: string }>;
};

// Dual Authentication Helper (Web Cookies or Mobile Headers)
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers (x-user-id or Authorization)
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && mongoose.Types.ObjectId.isValid(mobileHeaderId)) {
    const user = await User.findById(mobileHeaderId).select("_id email").lean();
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id email")
        .lean();
      if (user) return user;
    }
  } catch (err) {
    // No active web session
  }

  return null;
}

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const user: any = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post: any = await Post.findById(id).select("likes");

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const liked = post.likes.some(
      (like: any) => String(like) === String(user._id)
    );

    if (liked) {
      post.likes.pull(user._id);
    } else {
      post.likes.push(user._id);
    }

    await post.save();

    return NextResponse.json(
      {
        liked: !liked,
        likes: post.likes.map(String),
        likesCount: post.likes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/posts/[id]/like error:", error);
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }
}