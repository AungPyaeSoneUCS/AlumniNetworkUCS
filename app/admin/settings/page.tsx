// file: app/admin/settings/logo/page.tsx

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UploadCloud, Save, Loader2 } from "lucide-react";

export default function UploadLogoDynamic() {
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch the current logo when the page loads
  useEffect(() => {
    async function fetchCurrentLogo() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings/logo");
        if (res.ok) {
          const data = await res.json();
          setCurrentLogo(data.logoUrl || "/logo/logo-250.png");
        }
      } catch (error) {
        console.error("Failed to fetch logo", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCurrentLogo();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert file to Base64 to store in Database easily without S3/AWS
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: preview }),
      });

      if (res.ok) {
        setCurrentLogo(preview);
        setPreview(null);
        alert("Logo updated successfully! Refresh the page to see changes in the Nav.");
      } else {
        alert("Failed to update logo.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving logo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-black text-[#008B8B]">Dynamic Logo Settings</h1>
      
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-slate-700">Current Logo</h2>
        {loading ? (
          <Loader2 className="animate-spin text-[#008B8B]" />
        ) : (
          <div className="mb-8 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <Image
              src={currentLogo || "/logo/logo-250.png"}
              alt="Current Logo"
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
        )}

        <h2 className="mb-4 text-sm font-bold text-slate-700">Upload New Logo</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#25C9C8]/50 bg-[#94EFEE]/10 p-8 transition hover:bg-[#94EFEE]/20">
          <UploadCloud className="mb-2 text-[#008B8B]" size={32} />
          <span className="text-sm font-medium text-slate-600">Click to browse or drag and drop</span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {preview && (
          <div className="mt-6">
            <h2 className="mb-4 text-sm font-bold text-slate-700">Preview</h2>
            <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 shadow-inner">
              <Image src={preview} alt="Preview" width={80} height={80} className="object-cover" />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Logo"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}