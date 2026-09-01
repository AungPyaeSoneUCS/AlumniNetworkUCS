// file: app/vote/admin/voters/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import * as XLSX from "xlsx";

type Voter = {
  _id: string;
  name: string;
  email: string;
  role: string;
  hasVoted: boolean;
  createdAt: string;
};

// --- Translations Dictionary ---
const translations = {
  my: {
    portalName: "အက်ဒမင်",
    logoutBtn: "ထွက်မည်",
    navResult: "မဲရလဒ်များ",
    navCreate: "အကောင့် စီမံခန့်ခွဲရန်",
    navVoterList: "မဲပေးသူ စာရင်း",
    navTeamList: "အဖွဲ့ စာရင်း",
    navTime: "မဲပေးချိန် သတ်မှတ်ရန်",
    navProfile: "ပရိုဖိုင်",
    title: "မှတ်ပုံတင်ထားသော မဲပေးသူများ",
    subtitle: "စနစ်အတွင်းရှိ မဲပေးသူအကောင့် အားလုံးကို စီမံခန့်ခွဲပြီး စောင့်ကြည့်ပါ။",
    total: "စုစုပေါင်း",
    voted: "မဲပေးပြီး",
    noVoters: "ယခုလောလောဆယ် မှတ်ပုံတင်ထားသော မဲပေးသူ မရှိသေးပါ။",
    createOne: "မဲပေးသူ အသစ်မှတ်ပုံတင်ရန်",
    tableNo: "စဉ်",
    name: "အမည်",
    email: "အီးမေးလ်",
    status: "အခြေအနေ",
    addedOn: "ထည့်သွင်းသည့် ရက်စွဲ",
    actions: "လုပ်ဆောင်ချက်များ",
    votedBadge: "မဲပေးပြီးပါပြီ",
    pendingBadge: "စောင့်ဆိုင်းဆဲ",
    editBtn: "ပြင်မည်",
    deleteBtn: "ဖျက်မည်",
    editTitle: "မဲပေးသူ အချက်အလက် ပြင်ဆင်ရန်",
    nameLabel: "အမည်",
    emailLabel: "အီးမေးလ်",
    pwdLabel: "စကားဝှက် အသစ် (ရွေးချယ်နိုင်သည်)",
    pwdPlaceholder: "စကားဝှက် မပြောင်းလိုပါက အလွတ်ထားပါ။",
    cancelBtn: "ပယ်ဖျက်မည်",
    saveBtn: "သိမ်းဆည်းမည်",
    savingBtn: "သိမ်းဆည်းနေပါသည်...",
    deleteTitle: "အကောင့် ဖျက်သိမ်းရန် အတည်ပြုပါ",
    deleteWarning: "ဤမဲပေးသူကို ဖျက်ပစ်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို နောက်ပိုင်းတွင် ပြင်ဆင်၍မရပါ။",
    confirmDeleteBtn: "ဖျက်သိမ်းမည်",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
    exportBtn: "Excel အဖြစ် ထုတ်ယူမည်",
    printBtn: "ပရင့်ထုတ်မည်",
  },
  en: {
    portalName: "Admin",
    logoutBtn: "Log Out",
    navResult: "Voting Results",
    navCreate: "Account Management",
    navVoterList: "Voter Lists",
    navTeamList: "Team Lists",
    navTime: "Set Voting Times",
    navProfile: "Profile",
    title: "Registered Voters",
    subtitle: "Manage and monitor all voter accounts in the system.",
    total: "Total",
    voted: "Voted",
    noVoters: "No voters have been registered yet.",
    createOne: "Register your first voter",
    tableNo: "No.",
    name: "Name",
    email: "Email",
    status: "Status",
    addedOn: "Added On",
    actions: "Actions",
    votedBadge: "Vote Cast",
    pendingBadge: "Pending",
    editBtn: "Edit",
    deleteBtn: "Delete",
    editTitle: "Edit Voter",
    nameLabel: "Full Name",
    emailLabel: "Email Address",
    pwdLabel: "Reset Password (Optional)",
    pwdPlaceholder: "Leave blank to keep current password",
    cancelBtn: "Cancel",
    saveBtn: "Save Changes",
    savingBtn: "Saving...",
    deleteTitle: "Confirm Deletion",
    deleteWarning: "Are you sure you want to delete this voter? This action cannot be undone.",
    confirmDeleteBtn: "Delete Voter",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
    exportBtn: "Export Excel",
    printBtn: "Print List",
  }
};

