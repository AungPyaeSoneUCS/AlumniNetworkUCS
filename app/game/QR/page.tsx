// file: app/game/QR/page.tsx
"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Link as LinkIcon, QrCode, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function QRGenerator() {
  const [url, setUrl] = useState("https://alumni.ucsh.edu.mm");
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animations after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Function to handle downloading the QR code as a PNG image
  const handleDownload = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
      
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "ucsh-qr-code.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Shared design classes for both the QR Container and Download Button
  const sharedBlockDesign = "w-full flex items-center justify-center p-6 sm:p-8 bg-slate-950/60 rounded-2xl border border-slate-800 shadow-inner transition-all duration-300";

  return (
    <main className="min-h-[100dvh] sm:h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 font-sans overflow-hidden relative selection:bg-rose-500/30">
      
      {/* Background Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-20 animate-[pulse_4s_ease-in-out_infinite]" />
      </div>

      {/* Absolute Back Button (Top Left) */}
      <div className={`absolute top-6 left-6 z-20 transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <Link 
          href="/game"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all text-xs sm:text-sm font-bold tracking-widest uppercase backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Menu</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Main Glassmorphism Card */}
      <div className={`relative z-10 max-w-sm sm:max-w-md w-full transition-all duration-700 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
        
        <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-[0_0_40px_rgba(244,63,94,0.05)] p-5 sm:p-8 space-y-5 sm:space-y-6 border border-rose-500/10">
          
          {/* Input Section */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
            </div>
            <input
              type="url"
              className="block w-full pl-11 pr-4 py-4 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all text-slate-200 bg-slate-950/60 placeholder:text-slate-600 shadow-inner text-sm sm:text-base"
              placeholder="https://alumni.ucsh.edu.mm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* QR Code Preview Section (Using Shared Design) */}
          <div className={`${sharedBlockDesign} flex-col relative group overflow-hidden`}>
            {/* Subtle hover glow behind the QR */}
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {url ? (
              <div className="p-3 sm:p-4 bg-white rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-4 ring-slate-900 relative z-10 transition-transform duration-300 hover:scale-105">
                <QRCodeCanvas
                  id="qr-canvas"
                  value={url}
                  size={180}
                  bgColor={"#ffffff"}
                  fgColor={"#020617"} 
                  level={"H"}         
                  includeMargin={false}
                  style={{ width: '100%', height: 'auto', maxWidth: '180px' }}
                />
              </div>
            ) : (
              <div className="h-[180px] w-[180px] flex flex-col items-center justify-center bg-slate-900/80 rounded-xl text-slate-600 space-y-3 relative z-10 border border-slate-800 border-dashed">
                <QrCode className="w-10 h-10 opacity-30" />
                <span className="text-xs font-bold tracking-widest uppercase text-center px-4">Awaiting Uplink</span>
              </div>
            )}
          </div>

          {/* Download Button (Using Shared Design) */}
          <button
            onClick={handleDownload}
            disabled={!url}
            className={`
              ${sharedBlockDesign}
              gap-3 
              hover:bg-rose-950/20 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(225,29,72,0.15)]
              text-slate-400 hover:text-rose-400
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-950/60 disabled:hover:border-slate-800 disabled:hover:shadow-inner disabled:hover:text-slate-400
              active:scale-[0.98]
            `}
          >
            <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase">
              Download QR
            </span>
          </button>

        </div>
      </div>
    </main>
  );
}