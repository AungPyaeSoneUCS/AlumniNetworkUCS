// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { parseList, serializeList, isValidId, getUsersByIds } from "@/lib/db";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const UpdatePostSchema = z.object({
  content: z.string().trim().min(1, "Post content is required").max(3000),
  category: z
    .enum(["General", "Job", "Event", "News"])
    .default("General"),
  image: z.string().optional(),
  images: z.array(z.string()).max(3, "Maximum 3 photos allowed").optional(),
});

function cleanComment(comment: any) {
  const author = comment?.author || {};

  return {
    _id: String(comment?._id || comment?.id || ""),
    content: comment?.content || "",
    createdAt: comment?.createdAt || null,
    updatedAt: comment?.updatedAt || null,

    author: {
      _id: String(author._id || author.id || ""),
      name: author.name || "Unknown Alumni",
      image: author.image || "",
      department: author.department || "",
      graduatedYear: author.graduatedYear || null,
    },
  };
}

function cleanPost(post: any, currentUserId?: string) {
  const author = post?.author || {};
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const likes = Array.isArray(post?.likes) ? post.likes.map(String) : [];

  const imagesArr = Array.isArray(post?.images)
    ? post.images.filter(Boolean)
    : parseList(post?.images).filter(Boolean);
  const images = imagesArr.length > 0 ? imagesArr : post?.image ? [post.image] : [];

  return {
    _id: String(post?._id || post?.id || ""),
    content: post?.content || "",
    category: post?.category || "General",

    image: post?.image || images[0] || "",
    images,

    likes,
    likedByMe: currentUserId ? likes.includes(String(currentUserId)) : false,

    comments: comments.map(cleanComment),
    commentsCount: comments.length,

    isEdited: Boolean(post?.isEdited),
    createdAt: post?.createdAt || null,
    updatedAt: post?.updatedAt || null,

    author: {
      _id: String(author._id || author.id || ""),
      name: author.name || "Unknown Alumni",
      email: author.email || "",
      image: author.image || "",
      department: author.department || "",
      graduatedYear: author.graduatedYear || null,
    },

    isOwner: currentUserId
      ? String(author._id || author.id || "") === String(currentUserId)
      : false,
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
      select: { id: true, email: true, role: true },
    });
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true, role: true },
      });
      if (user) return user;
    }
  } catch (err) {
    // No active web session
  }

  return null;
}

// ==========================================
// 1. PUT: Update Post
// ==========================================
export async function PUT(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { author: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Ownership check (author or admin can edit)
    const isOwner = String(post.author) === String(currentUser.id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You can only edit your own post" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = UpdatePostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid post data",
          issues: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const images =
      parsed.data.images && parsed.data.images.length > 0
        ? parsed.data.images.slice(0, 3).filter(Boolean)
        : parsed.data.image
          ? [parsed.data.image]
          : [];

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: parsed.data.content,
        category: parsed.data.category,
        image: images[0] || "",
        images: serializeList(images),
        isEdited: true,
      },
    });

    const postIds = [updatedPost.id];
    const commentRows = await prisma.postComment.findMany({
      where: { postId: { in: postIds } },
      orderBy: { createdAt: "asc" },
    });
    const allUserIds = Array.from(
      new Set([updatedPost.author, ...commentRows.map((c) => c.authorId)])
    );
    const usersMap = await getUsersByIds(allUserIds);
    const likeRows = await prisma.postLike.findMany({
      where: { postId: { in: postIds } },
      select: { postId: true, userId: true },
    });
    const likesArr = likeRows.filter((r) => r.postId === updatedPost.id).map((r) => r.userId);
    const author = usersMap.get(updatedPost.author) || {
      id: updatedPost.author,
      name: "Unknown Alumni",
      email: "",
      image: "",
    };
    const comments = commentRows.map((comment) => {
      const cAuthor = usersMap.get(comment.authorId) || {
        id: comment.authorId,
        name: "Unknown Alumni",
        image: "",
      };
      return {
        id: comment.id,
        _id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          _id: cAuthor.id,
          id: cAuthor.id,
          name: cAuthor.name,
          image: cAuthor.image,
          department: "",
          graduatedYear: null,
        },
      };
    });
    const imagesArr = images;
    const populatedPost = {
      id: updatedPost.id,
      _id: updatedPost.id,
      content: updatedPost.content,
      category: updatedPost.category,
      image: updatedPost.image,
      images: imagesArr,
      likes: likesArr,
      comments,
      commentsCount: comments.length,
      isEdited: updatedPost.isEdited,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
      author: {
        _id: author.id,
        id: author.id,
        name: author.name,
        email: author.email,
        image: author.image,
        department: "",
        graduatedYear: null,
      },
    };

    return NextResponse.json(cleanPost(populatedPost, String(currentUser.id)), {
      status: 200,
    });
  } catch (error) {
    console.error("PUT /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// ==========================================
// 2. DELETE: Delete Post
// ==========================================
export async function DELETE(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { author: true, content: true, category: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Ownership check (author or admin can delete)
    const isOwner = String(post.author) === String(currentUser.id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own post" },
        { status: 403 }
      );
    }

    await prisma.post.delete({ where: { id } });

    // Notify the original author when an admin removes their post
    const authorId = String(post.author || "");
    if (isAdmin && !isOwner && authorId) {
      try {
        const category = post.category || "General";
        const notification = await prisma.notification.create({
          data: {
            receiver: authorId,
            sender: currentUser.id,
            type: "admin",
            title: "Post Removed",
            body: `An admin removed your ${category} post: "${(post.content || "").slice(0, 80)}"`,
            link: "/feeds",
            read: false,
          },
        });

        await pusherServer.trigger(
          `notifications-${authorId}`,
          "new-notification",
          {
            _id: String(notification.id),
            type: "admin",
            title: notification.title,
            body: notification.body,
            link: notification.link,
            read: false,
          }
        );
      } catch (notifyErr) {
        console.error("Admin-delete notification error:", notifyErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        deletedId: id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}