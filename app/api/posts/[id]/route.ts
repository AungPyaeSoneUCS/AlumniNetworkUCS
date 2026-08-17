// file: app/api/posts/[id]/route.ts

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

const UpdatePostSchema = z.object({
  content: z.string().trim().min(1, "Post content is required").max(3000),
  category: z
    .enum(["General", "Job", "Event", "Announcement", "Question"])
    .default("General"),

  // old single image support
  image: z.string().optional(),

  // new 1 to 3 photos support
  images: z.array(z.string()).max(3, "Maximum 3 photos allowed").optional(),
});

function cleanComment(comment: any) {
  const author = comment.author || {};

  return {
    _id: String(comment._id || ""),
    content: comment.content || "",
    createdAt: comment.createdAt || null,
    updatedAt: comment.updatedAt || null,

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

export async function PUT(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser: any = await User.findOne({
      email: session.user.email,
    })
      .select("_id")
      .lean();

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post: any = await Post.findById(id).select("author").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (String(post.author) !== String(currentUser._id)) {
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
        ? parsed.data.images.slice(0, 3)
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

    return NextResponse.json(cleanPost(updatedPost, String(currentUser._id)));
  } catch (error) {
    console.error("PUT /api/posts/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser: any = await User.findOne({
      email: session.user.email,
    })
      .select("_id")
      .lean();

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post: any = await Post.findById(id).select("author").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (String(post.author) !== String(currentUser._id)) {
      return NextResponse.json(
        { error: "You can only delete your own post" },
        { status: 403 }
      );
    }

    await Post.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}