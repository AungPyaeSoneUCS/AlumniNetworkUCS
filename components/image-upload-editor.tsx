// file: components/image-upload-editor.tsx

"use client";

import Image from "next/image";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X,
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
type Crop = { x: number; y: number; size: number };
type ImageSize = { naturalW: number; naturalH: number; displayW: number; displayH: number };

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
    type: "move-image" | "move-crop" | "resize-crop";
    corner?: "tl" | "tr" | "bl" | "br";
    startMouse: Point;
    startImage: Point;
    startCrop: Crop;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("profile-photo.jpg");

  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [imagePos, setImagePos] = useState<Point>({ x: 0, y: 0 });
  const [crop, setCrop] = useState<Crop>({ x: 90, y: 60, size: 280 });
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cropShape = rounded === "full" ? "rounded-full" : "rounded-3xl";

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
    setImagePos({ x: 0, y: 0 });
    setCrop({ x: 90, y: 60, size: 280 });
    setImageSize(null);
    setError("");
    setOpen(true);

    if (inputRef.current) inputRef.current.value = "";
  }

  function setupImageSize() {
    const img = imgRef.current;
    const stage = stageRef.current;
    if (!img || !stage) return;

    const stageRect = stage.getBoundingClientRect();
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    const stageRatio = stageRect.width / stageRect.height;
    const imageRatio = naturalW / naturalH;

    let displayW: number;
    let displayH: number;

    if (imageRatio > stageRatio) {
      displayW = stageRect.width;
      displayH = stageRect.width / imageRatio;
    } else {
      displayH = stageRect.height;
      displayW = stageRect.height * imageRatio;
    }

    setImageSize({ naturalW, naturalH, displayW, displayH });

    const size = Math.min(stageRect.width, stageRect.height) * 0.68;
    setCrop({
      x: (stageRect.width - size) / 2,
      y: (stageRect.height - size) / 2,
      size,
    });
  }

  function clampCrop(next: Crop) {
    const stage = stageRef.current;
    if (!stage) return next;

    const rect = stage.getBoundingClientRect();
    const min = 120;
    const max = Math.min(rect.width, rect.height) - 24;

    const size = Math.max(min, Math.min(max, next.size));
    const x = Math.max(12, Math.min(rect.width - size - 12, next.x));
    const y = Math.max(12, Math.min(rect.height - size - 12, next.y));

    return { x, y, size };
  }

  function onPointerDown(
    e: React.PointerEvent<HTMLDivElement>,
    type: "move-image" | "move-crop" | "resize-crop",
    corner?: "tl" | "tr" | "bl" | "br",
  ) {
    e.preventDefault();
    e.stopPropagation();

    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      type,
      corner,
      startMouse: { x: e.clientX, y: e.clientY },
      startImage: imagePos,
      startCrop: crop,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startMouse.x;
    const dy = e.clientY - dragRef.current.startMouse.y;

    if (dragRef.current.type === "move-image") {
      setImagePos({
        x: dragRef.current.startImage.x + dx,
        y: dragRef.current.startImage.y + dy,
      });
      return;
    }

    if (dragRef.current.type === "move-crop") {
      setCrop(
        clampCrop({
          ...dragRef.current.startCrop,
          x: dragRef.current.startCrop.x + dx,
          y: dragRef.current.startCrop.y + dy,
        }),
      );
      return;
    }

    const start = dragRef.current.startCrop;
    const corner = dragRef.current.corner;
    let next = { ...start };

    if (corner === "br") next.size = start.size + Math.max(dx, dy);

    if (corner === "tl") {
      const change = Math.max(-dx, -dy);
      next.size = start.size + change;
      next.x = start.x - change;
      next.y = start.y - change;
    }

    if (corner === "tr") {
      const change = Math.max(dx, -dy);
      next.size = start.size + change;
      next.y = start.y - change;
    }

    if (corner === "bl") {
      const change = Math.max(-dx, dy);
      next.size = start.size + change;
      next.x = start.x - change;
    }

    setCrop(clampCrop(next));
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  async function createCroppedFile(): Promise<File> {
    const img = imgRef.current;
    const stage = stageRef.current;

    if (!img || !stage || !imageSize) {
      throw new Error("Image not ready.");
    }

    const stageRect = stage.getBoundingClientRect();
    const outputSize = 900;
    const scale = outputSize / crop.size;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");

    const imageCenterX = stageRect.width / 2 + imagePos.x;
    const imageCenterY = stageRect.height / 2 + imagePos.y;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.save();

    ctx.translate(
      (imageCenterX - crop.x) * scale,
      (imageCenterY - crop.y) * scale,
    );

    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    ctx.drawImage(
      img,
      (-imageSize.displayW * scale) / 2,
      (-imageSize.displayH * scale) / 2,
      imageSize.displayW * scale,
      imageSize.displayH * scale,
    );

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
    try {
      setSaving(true);
      setError("");

      const file = await createCroppedFile();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

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
      <div
        className={
          compact
            ? "group relative h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-xl dark:border-slate-950"
            : "rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        }
      >
        {compact ? (
          <>
            {image ? (
              <Image src={image} alt={title} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ImagePlus size={30} />
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
            >
              <Camera size={22} />
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-32 w-32 overflow-hidden rounded-full bg-slate-100 shadow-xl dark:bg-slate-900">
              {image ? (
                <Image src={image} alt={title} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <ImagePlus size={38} />
                </div>
              )}

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-black text-slate-950 dark:text-white">
                {title}
              </h3>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {description}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
                >
                  <Upload size={17} />
                  Upload Photo
                </button>

                {image && (
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-600 dark:bg-red-950/30"
                  >
                    <Trash2 size={17} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        hidden
        type="file"
        accept="image/*"
        onChange={(e) => selectImage(e.target.files?.[0])}
      />

      {open && preview && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-md sm:items-center">
          <div className="w-full max-w-3xl overflow-hidden rounded-[32px] bg-white shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Crop profile photo
                </h2>
                <p className="text-xs font-bold text-slate-400">
                  Move photo or resize crop from four corners.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {error}
              </div>
            )}

            <div className="p-5">
              <div
                ref={stageRef}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="relative mx-auto h-[430px] max-h-[65vh] w-full overflow-hidden rounded-[28px] bg-slate-950"
              >
                <div
                  onPointerDown={(e) => onPointerDown(e, "move-image")}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={preview}
                    alt="Crop photo"
                    draggable={false}
                    onLoad={setupImageSize}
                    className="pointer-events-none absolute left-1/2 top-1/2 select-none"
                    style={{
                      width: imageSize?.displayW || "auto",
                      height: imageSize?.displayH || "auto",
                      transform: `translate(-50%, -50%) translate(${imagePos.x}px, ${imagePos.y}px) rotate(${rotate}deg) scale(${zoom})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>

                <div className="pointer-events-none absolute inset-0 bg-black/45" />

                <div
                  className={`absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] ${cropShape}`}
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.size,
                    height: crop.size,
                  }}
                >
                  <div
                    onPointerDown={(e) => onPointerDown(e, "move-crop")}
                    className="absolute inset-4 cursor-move"
                  />

                  {(["tl", "tr", "bl", "br"] as const).map((corner) => (
                    <div
                      key={corner}
                      onPointerDown={(e) => onPointerDown(e, "resize-crop", corner)}
                      className={`absolute h-8 w-8 rounded-full border-4 border-white bg-teal-500 shadow-xl ${
                        corner === "tl"
                          ? "-left-4 -top-4 cursor-nwse-resize"
                          : corner === "tr"
                            ? "-right-4 -top-4 cursor-nesw-resize"
                            : corner === "bl"
                              ? "-bottom-4 -left-4 cursor-nesw-resize"
                              : "-bottom-4 -right-4 cursor-nwse-resize"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((v) => Math.max(0.3, Number((v - 0.1).toFixed(2))))}
                    className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="range"
                    min="0.3"
                    max="4"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full accent-teal-600"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((v) => Math.min(4, Number((v + 0.1).toFixed(2))))}
                    className="rounded-2xl bg-slate-100 p-3 dark:bg-slate-900"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setRotate((v) => v - 90)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black dark:bg-slate-900"
                  >
                    <RotateCcw size={16} />
                    Left
                  </button>

                  <button
                    type="button"
                    onClick={() => setRotate((v) => v + 90)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black dark:bg-slate-900"
                  >
                    <RotateCw size={16} />
                    Right
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setRotate(0);
                      setImagePos({ x: 0, y: 0 });
                      setupImageSize();
                    }}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black dark:bg-slate-900"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={saveImage}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}