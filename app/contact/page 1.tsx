// file: app/contact/page.tsx

"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";

import { useI18n } from "@/components/providers";

type Lang = "en" | "mm";

type ContactData = {
  phone1: string;
  phone2: string;
  email: string;
  address: string;
  website: string;
  facebookUrl: string;
  facebookName: string;
  mapUrl: string;
};

const text = {
  en: {
    email: "Email",
    phone: "Phone",
    location: "Location",
    website: "Website",
    facebook: "Facebook",
    map: "Location",
    satelliteView: "Satellite View",
    openMap: "Open in Google Maps",
  },
  mm: {
    email: "အီးမေးလ်",
    phone: "ဖုန်း",
    location: "တည်နေရာ",
    website: "ဝက်ဘ်ဆိုဒ်",
    facebook: "Facebook",
    map: "တည်နေရာ",
    satelliteView: "မြေပုံမြင်ကွင်း",
    openMap: "Google Maps ဖြင့် ဖွင့်ရန်",
  },
};

const directGoogleMapUrl = "https://maps.app.goo.gl/KK2VuCrQR9TRs9Jq9";

const defaultContact: ContactData = {
  phone1: "044 22725",
  phone2: "09783543901",
  email: "cu.hinthada@gmail.com",
  address:
    "No.28, Kayin Kyaung Street, TarNgar Se (South) Quarter, Hinthada Township, Ayeyarwaddy Region, Myanmar. Postcode – 100601",
  website: "ucsh.edu.mm",
  facebookUrl: "https://www.facebook.com",
  facebookName: "University of Computer Studies, Hinthada",
  mapUrl:
    "https://maps.google.com/maps?q=17.655472,95.457962&t=k&z=17&output=embed",
};

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function normalizeUrl(url: string) {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

function satelliteMapUrl(url: string) {
  if (!url) return defaultContact.mapUrl;

  if (url.includes("maps.app.goo.gl")) {
    return defaultContact.mapUrl;
  }

  try {
    const map = new URL(normalizeUrl(url));
    map.searchParams.set("t", "k");
    map.searchParams.set("z", "17");
    map.searchParams.set("output", "embed");
    return map.toString();
  } catch {
    return defaultContact.mapUrl;
  }
}

export default function ContactPage() {
  const { lang } = useI18n();
  const currentLang: Lang = lang === "mm" ? "mm" : "en";
  const t = text[currentLang];

  const [contact, setContact] = useState<ContactData>(defaultContact);

  useEffect(() => {
    async function loadContact() {
      try {
        const res = await fetch("/api/contact", { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();

        setContact({
          phone1: data.phone1 || defaultContact.phone1,
          phone2: data.phone2 || defaultContact.phone2,
          email: data.email || defaultContact.email,
          address: data.address || defaultContact.address,
          website: data.website || defaultContact.website,
          facebookUrl: data.facebookUrl || defaultContact.facebookUrl,
          facebookName: data.facebookName || defaultContact.facebookName,
          mapUrl: data.mapUrl || defaultContact.mapUrl,
        });
      } catch {
        // keep default contact
      }
    }

    loadContact();
  }, []);

  const phones = [contact.phone1, contact.phone2].filter(Boolean);
  const mapSrc = useMemo(() => satelliteMapUrl(contact.mapUrl), [contact.mapUrl]);

  return (
    <main className="mm page-wrapper relative overflow-hidden text-[var(--ucsh-text)]">
      <BackgroundDecor />

      <section className="ucsh-container relative z-10 grid gap-5 lg:grid-cols-[1fr_430px]">
        <div className="ucsh-card ucsh-animate p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              icon={<Mail size={18} />}
              label={t.email}
              value={contact.email}
              href={`mailto:${contact.email}`}
            />

            <InfoCard
              icon={<Globe size={18} />}
              label={t.website}
              value={contact.website}
              href={normalizeUrl(contact.website)}
            />

            <InfoCard
              icon={<FaFacebookF size={15} />}
              label={t.facebook}
              value={contact.facebookName}
              href={normalizeUrl(contact.facebookUrl)}
            />

            <InfoCard
              icon={<MapPin size={18} />}
              label={t.location}
              value={contact.address}
            />
          </div>

          <div className="mt-4 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-4 shadow-sm backdrop-blur dark:bg-slate-950/70">
            <div className="mb-3 flex items-start gap-3">
              <IconBox size="sm">
                <Phone size={16} />
              </IconBox>

              <div className="min-w-0">
                <LabelText>{t.phone}</LabelText>

                <div className="mt-2 flex flex-wrap gap-2">
                  {phones.map((phone) => (
                    <a
                      key={phone}
                      href={phoneHref(phone)}
                      className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[var(--ucsh-border)] bg-white/80 px-4 py-2 text-sm font-black text-[var(--ucsh-text)] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[var(--ucsh-primary)] hover:bg-cyan-50 hover:text-[var(--ucsh-primary-dark)] hover:shadow-md dark:bg-slate-950/70 dark:hover:bg-slate-900"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="ucsh-card ucsh-animate p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <LabelText>{t.satelliteView}</LabelText>

              <h2 className="mt-1 text-xl font-black text-[var(--ucsh-text)]">
                {t.map}
              </h2>
            </div>

            <span className="rounded-full border border-[var(--ucsh-border)] bg-white/75 px-3 py-1 text-xs font-black text-[var(--ucsh-primary-dark)] shadow-sm backdrop-blur dark:bg-slate-950/70">
              Map
            </span>
          </div>

          <div className="overflow-hidden rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-slate-100 shadow-sm dark:bg-slate-950">
            <iframe
              src={mapSrc}
              width="100%"
              height="300"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[260px] w-full border-0 sm:h-[300px]"
            />
          </div>

          <a
            href={directGoogleMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ucsh-btn mt-4 w-full px-5 py-3 text-sm"
          >
            {t.openMap}
            <ExternalLink size={16} />
          </a>
        </aside>
      </section>
    </main>
  );
}

function LabelText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--ucsh-muted)]">
      {children}
    </p>
  );
}

function IconBox({
  children,
  size = "md",
}: {
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[var(--ucsh-primary)] to-[var(--ucsh-secondary)] text-white shadow-md ${
        size === "sm" ? "h-9 w-9" : "h-11 w-11"
      }`}
    >
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
  const card = (
    <div className="group flex h-full items-start gap-3 rounded-[var(--ucsh-radius-lg)] border border-[var(--ucsh-border)] bg-white/65 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md dark:bg-slate-950/70 dark:hover:bg-slate-900">
      <IconBox>{icon}</IconBox>

      <div className="min-w-0">
        <LabelText>{label}</LabelText>

        <p className="mt-1.5 break-words text-sm font-black leading-6 text-[var(--ucsh-text)]">
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) return card;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block h-full">
      {card}
    </a>
  );
}

function BackgroundDecor() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-white/45 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[var(--ucsh-primary)]/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/25 blur-3xl" />
    </>
  );
}