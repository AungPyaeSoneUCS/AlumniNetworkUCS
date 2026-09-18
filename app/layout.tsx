// file: app/layout.tsx

import type { Metadata, Viewport } from "next";
import "./globals.css";

import Providers from "@/components/providers";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Alumni Network",
  description: "Modern alumni social network",
  manifest: "/manifest.webmanifest",
  applicationName: "Alumni Network",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alumni Network",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#008B8B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Nav />

            <main className="flex-1 ">
              {children}
            </main>

            <Footer />
          </div>
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}