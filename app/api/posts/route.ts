// file: app/api/posts/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";

const PostSchema = z.object({
  content: z.string().trim().min(1, "Post content is required").max(3000),
  category: z
    .enum(["General", "Job", "Event", "News"])
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

function normalizeCategory(category?: string) {
  if (category === "Announcement") return "News";
  if (category === "Question") return "General";
  return category || "General";
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
    category: normalizeCategory(post?.category),

    // old support
    image: post?.image || images[0] || "",

    // new support
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

export async function GET(req: Request) {
  try {
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

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    const filter: Record<string, any> = {};

    if (category && category !== "All") {
      filter.category = category === "News" ? { $in: ["News", "Announcement"] } : category;
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
      .populate("comments.author", "name image department graduatedYear")
      .lean();

    return NextResponse.json(
      posts.map((post: any) => cleanPost(post, String(currentUser._id)))
    );
  } catch (error) {
    console.error("GET /api/posts error:", error);

    return NextResponse.json(
      { error: "Failed to load posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
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

    const body = await req.json();
    const parsed = PostSchema.safeParse(body);

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

    const post = await Post.create({
      author: currentUser._id,
      content: parsed.data.content,
      category: parsed.data.category,

      // keep old image field for compatibility
      image: images[0] || "",

      // new multiple image field
      images,

      likes: [],
      comments: [],
      isEdited: false,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name email image department graduatedYear")
      .populate("comments.author", "name image department graduatedYear")
      .lean();

    return NextResponse.json(cleanPost(populatedPost, String(currentUser._id)), {
      status: 201,
    });
  } catch (error) {
    console.error("POST /api/posts error:", error);

    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}