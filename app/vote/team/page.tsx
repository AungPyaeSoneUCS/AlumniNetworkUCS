// file: app/vote/team/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Project = {
  _id: string;
  title: string;
  description: string;
  languagesAndTools: string[];
  photos: string[];
  voteCount: number;
};

// --- Translations Dictionary ---
const translations = {
  my: {
    portalName: "အဖွဲ့ ပေါ်တယ်",
    publicShowcase: "အများပြည်သူ ကြည့်ရှုရန်",
    logoutBtn: "ထွက်မည်",
    title: "အဖွဲ့ ဒက်ရှ်ဘုတ်",
    subtitle: "သင့်ပရောဂျက်ကို တင်သွင်းရန် သို့မဟုတ် စီမံရန်နှင့် လက်ရှိမဲအရေအတွက်ကို ကြည့်ရှုပါ။",
    submittedProject: "တင်သွင်းထားသော ပရောဂျက်",
    currentVotes: "လက်ရှိ မဲအရေအတွက်",
    description: "ဖော်ပြချက်",
    tools: "အသုံးပြုထားသော နည်းပညာများ",
    screenshots: "မျက်နှာပြင်ပုံများ",
    editBtn: "ပရောဂျက်ကို ပြင်ဆင်မည်",
    editTitle: "သင့်ပရောဂျက်ကို ပြင်ဆင်မည်",
    submitTitle: "သင့်ပရောဂျက်ကို တင်သွင်းမည်",
    cancelBtn: "ပယ်ဖျက်မည်",
    formTitle: "ပရောဂျက် အမည်",
    formTitlePlaceholder: "ဥပမာ - UCSH Smart Campus App",
    formDesc: "ပရောဂျက် ဖော်ပြချက်",
    formDescPlaceholder: "သင့်ပရောဂျက်၏ လုပ်ဆောင်ချက်များကို ရှင်းပြပါ...",
    formTools: "နည်းပညာများ (ကော်မာဖြင့် ခြားပါ)",
    formToolsPlaceholder: "React, Node.js, MongoDB, Tailwind",
    formImages: "ပရောဂျက် ပုံလင့်ခ်များ (URLs)",
    formImagePlaceholder: "https://example.com/screenshot.png",
    addMoreBtn: "+ ပုံလင့်ခ် အသစ်ထည့်မည်",
    savingBtn: "သိမ်းဆည်းနေပါသည်...",
    updateBtn: "ပရောဂျက်ကို ပြင်ဆင်မည်",
    submitBtn: "ပရောဂျက်ကို တင်သွင်းမည်",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် ပရောဂျက်အဖွဲ့ အဖြစ် အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အကောင့်ဝင်ရန်",
  },
  en: {
    portalName: "Team Portal",
    publicShowcase: "Public Showcase",
    logoutBtn: "Log Out",
    title: "Team Dashboard",
    subtitle: "Submit or manage your project submission and view live analytics.",
    submittedProject: "Submitted Project",
    currentVotes: "Current Votes",
    description: "Description",
    tools: "Languages & Tools",
    screenshots: "Screenshots",
    editBtn: "Edit Project Details",
    editTitle: "Edit Your Project",
    submitTitle: "Submit Your Project",
    cancelBtn: "Cancel",
    formTitle: "Project Title",
    formTitlePlaceholder: "e.g., UCSH Smart Campus App",
    formDesc: "Project Description",
    formDescPlaceholder: "Explain your project features and technical architecture...",
    formTools: "Languages & Tools (Comma-separated)",
    formToolsPlaceholder: "React, Node.js, MongoDB, Tailwind",
    formImages: "Project Image URLs",
    formImagePlaceholder: "https://example.com/screenshot.png",
    addMoreBtn: "+ Add another image URL",
    savingBtn: "Saving...",
    updateBtn: "Update Project",
    submitBtn: "Submit Project",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be logged in as a Project Team.",
    goLogin: "Go to Login",
  }
};

