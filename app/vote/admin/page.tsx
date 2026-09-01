"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import * as XLSX from "xlsx";
import AdminNav from "@/app/vote/components/AdminNav"; // Adjust path if needed

type Project = {
  _id: string;
  title: string;
  voteCount: number;
  teamId: { name: string };
};

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
    title: "မဲရလဒ်များ (တိုက်ရိုက်)",
    subtitle: "မဲရလဒ်များကို အများဆုံးမှ အနည်းဆုံးသို့ အလိုအလျောက် စဉ်ပြထားပါသည်။",
    rank: "အဆင့်",
    project: "ပရောဂျက် အမည်",
    team: "အဖွဲ့ အမည်",
    votes: "ရရှိသော မဲ",
    totalVotes: "စုစုပေါင်း ပေးထားသော မဲ",
    noProjects: "ယခုလောလောဆယ် ပြသရန် ပရောဂျက် မရှိသေးပါ။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
    exportBtn: "Excel ဆွဲထုတ်မည်",
  },
  en: {
    title: "Live Voting Results",
    subtitle: "Real-time voting results automatically sorted from highest to lowest.",
    rank: "Rank",
    project: "Project Title",
    team: "Team Name",
    votes: "Votes Cast",
    totalVotes: "Total System Votes",
    noProjects: "No projects have been submitted yet.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
    exportBtn: "Export Excel",
  }
};

export default function AdminResultsPage() {
  const { data: session, status } = useSession();

  // --- States ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // Fetch and sort projects (with live polling)
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const fetchProjects = async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const res = await fetch("/api/vote/projects");
        const data = await res.json();
        if (res.ok) {
          const sorted = data.sort((a: Project, b: Project) => b.voteCount - a.voteCount);
          setProjects(sorted);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    };
    
    fetchProjects(true);

    const intervalId = setInterval(() => {
      fetchProjects(false);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [status]);

  // --- Export Handler ---
  const handleExportExcel = () => {
    if (projects.length === 0) return;
    
    const exportData = projects.map((p, i) => ({
      [t.rank]: i + 1,
      [t.project]: p.title,
      [t.team]: p.teamId?.name || "Unknown Team",
      [t.votes]: p.voteCount
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "Voting_Results.xlsx");
  };

  // --- 1. Loading State ---
  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- 2. Auth Protection ---
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
    <div className={`${isDark ? "dark" : ""} h-screen flex flex-col overflow-hidden print:h-auto print:overflow-visible`}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 print:bg-white print:text-black">
        
        {/* Render Reusable Admin Navbar */}
        <AdminNav 
          lang={lang} 
          setLang={setLang} 
          isDark={isDark} 
          setIsDark={setIsDark} 
          user={user} 
        />

        {/* --- Main Scrollable Content --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0">
          <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 print:pb-0">
            
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 print:mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-gray-600 dark:text-gray-400 font-medium print:hidden">{t.subtitle}</p>

                  <span className="flex h-3 w-3 relative mt-1 print:hidden">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {!isLoading && projects.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center px-6 transition-colors print:hidden">
                    <div className="text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mb-0.5">
                        {t.totalVotes}
                      </p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {projects.reduce((acc, curr) => acc + curr.voteCount, 0)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Export Button */}
                <button 
                  onClick={handleExportExcel}
                  disabled={projects.length === 0}
                  className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span className="hidden sm:inline">{t.exportBtn}</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20 print:hidden">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm transition-colors print:hidden">
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t.noProjects}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors print:shadow-none print:border-none print:rounded-none">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 print:divide-black">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 transition-colors print:bg-white print:text-black">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.rank}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.project}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.team}</th>
                        <th className="px-6 py-5 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.votes}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                      {projects.map((proj, idx) => (
                        <tr key={proj._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:bg-white print:text-black">
                          <td className="px-6 py-5 whitespace-nowrap">
                            {idx === 0 ? (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 font-black text-xl border-2 border-yellow-300 dark:border-yellow-600 shadow-sm print:bg-white print:text-black print:border-gray-500">1</span>
                            ) : idx === 1 ? (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-black text-xl border-2 border-gray-300 dark:border-gray-500 shadow-sm print:bg-white print:text-black print:border-gray-500">2</span>
                            ) : idx === 2 ? (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-500 font-black text-xl border-2 border-amber-300 dark:border-amber-700 shadow-sm print:bg-white print:text-black print:border-gray-500">3</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400 font-bold text-lg print:text-black">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-gray-900 dark:text-white text-lg print:text-black">{proj.title}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 inline-block px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors print:bg-white print:text-black print:border-none print:p-0">
                              {proj.teamId?.name || "Unknown Team"}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-black text-2xl border border-blue-200 dark:border-blue-800 transition-colors print:bg-white print:text-black print:border-none print:p-0">
                              {proj.voteCount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}