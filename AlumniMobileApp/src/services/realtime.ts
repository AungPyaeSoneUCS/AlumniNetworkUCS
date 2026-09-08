// file: src/services/realtime.ts
import Pusher from "pusher-js";
import * as SecureStore from "expo-secure-store";

const PUSHER_KEY = "2caec8fb61105b6ea493";
const PUSHER_CLUSTER = "ap1";

let pusher: Pusher | null = null;
let currentUserId: string | null = null;

export interface RealtimeMessage {
  _id: string;
  text: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  deletedBy?: string;
  seen?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sender: any;
  receiver: any;
  reactions?: any[];
}

export interface RealtimeNotification {
  _id: string;
  type?: string;
  title?: string;
  body?: string;
  link?: string;
  read?: boolean;
  createdAt?: string;
  sender?: any;
}

function getConversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join("-");
}

export function getPusher(): Pusher | null {
  if (!pusher) {
    pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, enabledTransports: ["ws", "wss"] });
  }
  return pusher;
}

export async function connectRealtime() {
  const session = await SecureStore.getItemAsync("user_session");
  if (!session) return;
  const user = JSON.parse(session);
  const userId = user._id;
  currentUserId = userId;

  const client = getPusher();
  if (!client) return;
  client.connection.bind("connected", () => {
    console.log("[Realtime] Pusher connected");
  });
}

export function subscribeChat(
  otherUserId: string,
  onNewMessage: (message: RealtimeMessage) => void
): () => void {
  if (!currentUserId) return () => {};
  const convoId = getConversationId(currentUserId, otherUserId);
  const channel = getPusher()?.subscribe(`chat-${convoId}`);
  const handler = (data: RealtimeMessage) => onNewMessage(data);
  channel?.bind("new-message", handler);
  channel?.bind("message-reaction", handler);
  return () => {
    if (channel) {
      channel.unbind("new-message", handler);
      channel.unbind("message-reaction", handler);
      getPusher()?.unsubscribe(`chat-${convoId}`);
    }
  };
}

export function subscribeNotifications(
  onNotification: (notification: RealtimeNotification) => void
): () => void {
  if (!currentUserId) return () => {};
  const channel = getPusher()?.subscribe(`notifications-${currentUserId}`);
  const handler = (data: RealtimeNotification) => onNotification(data);
  channel?.bind("new-notification", handler);
  return () => {
    if (channel) {
      channel.unbind("new-notification", handler);
      getPusher()?.unsubscribe(`notifications-${currentUserId}`);
    }
  };
}

export function disconnectRealtime() {
  if (pusher) {
    pusher.disconnect();
    pusher = null;
  }
}