export default function TeamDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Project state
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([""]);

  // UI feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- Settings States ---
  const [lang, setLang] = useState<"my" | "en">("my"); // Default to Myanmar
  const [isDark, setIsDark] = useState(false); // Default to Day mode
  const t = translations[lang];

  // Fetch team's submitted project on load
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchTeamProject = async () => {
      try {
        const res = await fetch("/api/vote/projects");
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          const userId = (session?.user as any)?.id;
          // Find the project belonging to this logged-in team
          const myProject = data.find((p: any) => p.teamId?._id === userId || p.teamId === userId);
          
          if (myProject) {
            setProject(myProject);
            setTitle(myProject.title);
            setDescription(myProject.description);
            setLanguagesInput(myProject.languagesAndTools.join(", "));
            setPhotoUrls(myProject.photos.length > 0 ? myProject.photos : [""]);
          }
        }
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchTeamProject();
  }, [status, session]);

  // Helper to update specific photo inputs
  const handlePhotoChange = (index: number, value: string) => {
    const newPhotos = [...photoUrls];
    newPhotos[index] = value;
    setPhotoUrls(newPhotos);
  };

  const addPhotoInput = () => {
    setPhotoUrls([...photoUrls, ""]);
  };

  const removePhotoInput = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  // Handle Submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    const languagesAndTools = languagesInput
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const cleanPhotos = photoUrls.filter((url) => url.trim() !== "");

    try {
      const method = project ? "PUT" : "POST";
      const res = await fetch("/api/vote/projects", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          languagesAndTools,
          photos: cleanPhotos,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to save project.");

      setProject(data.project);
      setMessage({ type: "success", text: data.message || "Success!" });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- 1. Loading State ---
  if (status === "loading" || isLoadingProject) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  // --- 2. Auth Protection ---
  const user = session?.user as any;
  if (!session || user?.role !== "TEAM" || !user?.isVoteSystem) {
    return (
      <div className={`${isDark ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.accessRestricted}</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{t.loginRequired}</p>
            <Link href="/vote/login" className="w-full block py-3 px-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md">
              {t.goLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isDark ? "dark" : ""} h-screen overflow-hidden`}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        
        {/* --- Top Navigation Bar --- */}
        <nav className="flex-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-extrabold text-lg">T</span>
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">
                {t.portalName} <span className="text-purple-600 dark:text-purple-400 font-medium">({user.name})</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "my" ? "en" : "my")}
                className="hidden sm:flex items-center justify-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {lang === "my" ? "EN" : "မြန်မာ"}
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
              </button>

              <Link href="/vote/dashboard" className="hidden md:block text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {t.publicShowcase}
              </Link>
              
              <button 
                onClick={() => signOut({ callbackUrl: "/vote" })}
                className="text-sm font-bold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
              >
                {t.logoutBtn}
              </button>
            </div>
          </div>
        </nav>

        {/* --- Main Scrollable Content --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto pb-20">

            {message.text && (
              <div className={`p-4 mb-8 rounded-xl text-sm font-bold shadow-sm border ${
                message.type === "success" 
                  ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
              }`}>
                {message.text}
              </div>
            )}

            {/* IF PROJECT EXISTS AND NOT EDITING -> SHOW SUBMITTED CARD */}
            {project && !isEditing ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                
                {/* Header Banner with Vote Count */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-700 dark:to-indigo-800 p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <span className="bg-white/20 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 inline-block">
                      {t.submittedProject}
                    </span>
                    <h2 className="text-3xl font-black">{project.title}</h2>
                  </div>
                  
                  {/* Vote Count Badge */}
                  <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shadow-inner min-w-[120px]">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-purple-200 mb-1">{t.currentVotes}</p>
                    <p className="text-4xl font-black text-yellow-300">{project.voteCount}</p>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-2">{t.description}</h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-3">{t.tools}</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.languagesAndTools.map((tool, idx) => (
                        <span key={idx} className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold text-xs px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-500/20 shadow-sm">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  {project.photos && project.photos.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider mb-3">{t.screenshots}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {project.photos.map((photo, idx) => (
                          <div key={idx} className="h-48 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-sm">
                            <img src={photo} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="py-3 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {t.editBtn}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SUBMISSION / EDIT FORM */
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 transition-colors">
                <div className="flex justify-between items-center mb-8 border-b border-gray-100 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project ? t.editTitle : t.submitTitle}
                  </h2>
                  {project && (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg"
                    >
                      {t.cancelBtn}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.formTitle}</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
                      placeholder={t.formTitlePlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.formDesc}</label>
                    <textarea
                      required
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
                      placeholder={t.formDescPlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.formTools}</label>
                    <input
                      type="text"
                      value={languagesInput}
                      onChange={(e) => setLanguagesInput(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all"
                      placeholder={t.formToolsPlaceholder}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.formImages}</label>
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      {photoUrls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handlePhotoChange(index, e.target.value)}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm shadow-sm"
                            placeholder={t.formImagePlaceholder}
                          />
                          {photoUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePhotoInput(index)}
                              className="px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/50 rounded-lg font-bold transition-colors shadow-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addPhotoInput}
                        className="mt-2 inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-bold px-2 py-1 rounded-md transition-colors"
                      >
                        {t.addMoreBtn}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-4 px-4 text-white font-bold rounded-xl shadow-lg transition-all duration-200 flex justify-center items-center ${
                        isLoading
                          ? "bg-purple-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transform hover:-translate-y-0.5"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          {t.savingBtn}
                        </>
                      ) : project ? t.updateBtn : t.submitBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}