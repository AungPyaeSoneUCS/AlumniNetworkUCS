// file: components/profile-card.tsx

"use client";

import Image from "next/image";
import Link from "next/link";

import {
  FaFacebook,
  FaGithub,
  FaLinkedin,
  FaXTwitter,
} from "react-icons/fa6";

import { useI18n } from "@/components/providers";

export default function ProfileCard({
  user,
}: {
  user: any;
}) {
  const { lang } = useI18n();

  const text =
    lang === "mm"
      ? {
          noBio: "Bio မထည့်ရသေးပါ။",
          general: "အထွေထွေ",
          connect: "ချိတ်ဆက်မည်",
          viewProfile: "ပရိုဖိုင် ကြည့်မည်",
        }
      : {
          noBio: "No bio added yet.",
          general: "General",
          connect: "Connect",
          viewProfile: "View Profile",
        };

  return (
    <div className="glass-card p-5 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center gap-4">
        <Image
          src={user.image || "/avatar.png"}
          alt={user.name || "User"}
          width={72}
          height={72}
          className="rounded-2xl object-cover"
        />

        <div>
          <h3 className="text-lg font-bold">
            {user.name}
          </h3>

          <p className="text-sm text-slate-500">
            {user.email}
          </p>

          <p className="text-sm text-slate-600 dark:text-slate-300">
            {user.graduatedYear || "—"} •{" "}
            {user.department || text.general}
          </p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
        {user.bio || text.noBio}
      </p>

      <div className="mt-4 flex gap-3 text-xl text-slate-500">
        {user.socialLinks?.facebook && (
          <a
            href={user.socialLinks.facebook}
            target="_blank"
            rel="noreferrer"
          >
            <FaFacebook />
          </a>
        )}

        {user.socialLinks?.linkedin && (
          <a
            href={user.socialLinks.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            <FaLinkedin />
          </a>
        )}

        {user.socialLinks?.github && (
          <a
            href={user.socialLinks.github}
            target="_blank"
            rel="noreferrer"
          >
            <FaGithub />
          </a>
        )}

        {user.socialLinks?.twitter && (
          <a
            href={user.socialLinks.twitter}
            target="_blank"
            rel="noreferrer"
          >
            <FaXTwitter />
          </a>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <button className="gradient-btn flex-1">
          {text.connect}
        </button>

        <Link
          href={`/profile/${user._id}`}
          className="flex-1 rounded-2xl border border-slate-300 px-4 py-2.5 text-center font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {text.viewProfile}
        </Link>
      </div>
    </div>
  );
}