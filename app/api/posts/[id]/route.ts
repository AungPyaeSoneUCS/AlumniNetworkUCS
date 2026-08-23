// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

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
    _id: String(comment?._id || ""),
    content: comment?.content || "",
    createdAt: comment?.createdAt || null,
    updatedAt: comment?.updatedAt || null,

    author: {
      _id: String(author._id || ""),
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

  const images = Array.isArray(post?.images)
    ? post.images.filter(Boolean)
    : post?.image
      ? [post.image]
      : [];

  return {
    _id: String(post?._id || ""),
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
      _id: String(author._id || ""),
      name: author.name || "Unknown Alumni",
      email: author.email || "",
      image: author.image || "",
      department: author.department || "",
      graduatedYear: author.graduatedYear || null,
    },

    isOwner: currentUserId
      ? String(author._id || "") === String(currentUserId)
      : false,
  };
}

// Dual Authentication Helper (Web Cookies or Mobile Headers)
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers (x-user-id or Authorization)
  const mobileHeaderId =
    req.headers.get("x-user-id") ||
    req.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (mobileHeaderId && mongoose.Types.ObjectId.isValid(mobileHeaderId)) {
    const user = await User.findById(mobileHeaderId).select("_id email role").lean();
    if (user) return user;
  }

  // 2. Check NextAuth Web Session
  try {
    const session = await auth();
    if (session?.user?.email) {
      const user = await User.findOne({ email: session.user.email })
        .select("_id email role")
        .lean();
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post: any = await Post.findById(id).select("author").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Ownership check (author or admin can edit)
    const isOwner = String(post.author) === String(currentUser._id);
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

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          content: parsed.data.content,
          category: parsed.data.category,
          image: images[0] || "",
          images,
          isEdited: true,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("author", "name email image department graduatedYear")
      .populate("comments.author", "name image department graduatedYear")
      .lean();

    return NextResponse.json(cleanPost(updatedPost, String(currentUser._id)), {
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post: any = await Post.findById(id).select("author").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Ownership check (author or admin can delete)
    const isOwner = String(post.author) === String(currentUser._id);
    const isAdmin = currentUser.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own post" },
        { status: 403 }
      );
    }

    await Post.findByIdAndDelete(id);

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