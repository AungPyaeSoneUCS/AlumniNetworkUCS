// file: app/api/admin/posts/route.ts

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Post from "@/models/Post";

function cleanAuthor(author: any) {
  return {
    _id: String(author?._id || ""),
    name: author?.name || "Unknown Alumni",
    email: author?.email || "",
    image: author?.image || "",
    department: author?.department || "",
    graduatedYear: author?.graduatedYear || null,
  };
}

function cleanPost(post: any) {
  const comments = Array.isArray(post?.comments) ? post.comments : [];

  return {
    _id: String(post?._id || ""),
    content: post?.content || "",
    category: post?.category || "General",
    image: post?.image || "",
    likesCount: Array.isArray(post?.likes) ? post.likes.length : 0,
    commentsCount: comments.length || post?.commentsCount || 0,
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

  await connectDB();

  const admin: any = await User.findOne({
    email: session.user.email,
  })
    .select("_id role isBlocked")
    .lean();

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
      filter.$or = [
        { content: { $regex: q, $options: "i" } },
        { category: { $regex: q, $options: "i" } },
      ];
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate("author", "name email image department graduatedYear")
      .lean();

    return NextResponse.json(posts.map(cleanPost));
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

    if (!postId) {
      return NextResponse.json({ error: "Missing postId" }, { status: 400 });
    }

    const post = await Post.findById(postId).select("_id");

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await Post.findByIdAndDelete(postId);

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