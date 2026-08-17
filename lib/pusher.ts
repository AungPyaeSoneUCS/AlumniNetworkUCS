// file: lib/pusher.ts

import Pusher from "pusher";

// Declare global type to prevent multiple instances during hot-reloads
declare global {
  var pusherServerInstance: Pusher | undefined;
}

export const pusherServer =
  global.pusherServerInstance ||
  new Pusher({
    appId: process.env.PUSHER_APP_ID || "",
    key: process.env.NEXT_PUBLIC_PUSHER_KEY || "",
    secret: process.env.PUSHER_SECRET || "",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    useTLS: true,
  });

if (process.env.NODE_ENV !== "production") {
  global.pusherServerInstance = pusherServer;
}