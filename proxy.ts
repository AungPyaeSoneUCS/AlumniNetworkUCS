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
  matcher: "/api/:path*",
};