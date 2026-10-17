// file: app/api/posts/[id]/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidId, getUsersByIds } from "@/lib/db";

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
    _id: String(comment?._id || comment?.id || ""),
    content: comment?.content || "",
    createdAt: comment?.createdAt || null,
    updatedAt: comment?.updatedAt || null,
    isOwner: isOwner,
    author: {
      _id: String(author._id || author.id || ""),
      name: author.name || "Unknown Alumni",
      image: author.image || "",
      department: author.department || "",
      graduatedYear: author.graduatedYear || null,
    },
  };
}

// Dual Authentication Helper (Web Cookies or Mobile Headers)
async function getAuthenticatedUser(req: Request) {
  // 1. Check Mobile App Headers
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && isValidId(mobileHeaderId)) {
    const user = await prisma.user.findUnique({
      where: { id: mobileHeaderId },
      select: { id: true, email: true },
    });
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
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
      !isValidId(id) ||
      !isValidId(commentId)
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

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.postId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify Ownership - only the comment author can edit it
    if (String(comment.authorId) !== String(user.id)) {
      return NextResponse.json(
        { error: "Forbidden: You can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedCommentRow = await prisma.postComment.update({
      where: { id: commentId },
      data: { content: parsed.data.content },
    });

    const usersMap = await getUsersByIds([updatedCommentRow.authorId]);
    const cAuthor = usersMap.get(updatedCommentRow.authorId) || {
      id: updatedCommentRow.authorId,
      name: "Unknown Alumni",
      image: "",
    };
    const updatedComment = {
      id: updatedCommentRow.id,
      _id: updatedCommentRow.id,
      content: updatedCommentRow.content,
      createdAt: updatedCommentRow.createdAt,
      updatedAt: updatedCommentRow.updatedAt,
      author: {
        _id: cAuthor.id,
        id: cAuthor.id,
        name: cAuthor.name,
        image: cAuthor.image,
        department: "",
        graduatedYear: null,
      },
    };

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
      !isValidId(id) ||
      !isValidId(commentId)
    ) {
      return NextResponse.json({ error: "Invalid ID parameters" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { author: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });
    if (!comment || comment.postId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Verify Ownership (Allow post owner OR comment owner to delete)
    const isCommentAuthor = String(comment.authorId) === String(user.id);
    const isPostAuthor = String(post.author) === String(user.id);

    if (!isCommentAuthor && !isPostAuthor) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Remove the comment
    await prisma.postComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true, message: "Comment deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/posts/[id]/comments/[commentId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}