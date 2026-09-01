"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

// --- Translations Dictionary ---
const translations = {
  my: {
    loginRequired: "မဲပေးရန်အတွက် ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။",
    loginBtn: "အကောင့်ဝင်မည်",
    logoutBtn: "ထွက်မည်",
    votedMsg: "ကျေးဇူးတင်ပါသည်။ သင် မဲပေးပြီးပါပြီ။",
    votesRemaining: "သင် မဲ (၁) မဲ ပေးနိုင်ပါသည်။ ပြင်ဆင်၍မရပါ။",
    voteBtn: "မဲပေးမည်",
    votedBtn: "မဲပေးပြီးပါပြီ",
    votingBtn: "မဲပေးနေပါသည်...",
    confirmVote: "သေချာပါသလား? သင် မဲတစ်မဲသာ ပေးခွင့်ရှိပြီး နောက်ပိုင်းတွင် ပြင်ဆင်၍မရပါ။",
    successMsg: "🎉 သင်၏ မဲကို အောင်မြင်စွာ မှတ်တမ်းတင်ပြီးပါပြီ!",
    tools: "အသုံးပြုထားသော နည်းပညာများ",
    by: "ရေးသားသူ - ",
    noProjects: "ယခုလောလောဆယ် ပြသရန် ပရောဂျက် မရှိသေးပါ။",
    modalTitle: "မဲပေးရန် အတည်ပြုပါ",
    modalCancel: "ပယ်ဖျက်မည်",
    modalConfirm: "အတည်ပြုမည်",
    votingClosed: "မဲပေးချိန် ပြီးဆုံးသွားပါပြီ သို့မဟုတ် မစတင်သေးပါ။",
  },
  en: {
    loginRequired: "Please log in to cast your vote.",
    loginBtn: "Sign In",
    logoutBtn: "Log Out",
    votedMsg: "Thank you! Your vote has been recorded.",
    votesRemaining: "You have 1 vote remaining. Cannot be undone.",
    voteBtn: "Vote",
    votedBtn: "Vote Cast",
    votingBtn: "Voting...",
    confirmVote: "Are you sure? You can only cast ONE vote and it cannot be undone.",
    successMsg: "🎉 Your vote has been cast successfully!",
    tools: "Tools Used",
    by: "By: ",
    noProjects: "No projects have been submitted yet. Check back soon!",
    modalTitle: "Confirm Your Vote",
    modalCancel: "Cancel",
    modalConfirm: "Confirm Vote",
    votingClosed: "Voting is currently closed or has not started yet.",
  }
};

