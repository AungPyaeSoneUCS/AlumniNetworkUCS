// file: app/api/posts/[id]/comments/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const CommentSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

function cleanComment(comment: any) {
  const author = comment.author || {};

  return {
    _id: String(comment._id),
    content: comment.content || "",
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: {
      _id: String(author._id || ""),
      name: author.name || "Unknown Alumni",
      image: author.image || "",
      department: author.department || "",
      graduatedYear: author.graduatedYear || null,
    },
  };
}

export async function POST(req: Request, { params }: Props) {
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

    const body = await req.json();
    const parsed = CommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Comment is required" },
        { status: 400 }
      );
    }

    const post: any = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    post.comments.push({
      author: user._id,
      content: parsed.data.content,
    });

    await post.save();

    const updatedPost: any = await Post.findById(id)
      .populate("comments.author", "name image department graduatedYear")
      .lean();

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];

    return NextResponse.json(cleanComment(newComment), { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}