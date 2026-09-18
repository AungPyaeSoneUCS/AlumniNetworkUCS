import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alumni Network - University of Computer Studies Hinthada",
    short_name: "Alumni Network",
    description:
      "Modern alumni social network for the University of Computer Studies (Hinthada). Connect with alumni, share knowledge and inspire innovation.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#94EFEE",
    theme_color: "#008B8B",
    lang: "en",
    categories: ["social", "education", "community"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Feeds",
        short_name: "Feeds",
        url: "/feeds",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Directory",
        short_name: "Directory",
        url: "/directory",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Download App",
        short_name: "Download",
        url: "/download",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}