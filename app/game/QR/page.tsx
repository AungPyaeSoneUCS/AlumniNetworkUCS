"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Link as LinkIcon, QrCode } from "lucide-react";

export default function QRGenerator() {
  const [url, setUrl] = useState("https://alumna.ucsh.edu.mm");

  // Function to handle downloading the QR code as a PNG image
  const handleDownload = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    // Convert the canvas to a data URL
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
      
    // Create a temporary link element to trigger the download
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "my-qr-code.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-8 border border-slate-100">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <QrCode className="text-blue-600 w-7 h-7" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Input Section */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="url"
              className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 bg-slate-50/50"
              placeholder="https://alumna.ucsh.edu.mm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* QR Code Preview Section */}
          <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            {url ? (
              <div className="p-4 bg-white rounded-xl shadow-sm ring-1 ring-slate-100">
                <QRCodeCanvas
                  id="qr-canvas"
                  value={url}
                  size={220}
                  bgColor={"#ffffff"}
                  fgColor={"#0f172a"} // Slate-900 for a softer black
                  level={"H"}         // High error correction
                  includeMargin={false}
                />
              </div>
            ) : (
              <div className="h-[220px] w-[220px] flex flex-col items-center justify-center bg-slate-100/50 rounded-xl text-slate-400 space-y-2">
                <QrCode className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">Awaiting URL...</span>
              </div>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!url}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-xl font-medium transition-all active:scale-[0.98] shadow-sm hover:shadow-md disabled:shadow-none"
          >
            <Download className="w-5 h-5" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </main>
  );
}