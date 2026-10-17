// file: app/api/admin/posts/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseList, serializeList, getUsersByIds, isValidId } from "@/lib/db";

function cleanAuthor(author: any) {
  return {
    _id: String(author?._id || author?.id || ""),
    name: author?.name || "Unknown Alumni",
    email: author?.email || "",
    image: author?.image || "",
    department: author?.department || "",
    graduatedYear: author?.graduatedYear || null,
  };
}

function cleanPost(post: any, likesCount?: number, commentsCount?: number) {
  const comments = Array.isArray(post?.comments) ? post.comments : [];
  const likes = Array.isArray(post?.likes) ? post.likes : [];

  return {
    _id: String(post?._id || post?.id || ""),
    content: post?.content || "",
    category: post?.category || "General",
    image: post?.image || "",
    likesCount: likesCount ?? (likes.length ?? 0),
    commentsCount: commentsCount ?? (comments.length || post?.commentsCount || 0),
    isEdited: Boolean(post?.isEdited),
    createdAt: post?.createdAt || null,
    updatedAt: post?.updatedAt || null,
    author: cleanAuthor(post?.author),
  };
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      admin: null,
    };
  }

  const admin = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, isBlocked: true },
  });

  if (!admin) {
    return {
      error: NextResponse.json({ error: "Admin not found" }, { status: 404 }),
      admin: null,
    };
  }

  if (admin.isBlocked) {
    return {
      error: NextResponse.json(
        { error: "Your account is blocked" },
        { status: 403 }
      ),
      admin: null,
    };
  }

  if (admin.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Admin access only" },
        { status: 403 }
      ),
      admin: null,
    };
  }

  return { error: null, admin };
}

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    const filter: Record<string, any> = {};

    if (category && category !== "all") {
      filter.category = category;
    }

    if (q) {
      filter.OR = [
        { content: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const posts = await prisma.post.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });

    const postIds = posts.map((p) => p.id);
    const authorIds = posts.map((p) => p.author);
    const usersMap = await getUsersByIds(authorIds);
    const [likeCounts, commentCounts] = await Promise.all([
      prisma.postLike.groupBy({
        by: ["postId"],
        where: { postId: { in: postIds } },
        _count: true,
      }),
      prisma.postComment.groupBy({
        by: ["postId"],
        where: { postId: { in: postIds } },
        _count: true,
      }),
    ]);
    const likeMap = Object.fromEntries(likeCounts.map((l) => [l.postId, l._count]));
    const commentMap = Object.fromEntries(commentCounts.map((c) => [c.postId, c._count]));

    const result = posts.map((post) => {
      const author = usersMap.get(post.author) || {
        id: post.author,
        name: "Unknown Alumni",
        email: "",
        image: "",
      };
      const enriched = {
        id: post.id,
        _id: post.id,
        content: post.content,
        category: post.category,
        image: post.image,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        isEdited: post.isEdited,
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
      return cleanPost(enriched, likeMap[post.id], commentMap[post.id]);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/admin/posts error:", error);

    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId")?.trim() || "";

    if (!postId || !isValidId(postId)) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({
      success: true,
      deletedId: postId,
    });
  } catch (error) {
    console.error("DELETE /api/admin/posts error:", error);

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}