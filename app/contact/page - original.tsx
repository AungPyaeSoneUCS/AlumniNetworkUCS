// file: app/contact/page.tsx

"use client";

import type React from "react";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";

import { useI18n } from "@/components/providers";

const text = {
  en: {
    phone: "Phone",
    location: "Location",
    website: "Website",
    facebook: "Facebook",
  },

  mm: {
    phone: "ဖုန်း",
    location: "တည်နေရာ",
    website: "Website",
    facebook: "Facebook",
  },
};

const phones = [
  {
    label: "044 22725",
    href: "tel:+9504422725",
  },
  {
    label: "09783543901",
    href: "tel:+959783543901",
  },
];

export default function ContactPage() {
  const { lang } = useI18n();

  const currentLang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  return (
    <section className="mm relative min-h-screen overflow-hidden bg-[#F1FFFF] px-3 py-4 text-slate-950 sm:px-4 sm:py-6 lg:py-8">
      <GradientBackground />

      <style>{`
        @keyframes contactFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .contact-animate {
          animation: contactFadeUp 0.45s ease-out both;
        }
      `}</style>

      <div className="contact-animate relative z-10 mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
        <div className="rounded-[1.25rem] border border-white/70 bg-white/90 p-3 shadow-xl backdrop-blur-xl sm:rounded-[1.75rem] sm:p-4 lg:p-5">
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] p-3 shadow-sm sm:p-4">
              <div className="flex items-start gap-3">
                <IconBox>
                  <Phone size={18} />
                </IconBox>

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {t.phone}
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {phones.map((phone) => (
                      <a
                        key={phone.href}
                        href={phone.href}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-3 py-2.5 text-xs font-black text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:text-sm"
                      >
                        <Phone size={15} />
                        {phone.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <InfoCard
              icon={<Mail size={18} />}
              label="Email"
              value="cu.hinthada@gmail.com"
              href="mailto:cu.hinthada@gmail.com"
            />

            <InfoCard
              icon={<MapPin size={18} />}
              label={t.location}
              value="No.28, Kayin Kyaung Street, TarNgar Se (South) Quarter, Hinthada Township, Ayeyarwaddy Region, Myanmar. Postcode – 100601"
            />

            <InfoCard
              icon={<Globe size={18} />}
              label={t.website}
              value="ucsh.edu.mm"
              href="https://ucsh.edu.mm"
            />

            <InfoCard
              icon={<FaFacebookF size={16} />}
              label={t.facebook}
              value="University of Computer Studies, Hinthada"
              href="https://www.facebook.com"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/90 shadow-xl backdrop-blur-xl sm:rounded-[1.75rem]">
          <div className="h-[360px] w-full sm:h-[430px] md:h-[500px] lg:h-full lg:min-h-[560px]">
            <iframe
              src="https://www.google.com/maps?q=University%20of%20Computer%20Studies%20Hinthada&output=embed"
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] text-white shadow-md">
      {children}
    </span>
  );
}

function InfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-2xl border border-[#25C9C8]/20 bg-[#F8FFFF] p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg sm:p-4">
      <IconBox>{icon}</IconBox>

      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>

        <p className="mt-1.5 break-words text-sm font-black leading-6 text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function GradientBackground() {
  return (
    <>
      <div className="absolute inset-0 -z-10 bg-[#94EFEE]" />
      <div className="absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-white/45 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#25C9C8]/40 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
      <div className="absolute inset-x-0 top-0 -z-10 h-3 bg-[#25C9C8]" />
    </>
  );
}