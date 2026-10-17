// app/api/posts/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { isValidId, getUsersByIds } from "@/lib/db";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const CommentSchema = z.object({
  content: z.string().trim().min(1, "Comment content cannot be empty").max(1000),
});

// 1. Updated cleanComment to accept and return isOwner
function cleanComment(comment: any, isOwner: boolean = false) {
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
  // 1. Check Mobile App Headers (x-user-id or Authorization)
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

export async function POST(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const user: any = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = CommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Comment is required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { author: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Add new comment
    await prisma.postComment.create({
      data: {
        postId: id,
        authorId: user.id,
        content: parsed.data.content,
      },
    });

    // Notify post author on comment (skip self-comment)
    if (String(post.author) !== String(user.id)) {
      try {
        const commenter = await prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true },
        });
        const commenterName = commenter?.name || "Someone";
        const truncatedComment =
          parsed.data.content.length > 80
            ? parsed.data.content.slice(0, 80) + "..."
            : parsed.data.content;

        const notification = await prisma.notification.create({
          data: {
            receiver: post.author,
            sender: user.id,
            type: "comment",
            title: "New Comment",
            body: `${commenterName} commented: ${truncatedComment}`,
            link: `/feeds?post=${id}`,
            read: false,
          },
        });

        await pusherServer.trigger(
          `notifications-${post.author}`,
          "new-notification",
          {
            _id: String(notification.id),
            title: notification.title,
            body: notification.body,
            link: notification.link,
            read: false,
          }
        );
      } catch (notifyErr) {
        console.error("Comment notification error:", notifyErr);
      }
    }

    // Fetch the newly added comment
    const comments = await prisma.postComment.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
    });
    const newCommentRow = comments[comments.length - 1];
    if (!newCommentRow) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
    const usersMap = await getUsersByIds([newCommentRow.authorId]);
    const cAuthor = usersMap.get(newCommentRow.authorId) || {
      id: newCommentRow.authorId,
      name: "Unknown Alumni",
      image: "",
    };
    const newComment = {
      id: newCommentRow.id,
      _id: newCommentRow.id,
      content: newCommentRow.content,
      createdAt: newCommentRow.createdAt,
      updatedAt: newCommentRow.updatedAt,
      author: {
        _id: cAuthor.id,
        id: cAuthor.id,
        name: cAuthor.name,
        image: cAuthor.image,
        department: "",
        graduatedYear: null,
      },
    };

    // 2. Pass `true` to cleanComment because the user making this POST request is the owner
    return NextResponse.json(cleanComment(newComment, true), { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[id]/comments error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}