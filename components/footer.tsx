// file: components/footer.tsx

"use client";

import { usePathname } from "next/navigation";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

const footerText = {
  en: {
    brand: "Alumni Network",
    tagline: "Connecting Alumni • Sharing Knowledge • Inspiring Innovation",
  },
  mm: {
    brand: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    tagline:
      "ကျောင်းသားဟောင်းများချိတ်ဆက်ခြင်း • အသိပညာမျှဝေခြင်း • နည်းပညာတိုးတက်မှုအားပေးခြင်း",
  },
};

export default function Footer() {
  const pathname = usePathname() || "";
  const { lang } = useI18n();

  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = footerText[currentLang];

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

  if (pathname.startsWith("/vote")) {
    return null;
  }


  return (
    <footer className="mt-4 px-0 pb-2">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-white/60 bg-[#94EFEE]/95 px-4 py-3 text-center shadow-md backdrop-blur-2xl sm:py-2.5">
          <p className="text-xs font-black text-[#008B8B] sm:text-sm">
            © {new Date().getFullYear()} {t.brand} | {t.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}