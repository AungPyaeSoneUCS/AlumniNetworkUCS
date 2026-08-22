// file: components/footer.tsx

"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname() || "";

  // Hide footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }
   if (pathname.startsWith("/messages")) {
    return null;
  }
  if (pathname.startsWith("/staff")) {
    return null;
  }
  if (pathname.startsWith("/AungPyaeSoneUCS")) {
    return null;
  }
  if (pathname.startsWith("/ChitSuWai")) {
    return null;
  }
    if (pathname.startsWith("/game")) {
    return null;
  }


  return (
    <footer className="mt-4 px-0 pb-2">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-t-2xl border border-white/60 bg-[#94EFEE]/95 px-4 py-3 shadow-md backdrop-blur-2xl">

            <p className="text-xs font-black text-[#008B8B] sm:text-sm text-center">
              © {new Date().getFullYear()} Alumni Network |    Connecting Alumni • Sharing Knowledge • Inspiring Innovation
            </p>

        
       
        </div>
      </div>
    </footer>
  );
}