// file: proxy.ts
// Cross-Origin Resource Sharing (CORS) for all /api routes so the API is
// callable from both the web app and the React Native mobile app
// (AlumniMobileApp) from any origin.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-user-id, x-device-platform, Accept",
  "Access-Control-Max-Age": "86400",
};

export function proxy(request: NextRequest) {
  // Handle preflighted requests (e.g. browser cross-origin calls from a
  // web front-end or Expo web)
  if (request.method === "OPTIONS") {
    return NextResponse.json({}, { headers: corsHeaders });
  }

  // Simple requests: attach CORS headers to the actual response
  const response = NextResponse.next();

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  // CORS for the public API (web + mobile). The admin data tools
  // (import / backup / delete) are intentionally excluded: any route matched
  // here has its request body fully buffered in memory by Next.js, which
  // breaks/aborts large uploads (nginx surfaces this as a 502). Streamed
  // large uploads must reach the route handler untouched.
  matcher: [
    "/api/((?!admin/import-data|admin/backup|admin/delete-data).*)",
  ],
};