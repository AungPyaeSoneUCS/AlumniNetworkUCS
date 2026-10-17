// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { parseList, serializeList, isValidId, getUsersByIds } from "@/lib/db";

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

  const isCommentOwner = currentUserId
    ? String(author._id || author.id || author) === String(currentUserId)
    : false;

  return {
    _id: String(comment?._id || comment?.id || ""),
    content: comment?.content || "",
    createdAt: comment?.createdAt || null,
    updatedAt: comment?.updatedAt || null,
    isOwner: isCommentOwner,
    author: {
      _id: String(author._id || author.id || ""),
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
  const imagesRaw = post?.images;
  const imagesArr = Array.isArray(imagesRaw)
    ? imagesRaw.filter(Boolean)
    : parseList(imagesRaw).filter(Boolean);
  const images = imagesArr.length > 0 ? imagesArr : post?.image ? [post.image] : [];

  return {
    _id: String(post?._id || post?.id || ""),
    content: post?.content || "",
    category: normalizeCategory(post?.category),
    image: post?.image || images[0] || "",
    images,
    likes,
    likedByMe: currentUserId ? likes.includes(String(currentUserId)) : false,
    comments: comments.map((comment: any) => cleanComment(comment, currentUserId)),
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

// Dual Authentication Helper (Web Session OR Mobile Header)
async function getAuthenticatedUser(req: Request) {
  // 1. Check Mobile App Headers (x-user-id or Authorization: Bearer <ID>)
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
      if (category === "News") {
        filter.category = { in: ["News", "Announcement"] };
      } else {
        filter.category = category;
      }
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
    const commentRows = await prisma.postComment.findMany({
      where: { postId: { in: postIds } },
      orderBy: { createdAt: "asc" },
    });
    const commentAuthorIds = commentRows.map((c) => c.authorId);
    const allUserIds = Array.from(new Set([...authorIds, ...commentAuthorIds]));
    const usersMap = await getUsersByIds(allUserIds);
    const likeRows = await prisma.postLike.findMany({
      where: { postId: { in: postIds } },
      select: { postId: true, userId: true },
    });
    const likesByPost = likeRows.reduce<Record<string, string[]>>((acc, row) => {
      if (!acc[row.postId]) acc[row.postId] = [];
      acc[row.postId].push(row.userId);
      return acc;
    }, {});

    const postsWithPopulated = posts.map((post) => {
      const author = usersMap.get(post.author) || {
        id: post.author,
        name: "Unknown Alumni",
        email: "",
        image: "",
      };
      const commentsForPost = commentRows.filter((c) => c.postId === post.id);
      const comments = commentsForPost.map((comment) => {
        const cAuthor = usersMap.get(comment.authorId) || {
          id: comment.authorId,
          name: "Unknown Alumni",
          email: "",
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
      const likesArr = likesByPost[post.id] || [];
      const imagesArr = parseList(post.images);
      return {
        id: post.id,
        _id: post.id,
        content: post.content,
        category: post.category,
        image: post.image || imagesArr[0] || "",
        images: imagesArr.length > 0 ? imagesArr : post.image ? [post.image] : [],
        likes: likesArr,
        comments,
        commentsCount: comments.length,
        isEdited: post.isEdited,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
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
    });

    return NextResponse.json(
      postsWithPopulated.map((post: any) => cleanPost(post, String(currentUser.id))),
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

    const post = await prisma.post.create({
      data: {
        author: currentUser.id,
        content: parsed.data.content,
        category: parsed.data.category,
        image: images[0] || "",
        images: serializeList(images),
        isEdited: false,
      },
    });

    const usersMap = await getUsersByIds([post.author]);
    const author = usersMap.get(post.author) || {
      id: post.author,
      name: "Unknown Alumni",
      email: "",
      image: "",
    };
    const populatedPost = {
      id: post.id,
      _id: post.id,
      content: post.content,
      category: post.category,
      image: post.image,
      images,
      likes: [],
      comments: [],
      commentsCount: 0,
      isEdited: post.isEdited,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
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

    // Notify all users except the author
    try {
      const authorName = currentUser.name || "Someone";
      const category = parsed.data.category || "General";
      const truncatedContent =
        parsed.data.content.length > 80
          ? parsed.data.content.slice(0, 80) + "..."
          : parsed.data.content;

      const allUsers = await prisma.user.findMany({
        where: { id: { not: currentUser.id } },
        select: { id: true },
      });

      if (allUsers.length > 0) {
        const notificationDocs = allUsers.map((u: any) => ({
          receiver: u.id,
          sender: currentUser.id,
          type: "post" as const,
          title: `New ${category} Post`,
          body: `${authorName} posted: ${truncatedContent}`,
          link: `/feeds?post=${post.id}`,
          read: false,
        }));

        const created = await prisma.notification.createManyAndReturn({
          data: notificationDocs,
        });

        // Send real-time via Pusher to each user
        await Promise.allSettled(
          created.map((n: any) =>
            pusherServer.trigger(`notifications-${n.receiver}`, "new-notification", {
              _id: String(n.id),
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
      cleanPost(populatedPost, String(currentUser.id)),
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}