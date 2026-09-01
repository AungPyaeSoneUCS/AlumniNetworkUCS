"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminNav from "@/app/vote/components/AdminNav"; // Ensure this path is correct

// Define TypeScript type for the project data
type Project = {
  _id: string;
  title: string;
  description: string;
  languagesAndTools: string[];
  photos: string[];
  voteCount: number;
  teamId: { name: string };
};

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
    guestMode: "ဧည့်သည်အဖြစ် မဲပေးနေပါသည် (Admin View)",
    continuousVoting: "မဲပေးနိုင်သောစနစ် ဖွင့်ထားပါသည်။ (Kiosk Mode)",
    voteBtn: "မဲပေးမည်",
    votingBtn: "မဲပေးနေပါသည်...",
    confirmVote: "အတည်ပြုပါသလား? ဤပရောဂျက်အတွက် မဲပေးမည်မှာ သေချာပါသလား?",
    successMsg: "🎉 မဲကို အောင်မြင်စွာ မှတ်တမ်းတင်ပြီးပါပြီ!",
    tools: "အသုံးပြုထားသော နည်းပညာများ",
    by: "ရေးသားသူ - ",
    noProjects: "ယခုလောလောဆယ် ပြသရန် ပရောဂျက် မရှိသေးပါ။",
    modalTitle: "မဲပေးရန် အတည်ပြုပါ",
    modalCancel: "ပယ်ဖျက်မည်",
    modalConfirm: "အတည်ပြုမည်",
    votingClosed: "မဲပေးချိန် ပြီးဆုံးသွားပါပြီ သို့မဟုတ် မစတင်သေးပါ။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
  },
  en: {
    guestMode: "Voting as Guest (Admin View)",
    continuousVoting: "Continuous Voting (Kiosk Mode) is Enabled.",
    voteBtn: "Vote",
    votingBtn: "Voting...",
    confirmVote: "Are you sure you want to cast a guest vote for this project?",
    successMsg: "🎉 Your vote has been cast successfully!",
    tools: "Tools Used",
    by: "By: ",
    noProjects: "No projects have been submitted yet. Check back soon!",
    modalTitle: "Confirm Your Vote",
    modalCancel: "Cancel",
    modalConfirm: "Confirm Vote",
    votingClosed: "Voting is currently closed or has not started yet.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
  }
};

