// file: app/api/posts/[id]/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

type Props = {
  params: Promise<{
    id: string; // Changed from postId to match your folder structure
    commentId: string;
  }>;
};

const CommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content cannot be empty").max(1000),
});

function cleanComment(comment: any, isOwner: boolean = true) {
  const author = comment?.author || {};

  return {
    _id: String(comment?._id || ""),
    content: comment?.content || "",
    createdAt: comment?.createdAt || null,
    updatedAt: comment?.updatedAt || null,
    isOwner: isOwner,
    author: {
      _id: String(author._id || ""),
      name: author.name || "Unknown Alumni",
      image: author.image || "",
      department: author.department || "",
      graduatedYear: author.graduatedYear || null,
    },
  };
}

// Dual Authentication Helper (Web Cookies or Mobile Headers)
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers
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

// ==========================================
// PUT: Edit a comment
// ==========================================
export async function PUT(req: Request, { params }: Props) {
  try {
    const { id, commentId } = await params;
    const user: any = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json({ error: "Invalid ID parameters" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = CommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid comment format" },
        { status: 400 }
      );
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Find the comment inside the post's comments array
    const comment = post.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify Ownership - only the comment author can edit it
    if (String(comment.author) !== String(user._id)) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    comment.content = parsed.data.content;
    comment.updatedAt = new Date();
    await post.save();

    // Populate the author so the frontend gets the full object back
    const updatedPost: any = await Post.findById(id)
      .populate("comments.author", "name image department graduatedYear")
      .lean();

    const updatedComment = updatedPost.comments.find(
      (c: any) => String(c._id) === commentId
    );

    return NextResponse.json(cleanComment(updatedComment, true), { status: 200 });
  } catch (error) {
    console.error("PUT /api/posts/[id]/comments/[commentId] error:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

// ==========================================
// DELETE: Remove a comment
// ==========================================
export async function DELETE(req: Request, { params }: Props) {
  try {
    const { id, commentId } = await params;
    const user: any = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return NextResponse.json({ error: "Invalid ID parameters" }, { status: 400 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify Ownership (Allow post owner OR comment owner to delete)
    const isCommentAuthor = String(comment.author) === String(user._id);
    const isPostAuthor = String(post.author) === String(user._id);

    if (!isCommentAuthor && !isPostAuthor) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Remove the comment
    post.comments.pull(commentId);
    await post.save();

    return NextResponse.json({ success: true, message: "Comment deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/posts/[id]/comments/[commentId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}