export default function VoterDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // --- States ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voteMessage, setVoteMessage] = useState({ type: "", text: "" });
  const [votingForId, setVotingForId] = useState<string | null>(null);
  
  // Local state to instantly track if the user has voted (fixes the re-login issue)
  const [hasVotedLocal, setHasVotedLocal] = useState(false);

  // Custom Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Voting Time Schedule State
  const [isVotingTimeOpen, setIsVotingTimeOpen] = useState(true); // Default open until settings load
  const [isCheckingTime, setIsCheckingTime] = useState(true);
  
  // --- Settings States ---
  const [lang, setLang] = useState<"my" | "en">("my"); 
  const [isDark, setIsDark] = useState(false); 
  const t = translations[lang];

  // Helper function to sort projects max to min
  const sortProjects = (data: Project[]) => {
    return [...data].sort((a, b) => b.voteCount - a.voteCount);
  };

  // Sync local vote state with NextAuth session on load
  useEffect(() => {
    if (session?.user && (session.user as any).hasVoted) {
      setHasVotedLocal(true);
    }
  }, [session]);

  // Fetch projects and schedule settings on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Projects
        const projRes = await fetch("/api/vote/projects");
        const projData = await projRes.json();
        if (projRes.ok) {
          setProjects(sortProjects(projData));
        }

        // 2. Fetch Voting Schedule Settings
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
        setIsCheckingTime(false);
      }
    };
    fetchData();
  }, []);

  // Determine user voting eligibility (using the instant local state)
  const user = session?.user as any;
  const isVoteUser = user?.isVoteSystem;
  const userRole = user?.role;
  const canVote = isVoteUser && userRole === "VOTER" && !hasVotedLocal && isVotingTimeOpen;

  // Open custom confirmation modal
  const handleVoteClick = (projectId: string) => {
    if (!isVotingTimeOpen) {
      setVoteMessage({ type: "error", text: t.votingClosed });
      return;
    }
    setSelectedProjectId(projectId);
    setIsModalOpen(true);
  };

  // Execute vote after confirmation
  const executeVote = async () => {
    if (!selectedProjectId) return;
    
    setIsModalOpen(false);
    setVotingForId(selectedProjectId);
    setVoteMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/vote/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Voting failed.");

      setVoteMessage({ type: "success", text: t.successMsg });
      
      // INSTANT UI UPDATE: Set local state to true so buttons change immediately
      setHasVotedLocal(true);

      // Update UI instantly and resort max to min
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p._id === selectedProjectId ? { ...p, voteCount: p.voteCount + 1 } : p
        );
        return sortProjects(updated);
      });

      // Silently update the NextAuth session state in the background
      await update({ ...session, user: { ...user, hasVoted: true } });
      router.refresh();
    } catch (error: any) {
      setVoteMessage({ type: "error", text: error.message });
    } finally {
      setVotingForId(null);
      setSelectedProjectId(null);
    }
  };

  return (
    <div className={`${isDark ? "dark" : ""} h-screen overflow-hidden`}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        
        {/* --- Top Navigation Bar (Fixed Height) --- */}
        <nav className="flex-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-extrabold text-lg">U</span>
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block">UCSH Voting</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === "my" ? "en" : "my")}
                className="flex items-center justify-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {lang === "my" ? "EN" : "မြန်မာ"}
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
              </button>

              {/* Login / Logout Button */}
              {status === "authenticated" ? (
                <button 
                  onClick={() => signOut({ callbackUrl: "/vote" })}
                  className="text-sm font-bold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  {t.logoutBtn}
                </button>
              ) : (
                <Link 
                  href="/vote/login"
                  className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                >
                  {t.loginBtn}
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* --- Main Scrollable Content --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[90rem] mx-auto">
            
            {/* Status Indicator (Centered at top) */}
            <div className="flex justify-center mb-8">
              {!session ? (
                <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl shadow-sm text-sm font-bold border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  <span className="mr-3">{t.loginRequired}</span>
                  <Link href="/vote/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                    {t.loginBtn} &rarr;
                  </Link>
                </div>
              ) : !isVotingTimeOpen ? (
                <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl shadow-sm text-sm font-bold border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                  {t.votingClosed}
                </div>
              ) : hasVotedLocal ? (
                <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl shadow-sm text-sm font-bold border bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  {t.votedMsg}
                </div>
              ) : userRole === "VOTER" ? (
                <div className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl shadow-sm text-sm font-bold border bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400">
                  <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  {t.votesRemaining}
                </div>
              ) : null}
            </div>

            {/* Feedback Message (Post-vote) */}
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
                      
                      {/* Live Vote Badge */}
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
                      
                      <div className="mb-6 flex-none">
                        <div className="flex flex-wrap gap-1.5">
                          {project.languagesAndTools.slice(0, 3).map((tool, idx) => (
                            <span key={idx} className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 truncate max-w-[80px]">
                              {tool}
                            </span>
                          ))}
                          {project.languagesAndTools.length > 3 && (
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium px-1 py-0.5">+{project.languagesAndTools.length - 3}</span>
                          )}
                        </div>
                      </div>

                      {/* Voting Button Area */}
                      <button
                        onClick={() => handleVoteClick(project._id)}
                        disabled={!canVote || votingForId === project._id}
                        className={`flex-none w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm flex justify-center items-center gap-1.5 border ${
                          votingForId === project._id 
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 cursor-wait border-blue-200 dark:border-blue-800"
                            : canVote
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent hover:shadow transform hover:-translate-y-0.5"
                            : hasVotedLocal
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 cursor-not-allowed"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                        }`}
                      >
                        {votingForId === project._id ? (
                          <span className="animate-pulse">{t.votingBtn}</span>
                        ) : hasVotedLocal ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            {t.votedBtn}
                          </>
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