export default function VoterListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- UI Settings ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // --- Modal States ---
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchVoters();
  }, [status]);

  const fetchVoters = async () => {
    try {
      const res = await fetch("/api/vote/users?role=VOTER");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to load voters.");
      
      setVoters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Export and Print Handlers ---
  const handleExportExcel = () => {
    if (voters.length === 0) return;
    
    const exportData = voters.map((v, i) => ({
      "No.": i + 1,
      "Name": v.name,
      "Email": v.email,
      "Status": v.hasVoted ? "Voted" : "Pending",
      "Added On": new Date(v.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voters");
    XLSX.writeFile(wb, "Voter_List.xlsx");
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Delete Handlers ---
  const openDeleteModal = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/vote/users?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to delete voter.");
      
      setVoters((prev) => prev.filter((voter) => voter._id !== deleteTarget.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  // --- Edit Handlers ---
  const openEditModal = (voter: Voter) => {
    setEditingVoter(voter);
    setEditName(voter.name);
    setEditEmail(voter.email);
    setEditPassword(""); 
    setModalError("");
  };

  const closeEditModal = () => {
    setEditingVoter(null);
    setModalError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoter) return;

    setIsSubmitting(true);
    setModalError("");

    try {
      const payload: any = { id: editingVoter._id, name: editName, email: editEmail, role: "VOTER" };
      if (editPassword) payload.password = editPassword;

      const res = await fetch("/api/vote/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update voter.");

      setVoters((prev) =>
        prev.map((voter) => (voter._id === editingVoter._id ? { ...voter, name: editName, email: editEmail } : voter))
      );
      closeEditModal();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dynamic Navbar Links ---
  const navLinks = [
    { href: "/vote/admin", label: t.navResult },
    { href: "/vote/admin/create", label: t.navCreate },
    { href: "/vote/admin/voters", label: t.navVoterList },
    { href: "/vote/admin/teams", label: t.navTeamList },
    { href: "/vote/admin/settings", label: t.navTime },
    { href: "/vote/admin/profile", label: t.navProfile },
  ];

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

  // Calculate stats
  const totalVoters = voters.length;
  const votedCount = voters.filter((v) => v.hasVoted).length;

  return (
    <div className={`${isDark ? "dark" : ""} h-screen flex flex-col overflow-hidden print:h-auto print:overflow-visible`}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 print:bg-white print:text-black">
        
        {/* --- Unified Single-Line Navigation Bar (Hidden on Print) --- */}
        <nav className="flex-none bg-white/90 dark:bg-gray-900/90 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 shadow-sm print:hidden">
          <div className="max-w-[95rem] mx-auto px-4 h-16 flex items-center justify-between gap-4">
            
            {/* Left: Admin Identity */}
            <div className="flex items-center gap-2.5 whitespace-nowrap flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-extrabold text-lg">A</span>
              </div>
              <span className="font-bold text-base tracking-tight hidden md:inline">
                {t.portalName} <span className="text-blue-500 dark:text-blue-400 font-medium">({user.name})</span>
              </span>
            </div>

            {/* Middle: Centered Navigation Links */}
            <div className="hidden lg:flex items-center gap-6 overflow-x-auto no-scrollbar py-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-bold transition-colors pb-0.5 whitespace-nowrap ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Right: Language, Theme Toggle & Logout Button */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => setLang(lang === "my" ? "en" : "my")} 
                className="flex items-center justify-center px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {lang === "my" ? "EN" : "မြန်မာ"}
              </button>
              
              <button 
                onClick={() => setIsDark(!isDark)} 
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 shadow-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                )}
              </button>

              <button 
                onClick={() => signOut({ callbackUrl: "/vote" })} 
                className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-3.5 py-1.5 rounded-lg shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                {t.logoutBtn}
              </button>
            </div>

          </div>
        </nav>

        {/* Mobile Navbar Links (Hidden on Print) */}
        <div className="flex lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 overflow-x-auto no-scrollbar gap-4 flex-shrink-0 print:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-bold whitespace-nowrap pb-1 border-b-2 ${
                  isActive ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* --- Main Scrollable Content --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 print:overflow-visible print:p-0">
          <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 print:pb-0">
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-4 print:mb-4">
              
              

              {/* Export & Print Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportExcel}
                      disabled={voters.length === 0}
                      className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="hidden sm:inline">{t.exportBtn}</span>
                    </button>

                    <button 
                      onClick={handlePrint}
                      disabled={voters.length === 0}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      <span className="hidden sm:inline">{t.printBtn}</span>
                    </button>
                  </div>


              {/* Quick Stats & Action Buttons (Hidden on Print) */}
              {!isLoading && !error && (
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  
                  {/* Stats Box */}
                  <div className="flex gap-4 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="text-center px-4 border-r border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5">{t.total}</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{totalVoters}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-xs text-green-500 font-bold uppercase tracking-wider mb-0.5">{t.voted}</p>
                      <p className="text-xl font-black text-green-600 dark:text-green-400">{votedCount}</p>
                    </div>
                  </div>

                  
                </div>
              )}
            </div>

            {error ? (
              <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-500/20 font-bold print:hidden">
                {error}
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-20 print:hidden">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : voters.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center transition-colors print:hidden">
                <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">{t.noVoters}</p>
                <Link href="/vote/admin/create" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  {t.createOne} &rarr;
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors print:shadow-none print:border-none print:rounded-none">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 print:divide-black">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 transition-colors print:bg-white print:text-black">
                      <tr>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.tableNo}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.name}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.email}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.status}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.addedOn}</th>
                        <th className="px-6 py-5 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:hidden">{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                      {voters.map((voter, index) => (
                        <tr key={voter._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:bg-white print:text-black">
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-500 dark:text-gray-400 print:text-black">
                            {index + 1}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white text-base print:text-black">{voter.name}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 print:text-black">{voter.email}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            {voter.hasVoted ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-500/10 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/20 shadow-sm print:border-gray-400 print:text-black print:bg-white">
                                <svg className="w-3.5 h-3.5 mr-1 print:hidden" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                {t.votedBadge}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 shadow-sm print:border-gray-400 print:text-black print:bg-white">
                                {t.pendingBadge}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 print:text-black">
                            {new Date(voter.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-bold space-x-4 print:hidden">
                            <button onClick={() => openEditModal(voter)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                              {t.editBtn}
                            </button>
                            <button onClick={() => openDeleteModal(voter._id, voter.name)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors">
                              {t.deleteBtn}
                            </button>
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

      {/* --- EDIT MODAL OVERLAY --- */}
      {editingVoter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{t.editTitle}</h2>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-bold text-center">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.nameLabel}</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.emailLabel}</label>
                <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">{t.pwdLabel}</label>
                <input type="password" minLength={6} value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder={t.pwdPlaceholder} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeEditModal} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  {t.cancelBtn}
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:bg-blue-400 transition-colors">
                  {isSubmitting ? t.savingBtn : t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CUSTOM MODAL --- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.deleteTitle}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed font-medium">
              {t.deleteWarning}
              <br /><br />
              <strong className="text-gray-900 dark:text-white">Target:</strong> {deleteTarget.name}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                {t.cancelBtn}
              </button>
              <button onClick={executeDelete} className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors">
                {t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}