import { headers } from "next/headers";

export async function getRequestInfo() {
  // Await the headers Promise required in modern Next.js App Router architectures
  const h = await headers();

  const userAgent = h.get("user-agent") || "Unknown device";
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "Unknown IP";

  const now = new Date();

  return {
    date: now.toLocaleDateString("en-US", {
      timeZone: "Asia/Yangon",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: now.toLocaleTimeString("en-US", {
      timeZone: "Asia/Yangon",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    device: getDeviceName(userAgent),
    ip,
  };
}

function getDeviceName(userAgent: string) {
  const os = userAgent.includes("Windows")
    ? "Windows"
    : userAgent.includes("Mac")
      ? "Mac"
      : userAgent.includes("Android")
        ? "Android"
        : userAgent.includes("iPhone")
          ? "iPhone"
          : "Unknown OS";

  const browser = userAgent.includes("Edg")
    ? "Microsoft Edge"
    : userAgent.includes("Chrome")
      ? "Google Chrome"
      : userAgent.includes("Firefox")
        ? "Mozilla Firefox"
        : userAgent.includes("Safari")
          ? "Safari"
          : "Unknown Browser";

  return `${browser} on ${os}`;
}