// file: lib/push.ts

export interface ExpoPushMessage {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
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

// Parse and return the expo push tokens for a list of users
export async function getPushTokensForUsers(userIds: string[], pushModel: any) {
  if (!userIds || userIds.length === 0) return [];
  const tokens = await pushModel.find({
    user: { $in: userIds },
  }).distinct("expoPushToken").lean();
  return tokens as string[];
}
