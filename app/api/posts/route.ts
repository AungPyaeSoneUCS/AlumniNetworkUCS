// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { pusherServer } from "@/lib/pusher";
import User from "@/models/User";
import Post from "@/models/Post";
import Notification from "@/models/Notification";

const PostSchema = z.object({
  content: z.string().trim().min(1, "Post content is required").max(3000),
  category: z
    .enum(["General", "Job", "Event", "News"])
    .default("General"),
  image: z.string().optional(),
  images: z.array(z.string()).max(3, "Maximum 3 photos allowed").optional(),
});

// 1. Updated cleanComment to accept currentUserId and calculate isOwner
function cleanComment(comment: any, currentUserId?: string) {
  const author = comment?.author || {};
  
  // Check if the currently logged-in user matches the comment's author
  const isCommentOwner = currentUserId
    ? String(author._id || author) === String(currentUserId)
    : false;

  return {
    _id: String(comment?._id || ""),
    content: comment?.content || "",
    createdAt: comment?.createdAt || null,
    updatedAt: comment?.updatedAt || null,
    isOwner: isCommentOwner, // <-- Added this field
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
    image: post?.image || images[0] || "",
    images,
    likes,
    likedByMe: currentUserId ? likes.includes(String(currentUserId)) : false,
    // FIX: Added ': any' to comment parameter to satisfy TypeScript
    comments: comments.map((comment: any) => cleanComment(comment, currentUserId)),
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

// Dual Authentication Helper (Web Session OR Mobile Header)
async function getAuthenticatedUser(req: Request) {
  await connectDB();

  // 1. Check Mobile App Headers (x-user-id or Authorization: Bearer <ID>)
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
    // No active web cookie session
  }

  return null;
}

// ==========================================
// 1. GET: Fetch Feed Posts
// ==========================================
export async function GET(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category")?.trim() || "";

    const filter: Record<string, any> = {};

    if (category && category !== "All") {
      filter.category =
        category === "News" ? { $in: ["News", "Announcement"] } : category;
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
      posts.map((post: any) => cleanPost(post, String(currentUser._id))),
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Create New Post
// ==========================================
export async function POST(req: Request) {
  try {
    const currentUser: any = await getAuthenticatedUser(req);

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      image: images[0] || "",
      images,
      likes: [],
      comments: [],
      isEdited: false,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name email image department graduatedYear")
      .populate("comments.author", "name image department graduatedYear")
      .lean();

    // Notify all users except the author
    try {
      const authorName = currentUser.name || "Someone";
      const category = parsed.data.category || "General";
      const truncatedContent =
        parsed.data.content.length > 80
          ? parsed.data.content.slice(0, 80) + "..."
          : parsed.data.content;

      const allUsers = await User.find({ _id: { $ne: currentUser._id } })
        .select("_id")
        .lean();

      if (allUsers.length > 0) {
        const notificationDocs = allUsers.map((u: any) => ({
          receiver: u._id,
          sender: currentUser._id,
          type: "post" as const,
          title: `New ${category} Post`,
          body: `${authorName} posted: ${truncatedContent}`,
          link: `/feeds?post=${post._id}`,
          read: false,
        }));

        const created = await Notification.insertMany(notificationDocs);

        // Send real-time via Pusher to each user
        await Promise.allSettled(
          created.map((n: any) =>
            pusherServer.trigger(`notifications-${n.receiver}`, "new-notification", {
              _id: String(n._id),
              type: "post",
              title: n.title,
              body: n.body,
              link: n.link,
              read: false,
            })
          )
        );
      }
    } catch (notifyErr) {
      console.error("Post notification error:", notifyErr);
    }

    return NextResponse.json(
      cleanPost(populatedPost, String(currentUser._id)),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}