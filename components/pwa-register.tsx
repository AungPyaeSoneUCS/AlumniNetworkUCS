// file: components/pwa-register.tsx

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Share,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

import { useI18n } from "@/components/providers";

type DialogMode =
  | null
  | "install-confirm"
  | "installing"
  | "install-help"
  | "success"
  | "uninstall-confirm"
  | "uninstalling"
  | "uninstalled";

function subscribeDisplayMode(callback: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getDisplayModeSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

function getDisplayModeServerSnapshot() {
  return false;
}

const installText = {
  en: {
    install: "Install PWA App",
    installTitle: "Install Alumni Network",
    installText:
      "Add the app to your device for a full-screen, offline-ready experience.",
    cancel: "Cancel",
    confirm: "Install",
    installingTitle: "Installing...",
    installingText: "Please wait while the app is being installed.",
    helpTitle: "Install Alumni Network",
    helpIntro:
      "Your browser does not support one-tap install. Follow these steps instead:",
    androidStep: "Tap the browser menu",
    androidStep2: 'and choose "Install app" or "Add to Home screen".',
    iosStep: "Tap the Share button",
    iosStep2: 'and choose "Add to Home Screen".',
    gotIt: "Got it",
    successTitle: "Installation started",
    successText: "Alumni Network is being added to your device.",
    installed: "App Installed",
    uninstall: "Uninstall",
    uninstallTitle: "Uninstall App?",
    uninstallText:
      "This clears the app's offline data from this browser. You may also need to remove the app icon from your device.",
    uninstallingTitle: "Removing...",
    uninstallingText: "Clearing the app's offline data.",
    uninstalledTitle: "App data removed",
    uninstalledText:
      "To finish uninstalling, remove the Alumni Network icon from your home screen or app list.",
  },
  mm: {
    install: "PWA App ထည့်သွင်းမည်",
    installTitle: "Alumni Network ထည့်သွင်းရန်",
    installText:
      "အပြည့်အဝနှင့် အင်တာနက်မလိုဘဲ အသုံးပြုနိုင်ရန် app ကို သင့်စက်ထဲ ထည့်သွင်းပါ။",
    cancel: "မလုပ်တော့ပါ",
    confirm: "ထည့်သွင်းမည်",
    installingTitle: "ထည့်သွင်းနေသည်...",
    installingText: "App ကို ထည့်သွင်းနေပါသည်။ ခဏစောင့်ပါ။",
    helpTitle: "Alumni Network ထည့်သွင်းရန်",
    helpIntro:
      "သင့် browser သည် တစ်ချက်နှိပ်ထည့်သွင်းမှုကို မပံ့ပိုးပါ။ အောက်ပါအတိုင်း လုပ်ဆောင်ပါ -",
    androidStep: "Browser menu ကို နှိပ်ပါ",
    androidStep2: 'ပြီးလျှင် "Install app" သို့မဟုတ် "Add to Home screen" ကို ရွေးပါ။',
    iosStep: "Share button ကို နှိပ်ပါ",
    iosStep2: 'ပြီးလျှင် "Add to Home Screen" ကို ရွေးပါ။',
    gotIt: "နားလည်ပါပြီ",
    successTitle: "ထည့်သွင်းမှု စတင်ပါပြီ",
    successText: "Alumni Network ကို သင့်စက်ထဲ ထည့်သွင်းနေပါသည်။",
    installed: "App ထည့်သွင်းပြီးပါပြီ",
    uninstall: "ဖယ်ရှားမည်",
    uninstallTitle: "App ကို ဖယ်ရှားမည်လား?",
    uninstallText:
      "ဤ browser ထဲမှ app ၏ offline data ကို ရှင်းလင်းပါမည်။ ထို့အပြင် သင့်စက်ပေါ်ရှိ app icon ကိုလည်း ဖယ်ရှားရန် လိုအပ်နိုင်ပါသည်။",
    uninstallingTitle: "ဖယ်ရှားနေသည်...",
    uninstallingText: "App ၏ offline data ကို ရှင်းလင်းနေပါသည်။",
    uninstalledTitle: "App data ရှင်းလင်းပြီးပါပြီ",
    uninstalledText:
      "အပြီးသတ်ဖယ်ရှားရန် သင့် home screen သို့မဟုတ် app list မှ Alumni Network icon ကို ဖယ်ရှားပါ။",
  },
};

declare global {
  interface Window {
    deferredPrompt?: {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
  }
}

export default function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Never run the service worker in development: it caches stale chunks
    // and pages, which causes React hydration mismatches. Clean up any
    // previously registered worker and its caches instead.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister()))
        )
        .catch(() => {});
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => {});
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

