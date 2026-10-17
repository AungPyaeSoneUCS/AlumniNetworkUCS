// file: lib/push.ts

import { prisma } from "./prisma";

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: string;
  channelId?: string;
}

// Send a push notification via Expo Push API
export async function sendExpoPushNotifications(messages: ExpoPushMessage[]) {
  if (!messages || messages.length === 0) return;

  const tokens = messages.map((m) => m.to).filter(Boolean);
  if (tokens.length === 0) return;

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("[Push] Failed to send Expo push:", error);
    return null;
  }
}

// Return the Expo push tokens registered for the given users
export async function getPushTokensForUsers(userIds: string[]): Promise<string[]> {
  if (!userIds || userIds.length === 0) return [];

  const rows = await prisma.pushToken.findMany({
    where: { user: { in: userIds } },
    select: { expoPushToken: true },
  });

  return Array.from(new Set(rows.map((r) => r.expoPushToken).filter(Boolean)));
}
