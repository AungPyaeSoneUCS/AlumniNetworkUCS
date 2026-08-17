/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.16.2.15'],
  allowedDevOrigins: ['10.16.2.223'],
  allowedDevOrigins: ['192.168.100.233'],
  allowedDevOrigins: ['10.16.2.161'],

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
  },
};

export default nextConfig;