function CenterDialog({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

export function PwaInstallButton() {
  const { lang } = useI18n();
  const t = installText[lang === "mm" ? "mm" : "en"];

  const [installEvent, setInstallEvent] =
    useState<Window["deferredPrompt"] | null>(null);
  const [mode, setMode] = useState<DialogMode>(null);

  const isIos =
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent);

  const isInstalled = useSyncExternalStore(
    subscribeDisplayMode,
    getDisplayModeSnapshot,
    getDisplayModeServerSnapshot
  );

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      window.deferredPrompt = event as unknown as Window["deferredPrompt"];
      setInstallEvent(window.deferredPrompt);
    };

    const onInstalled = () => setMode("success");

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function confirmInstall() {
    if (!installEvent) {
      setMode("install-help");
      return;
    }

    setMode("installing");
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      window.deferredPrompt = undefined;
      setMode(choice.outcome === "accepted" ? "success" : null);
    } catch {
      setMode("install-help");
    }
  }

  async function confirmUninstall() {
    setMode("uninstalling");
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map((registration) => registration.unregister())
        );
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // ignore — best effort cleanup
    } finally {
      setMode("uninstalled");
    }
  }

  return (
    <>
      {isInstalled ? (
        <>
          <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-6 py-3 text-sm font-black text-emerald-100 shadow-lg backdrop-blur">
            <CheckCircle2 size={18} />
            {t.installed}
          </span>
          <button
            type="button"
            onClick={() => setMode("uninstall-confirm")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/40 bg-red-500/15 px-6 py-3 text-sm font-black text-red-100 shadow-lg backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-red-500/25"
          >
            <Trash2 size={18} />
            {t.uninstall}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setMode("install-confirm")}
          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-6 py-3 text-sm font-black text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <Smartphone size={18} className="transition group-hover:scale-110" />
          {t.install}
        </button>
      )}

      {mode === "install-confirm" && (
        <CenterDialog>
          <div className="relative bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-4">
            <div className="flex items-center gap-2 text-white">
              <Smartphone size={20} />
              <h3 className="text-base font-black">{t.installTitle}</h3>
            </div>
            <button
              type="button"
              aria-label={t.cancel}
              onClick={() => setMode(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              {t.installText}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmInstall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Smartphone size={15} />
                {t.confirm}
              </button>
            </div>
          </div>
        </CenterDialog>
      )}

      {mode === "installing" && (
        <CenterDialog>
          <div className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#94EFEE] text-[#008B8B]">
              <Loader2 size={30} className="animate-spin" />
            </div>
            <h3 className="mt-4 text-lg font-black text-[#008B8B]">
              {t.installingTitle}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t.installingText}
            </p>
          </div>
        </CenterDialog>
      )}

      {mode === "install-help" && (
        <CenterDialog>
          <div className="relative bg-gradient-to-r from-[#00BFC4] to-[#008B8B] px-5 py-4">
            <div className="flex items-center gap-2 text-white">
              <Smartphone size={20} />
              <h3 className="text-base font-black">{t.helpTitle}</h3>
            </div>
            <button
              type="button"
              aria-label={t.gotIt}
              onClick={() => setMode(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              {t.helpIntro}
            </p>
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#94EFEE] text-[#008B8B]">
                {isIos ? <Share size={16} /> : <MoreVertical size={16} />}
              </span>
              <p className="text-sm font-semibold text-slate-700">
                {isIos ? `${t.iosStep} ${t.iosStep2}` : `${t.androidStep} ${t.androidStep2}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {t.gotIt}
            </button>
          </div>
        </CenterDialog>
      )}

      {mode === "success" && (
        <CenterDialog>
          <div className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="mt-4 text-lg font-black text-[#008B8B]">
              {t.successTitle}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t.successText}
            </p>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {t.gotIt}
            </button>
          </div>
        </CenterDialog>
      )}

      {mode === "uninstall-confirm" && (
        <CenterDialog>
          <div className="relative bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle size={20} />
              <h3 className="text-base font-black">{t.uninstallTitle}</h3>
            </div>
            <button
              type="button"
              aria-label={t.cancel}
              onClick={() => setMode(null)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            <p className="text-sm font-medium leading-relaxed text-slate-600">
              {t.uninstallText}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={confirmUninstall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <Trash2 size={15} />
                {t.uninstall}
              </button>
            </div>
          </div>
        </CenterDialog>
      )}

      {mode === "uninstalling" && (
        <CenterDialog>
          <div className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <Loader2 size={30} className="animate-spin" />
            </div>
            <h3 className="mt-4 text-lg font-black text-rose-600">
              {t.uninstallingTitle}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t.uninstallingText}
            </p>
          </div>
        </CenterDialog>
      )}

      {mode === "uninstalled" && (
        <CenterDialog>
          <div className="p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="mt-4 text-lg font-black text-[#008B8B]">
              {t.uninstalledTitle}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {t.uninstalledText}
            </p>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#00BFC4] to-[#008B8B] py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {t.gotIt}
            </button>
          </div>
        </CenterDialog>
      )}
    </>
  );
}