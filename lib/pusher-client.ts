// file: lib/pusher-client.ts

import Pusher from "pusher-js";

let client: Pusher | null = null;

export function getPusherClient() {
  if (typeof window === "undefined") return null;

  if (!client) {
    client = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });
  }

  return client;
}