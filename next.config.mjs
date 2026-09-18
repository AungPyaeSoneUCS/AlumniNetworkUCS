/** @type {import('next').NextConfig} */
const allowedDevOrigins = [
  "192.168.70.184",
  "10.16.2.15",
  "10.16.2.223",
  "192.168.100.233",
  "10.16.2.161",
];

const nextConfig = {
  allowedDevOrigins,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    // Uploaded profile photos are stored as /uploads/...?v=<timestamp>.
    // Next.js rejects local images with a query string unless the pattern
    // explicitly allows it, which caused the navbar avatar to fail (400).
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
      {
        pathname: "**",
        search: "",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/download/:file*.apk",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.android.package-archive",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
