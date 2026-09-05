// file: components/profile-photo-viewer.tsx

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Download, Loader2, X } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  name: string;
  open: boolean;
  onClose: () => void;
};

export default function ProfilePhotoViewer({
  src,
  alt,
  name,
  open,
  onClose,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPlaceholder = src === "/avatar.png";

  function downloadImage() {
    if (isPlaceholder || saving) return;
    setSaving(true);
    setSaved(false);

    // Try fetch -> blob for external (Google) images so CORS-broken URLs still save.
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.blob();
      })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `${name || "profile-photo"}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(objectUrl);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      })
      .catch(() => {
        // Fallback: same-origin / direct download via anchor tag.
        const a = document.createElement("a");
        a.href = src;
        a.download = `${name || "profile-photo"}.jpg`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      })
      .finally(() => setSaving(false));
  }

  return (
    <div
      className="photo-viewer-in fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} profile photo`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Image
              src={src}
              alt={alt}
              width={40}
              height={40}
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {name || "Profile Photo"}
            </p>
            <p className="text-[11px] font-medium text-white/40">
              1 photo
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:rotate-90"
        >
          <X size={20} />
        </button>
      </div>

      {/* Photo area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-4">
        <div className="photo-zoom-in relative max-h-full max-w-full">
          <img
            src={src}
            alt={alt}
            className="max-h-[calc(100vh-190px)] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <p className="hidden text-xs font-semibold text-white/40 sm:block">
          {isPlaceholder ? "No profile photo available" : name}
        </p>

        <div className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={downloadImage}
            disabled={saving || isPlaceholder}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : saved ? (
              <Check size={16} />
            ) : (
              <Download size={16} />
            )}
            {saving
              ? "Saving..."
              : saved
                ? "Saved"
                : isPlaceholder
                  ? "No photo"
                  : "Save"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .photo-viewer-in {
          animation: pvFade 0.22s ease-out both;
        }
        .photo-zoom-in {
          animation: pvZoom 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes pvFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes pvZoom {
          from {
            opacity: 0;
            transform: scale(0.82);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}