export default function AdminGuestViewDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- States ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voteMessage, setVoteMessage] = useState({ type: "", text: "" });
  const [votingForId, setVotingForId] = useState<string | null>(null);

  // Custom Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Voting Time Schedule State
  const [isVotingTimeOpen, setIsVotingTimeOpen] = useState(true); 
  
  // --- Settings States ---
  const [lang, setLang] = useState<"my" | "en">("my"); 
  const [isDark, setIsDark] = useState(false); 
  const t = translations[lang];

  // ==========================================
  // 1. Admin Authentication Check
  // ==========================================
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/vote/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "ADMIN") {
        router.push("/vote/dashboard"); // Redirect normal users away
      }
    }
  }, [status, session, router]);

  // ==========================================
  // 2. Fetch Projects and Schedule
  // ==========================================
  const sortProjects = (data: Project[]) => {
    return [...data].sort((a, b) => b.voteCount - a.voteCount);
  };

  useEffect(() => {
    // Only fetch if authenticated as admin
    if (status !== "authenticated" || (session?.user as any)?.role !== "ADMIN") return;

    const fetchData = async () => {
      try {
        const projRes = await fetch("/api/vote/projects");
        const projData = await projRes.json();
        if (projRes.ok) {
          setProjects(sortProjects(projData));
        }

        const settingsRes = await fetch("/api/vote/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.startDate && settingsData.endDate) {
            const now = new Date().getTime();
            const start = new Date(settingsData.startDate).getTime();
            const end = new Date(settingsData.endDate).getTime();
            setIsVotingTimeOpen(now >= start && now <= end);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [status, session]);

  // Allow voting as long as time is open (Continuous mode ignores local storage locks)
  const canVote = isVotingTimeOpen;

  const handleVoteClick = (projectId: string) => {
    if (!isVotingTimeOpen) {
      setVoteMessage({ type: "error", text: t.votingClosed });
      return;
    }

    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  const executeVote = async () => {
    if (!selectedProjectId) return;
    
    setIsModalOpen(false);
    setVotingForId(selectedProjectId);
    setVoteMessage({ type: "", text: "" });

    try {
      // Calling the dedicated guest API endpoint
      const res = await fetch("/api/vote/guest-cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Voting failed.");

      setVoteMessage({ type: "success", text: t.successMsg });
      
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p._id === selectedProjectId ? { ...p, voteCount: p.voteCount + 1 } : p
        );
        return sortProjects(updated);
      });

      // Auto-clear the success message after 3 seconds so the tablet is ready for the next person
      setTimeout(() => {
        setVoteMessage({ type: "", text: "" });
      }, 3000);
      
      router.refresh();
    } catch (error: any) {
      setVoteMessage({ type: "error", text: error.message });
      setTimeout(() => setVoteMessage({ type: "", text: "" }), 4000);
    } finally {
      setVotingForId(null);
      setSelectedProjectId(null);
    }
  };

  // Show nothing/loading while checking session to prevent flicker
  if (status === "loading") {
    return (
      <div className={`h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  // --- 2. Auth Protection Display ---
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" || !user?.isVoteSystem) {
    return (
      <div className={`${isDark ? "dark" : ""}`}>
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-700">
            <h1 className="text-2xl font-bold text-white mb-2">{t.accessRestricted}</h1>
            <p className="text-gray-400 mb-8">{t.loginRequired}</p>
            <Link href="/vote/admin/login" className="w-full block py-3 px-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors">
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
        
        {/* Render Reusable Admin Navbar */}
        <AdminNav 
          lang={lang} 
          setLang={setLang} 
          isDark={isDark} 
          setIsDark={setIsDark} 
          user={user} 
        />

        {/* --- Main Content --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[90rem] mx-auto">
            
            {/* Status Indicator */}
            <div className="flex justify-center mb-8">
              {!isVotingTimeOpen ? (
                <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl shadow-sm text-sm font-bold border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  {t.votingClosed}
                </div>
              ) : (
                <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl shadow-sm text-sm font-bold border bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-400">
                  <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  {t.continuousVoting}
                </div>
              )}
            </div>

            {/* Feedback Message */}
            {voteMessage.text && (
              <div className={`max-w-3xl mx-auto p-3 mb-8 text-center text-sm font-bold rounded-lg shadow-sm border ${
                voteMessage.type === "success" 
                  ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" 
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
              }`}>
                {voteMessage.text}
              </div>
            )}

            {/* --- Projects Grid --- */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm max-w-3xl mx-auto">
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t.noProjects}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
                {projects.map((project) => (
                  <div key={project._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
                    
                    {/* Image Section */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative group overflow-hidden flex-none">
                      {project.photos && project.photos.length > 0 ? (
                        <img
                          src={project.photos[0]}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white font-bold px-2 py-1 rounded-lg shadow flex items-center gap-1 text-xs border border-gray-200 dark:border-gray-700">
                        <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        {project.voteCount}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="mb-3">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">{project.title}</h2>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 line-clamp-1">
                          {t.by} {project.teamId?.name || "Unknown Team"}
                        </p>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 flex-grow line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Voting Button Area */}
                      <button
                        onClick={() => handleVoteClick(project._id)}
                        disabled={!canVote || votingForId === project._id}
                        className={`flex-none w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm flex justify-center items-center gap-1.5 border ${
                          votingForId === project._id 
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 cursor-wait border-blue-200 dark:border-blue-800"
                            : canVote
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent hover:shadow transform hover:-translate-y-0.5"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                        }`}
                      >
                        {votingForId === project._id ? (
                          <span className="animate-pulse">{t.votingBtn}</span>
                        ) : (
                          t.voteBtn
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* --- Custom Confirm Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.modalTitle}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {t.confirmVote}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedProjectId(null);
                }} 
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {t.modalCancel}
              </button>
              <button 
                onClick={executeVote} 
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {t.modalConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}