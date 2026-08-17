// file: app/api/posts/[id]/like/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user: any = await User.findOne({ email: session.user.email })
      .select("_id")
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    return NextResponse.json({
      liked: !liked,
      likes: post.likes.map(String),
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("PATCH /api/posts/[id]/like error:", error);
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }
}