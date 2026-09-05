// file: components/image-upload-editor.tsx

"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Move,
  RotateCcw,
  RotateCw,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type Props = {
  image?: string;
  onChange: (url: string) => void;
  uploadUrl?: string;
  title?: string;
  description?: string;
  rounded?: "full" | "square";
  compact?: boolean;
};

type Point = { x: number; y: number };

let maskSeq = 0;

export default function ImageUploadEditor({
  image,
  onChange,
  uploadUrl = "/api/upload/profile-photo",
  title = "Profile photo",
  description = "Upload and crop your profile photo.",
  rounded = "full",
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<{
    startMouse: Point;
    startPos: Point;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("profile-photo.jpg");
  const [imageLoaded, setImageLoaded] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [imgPos, setImgPos] = useState<Point>({ x: 0, y: 0 });
  const [imgDisplay, setImgDisplay] = useState<{ w: number; h: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const maskId = useRef(`cropMask-${++maskSeq}-${Date.now()}`).current;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function selectImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);

    setPreview(URL.createObjectURL(file));
    setFileName(file.name || "profile-photo.jpg");
    setZoom(1);
    setRotate(0);
    setImgPos({ x: 0, y: 0 });
    setImgDisplay(null);
    setImageLoaded(false);
    setError("");
    setOpen(true);

    if (inputRef.current) inputRef.current.value = "";
  }

  function onImageLoad() {
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return;

    const stageRect = stage.getBoundingClientRect();
    const stageSize = Math.min(stageRect.width, stageRect.height);
    const cropSize = stageSize * 0.78;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const imageRatio = naturalW / naturalH;

    let displayW: number;
    let displayH: number;

    if (imageRatio > 1) {
      displayH = cropSize;
      displayW = cropSize * imageRatio;
    } else {
      displayW = cropSize;
      displayH = cropSize / imageRatio;
    }

    setImgDisplay({ w: displayW, h: displayH });
    setImageLoaded(true);
  }

  function clampPosition(next: Point): Point {
    const stage = stageRef.current;
    if (!stage || !imgDisplay) return next;

    const rect = stage.getBoundingClientRect();
    const stageSize = Math.min(rect.width, rect.height);
    const cropSize = stageSize * 0.78;
    const halfCrop = cropSize / 2;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const scaledW = imgDisplay.w * zoom;
    const scaledH = imgDisplay.h * zoom;

    const minX = -(scaledW / 2) + halfCrop;
    const maxX = (scaledW / 2) - halfCrop;
    const minY = -(scaledH / 2) + halfCrop;
    const maxY = (scaledH / 2) - halfCrop;

    const clampedX = scaledW <= cropSize ? 0 : Math.max(minX, Math.min(maxX, next.x));
    const clampedY = scaledH <= cropSize ? 0 : Math.max(minY, Math.min(maxY, next.y));

    return { x: clampedX, y: clampedY };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!dragRef.current && e.button === 0) {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        startMouse: { x: e.clientX, y: e.clientY },
        startPos: { ...imgPos },
      };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startMouse.x;
    const dy = e.clientY - dragRef.current.startMouse.y;
    setImgPos(clampPosition({
      x: dragRef.current.startPos.x + dx,
      y: dragRef.current.startPos.y + dy,
    }));
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  }

  function setZoomClamped(v: number) {
    setZoom(Math.max(0.5, Math.min(4, v)));
    setImgPos((p) => clampPosition(p));
  }

  async function createCroppedFile(): Promise<File> {
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage || !imgDisplay) throw new Error("Image not ready.");

    const stageRect = stage.getBoundingClientRect();
    const stageSize = Math.min(stageRect.width, stageRect.height);
    const cropSize = stageSize * 0.78;
    const outputSize = 900;
    const scale = outputSize / cropSize;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.save();

    if (rounded === "full") {
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();
    } else {
      const radius = Math.round(outputSize * 0.03);
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.arcTo(outputSize, 0, outputSize, outputSize, radius);
      ctx.arcTo(outputSize, outputSize, 0, outputSize, radius);
      ctx.arcTo(0, outputSize, 0, 0, radius);
      ctx.arcTo(0, 0, outputSize, 0, radius);
      ctx.clip();
    }

    const rotated = rotate % 360 !== 0;

    let drawW = imgDisplay.w * scale * zoom;
    let drawH = imgDisplay.h * scale * zoom;

    ctx.translate(outputSize / 2, outputSize / 2);

    if (rotated) {
      ctx.rotate((rotate * Math.PI) / 180);
      if (Math.abs(rotate % 180) === 90) {
        const sw = drawW;
        drawW = drawH;
        drawH = sw;
      }
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Crop failed."));
          const cleanName = fileName.replace(/\.[^/.]+$/, "");
          resolve(new File([blob], `${cleanName}-cropped.jpg`, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92,
      );
    });
  }

  async function saveImage() {
    if (!imageLoaded) return;
    try {
      setSaving(true);
      setError("");

      const file = await createCroppedFile();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed.");

      const data = await res.json();
      const uploadedUrl = data.image || data.url || data.secure_url || "";
      if (!uploadedUrl) throw new Error("Upload URL missing.");

      onChange(uploadedUrl);
      setOpen(false);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Thumbnail trigger */}
      {compact ? (
        <div className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-slate-100 shadow-lg ring-1 ring-black/5 transition-transform hover:scale-[1.03] dark:border-slate-900 dark:bg-slate-800">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 text-slate-400 dark:from-slate-800 dark:to-slate-900 dark:text-slate-500">
              <ImagePlus size={28} />
            </div>
          )}

          {image && (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Remove photo"
              title="Remove photo"
              className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-all duration-200 hover:bg-red-600 group-hover:opacity-100"
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Change photo"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover:opacity-100"
          >
            <Camera size={20} strokeWidth={2.4} />
          </button>
        </div>
      ) : (
        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-slate-100 shadow-xl ring-4 ring-slate-50 dark:bg-slate-900 dark:ring-slate-900">
              {image ? (
                <Image src={image} alt={title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                  <ImagePlus size={38} />
                </div>
              )}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                aria-label="Change photo"
                className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00BFC4] to-[#008B8B] text-white shadow-lg transition-transform hover:scale-105"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{description}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <Upload size={17} />
                  Upload Photo
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                  >
                    <X size={17} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => selectImage(e.target.files?.[0])}
      />

      {/* Crop Modal */}
      {open && preview && (
        <div className="crop-modal-in fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-xl">
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Camera size={18} className="text-white/80" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Crop Photo</h2>
                <p className="flex items-center gap-1 text-[11px] text-white/40">
                  <Move size={11} />
                  Drag image to reposition
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all hover:bg-white/20 hover:text-white hover:rotate-90"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mx-5 mb-3 flex items-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400 ring-1 ring-red-500/20">
              <X size={15} />
              {error}
            </div>
          )}

          {/* Crop area */}
          <div className="relative flex flex-1 items-center justify-center px-5 py-4">
            <div
              ref={stageRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="relative w-full max-w-[460px] aspect-square cursor-grab overflow-hidden active:cursor-grabbing rounded-3xl bg-slate-900/50"
            >
              {!imageLoaded && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                  <div className="flex h-12 w-12 animate-spin items-center justify-center rounded-full border-2 border-white/20 border-t-teal-400">
                    <span className="sr-only">Loading image</span>
                  </div>
                  <p className="text-xs font-bold text-white/50">Preparing image...</p>
                </div>
              )}

              {/* Image */}
              {imgDisplay && (
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Crop"
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 select-none"
                  style={{
                    width: imgDisplay.w,
                    height: imgDisplay.h,
                    transform: `translate(-50%, -50%) translate(${imgPos.x}px, ${imgPos.y}px) rotate(${rotate}deg) scale(${zoom})`,
                    transformOrigin: "center",
                    opacity: imageLoaded ? 1 : 0,
                    transition: "opacity 0.2s ease",
                  }}
                />
              )}

              {/* Preview image before load */}
              {!imgDisplay && (
                <img
                  ref={imgRef}
                  src={preview}
                  alt="Crop"
                  draggable={false}
                  onLoad={onImageLoad}
                  className="hidden"
                />
              )}

              {/* Dark overlay with cutout */}
              <div className="pointer-events-none absolute inset-0">
                {rounded === "full" ? (
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <mask id={maskId}>
                        <rect width="100" height="100" fill="white" />
                        <circle cx="50" cy="50" r="39" fill="black" />
                      </mask>
                    </defs>
                    <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask={`url(#${maskId})`} />
                    <circle cx="50" cy="50" r="39" fill="none" stroke="#f1cd72" strokeWidth="1" />
                  </svg>
                ) : (
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <mask id={`${maskId}Sq`}>
                        <rect width="100" height="100" fill="white" />
                        <rect x="11" y="11" width="78" height="78" rx="3" fill="black" />
                      </mask>
                    </defs>
                    <rect width="100" height="100" fill="rgba(0,0,0,0.6)" mask={`url(#${maskId}Sq)`} />
                    <rect x="11" y="11" width="78" height="78" rx="3" fill="none" stroke="#f1cd72" strokeWidth="0.7" />
                  </svg>
                )}
              </div>

              {/* Corner guides */}
              <div className="pointer-events-none absolute inset-0 z-10">
                <span className="absolute left-[23%] top-[23%] h-5 w-5 border-l-2 border-t-2 border-[#f1cd72]" />
                <span className="absolute right-[23%] top-[23%] h-5 w-5 border-r-2 border-t-2 border-[#f1cd72]" />
                <span className="absolute bottom-[23%] left-[23%] h-5 w-5 border-b-2 border-l-2 border-[#f1cd72]" />
                <span className="absolute bottom-[23%] right-[23%] h-5 w-5 border-b-2 border-r-2 border-[#f1cd72]" />
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="crop-controls-in mx-3 mb-4 rounded-3xl bg-white/10 p-4 backdrop-blur-md ring-1 ring-white/10 sm:mx-5 sm:mb-6">
            {/* Zoom slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoomClamped(zoom - 0.15)}
                aria-label="Zoom out"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <ZoomOut size={16} />
              </button>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                  setImgPos((p) => clampPosition(p));
                }}
                aria-label="Zoom"
                className="w-full accent-[#00BFC4]"
              />
              <button
                type="button"
                onClick={() => setZoomClamped(zoom + 0.15)}
                aria-label="Zoom in"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Rotate + Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setRotate((v) => v - 90)}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <RotateCcw size={14} />
                Left
              </button>
              <button
                type="button"
                onClick={() => setRotate((v) => v + 90)}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <RotateCw size={14} />
                Right
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setRotate(0);
                  setImgPos({ x: 0, y: 0 });
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <RotateCcw size={14} className="rotate-180" />
                Reset
              </button>

              <div className="flex-1" />

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveImage}
                disabled={saving || !imageLoaded}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-500/25 transition-all hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .crop-modal-in {
          animation: cropFade 0.25s ease-out both;
        }
        .crop-controls-in {
          animation: cropUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cropUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
