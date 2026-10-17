// app/api/posts/[id]/like/route.ts
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";
import { isValidId } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(req: Request, { params }: Props) {
  try {
    const { id } = await params;
    const user: any = await getAuthenticatedUser(req);

    if (!user) {
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

    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId: user.id } },
    });
    const liked = !!existingLike;

    if (liked) {
      await prisma.postLike.delete({
        where: { postId_userId: { postId: id, userId: user.id } },
      });
    } else {
      await prisma.postLike.create({
        data: { postId: id, userId: user.id },
      });
    }

    // Notify post author on like (skip self-like)
    if (!liked && String(post.author) !== String(user.id)) {
      try {
        const liker = await prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true },
        });
        const likerName = liker?.name || "Someone";

        const notification = await prisma.notification.create({
          data: {
            receiver: post.author,
            sender: user.id,
            type: "like",
            title: "New Like",
            body: `${likerName} liked your post`,
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
        console.error("Like notification error:", notifyErr);
      }
    }

    const likes = await prisma.postLike.findMany({
      where: { postId: id },
      select: { userId: true },
    });
    const likeIds = likes.map((l) => l.userId);

    return NextResponse.json(
      {
        liked: !liked,
        likes: likeIds,
        likesCount: likeIds.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/posts/[id]/like error:", error);
    return NextResponse.json({ error: "Failed to react" }, { status: 500 });
  }
}