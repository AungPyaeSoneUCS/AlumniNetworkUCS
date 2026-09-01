"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import AdminNav from "@/app/vote/components/AdminNav"; // Adjust path if needed

type Team = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
    title: "ပရောဂျက် အဖွဲ့များ",
    subtitle: "မှတ်ပုံတင်ထားသော အဖွဲ့အကောင့်များကို စီမံပါ။",
    totalTeams: "စုစုပေါင်း အဖွဲ့များ",
    noTeams: "ယခုလောလောဆယ် ဖန်တီးထားသော အဖွဲ့ မရှိသေးပါ။",
    createOne: "အဖွဲ့အကောင့် အသစ်ဖန်တီးမည်",
    tableNo: "စဉ်",
    tableName: "အဖွဲ့ အမည်",
    tableEmail: "အီးမေးလ်",
    tableAddedOn: "ထည့်သွင်းသည့် ရက်စွဲ",
    tableActions: "လုပ်ဆောင်ချက်များ",
    editBtn: "ပြင်မည်",
    deleteBtn: "ဖျက်မည်",
    editTitle: "အဖွဲ့ အချက်အလက် ပြင်ဆင်ရန်",
    nameLabel: "အဖွဲ့ အမည်",
    emailLabel: "အီးမေးလ်",
    pwdLabel: "စကားဝှက် အသစ် (ရွေးချယ်နိုင်သည်)",
    pwdPlaceholder: "စကားဝှက် မပြောင်းလိုပါက အလွတ်ထားပါ။",
    cancelBtn: "ပယ်ဖျက်မည်",
    saveBtn: "သိမ်းဆည်းမည်",
    savingBtn: "သိမ်းဆည်းနေပါသည်...",
    deleteTitle: "အကောင့် ဖျက်သိမ်းရန် အတည်ပြုပါ",
    deleteWarning: "ဤအဖွဲ့ကို ဖျက်ပစ်ရန် သေချာပါသလား? ဤလုပ်ဆောင်ချက်ကို နောက်ပိုင်းတွင် ပြင်ဆင်၍မရပါ။",
    confirmDeleteBtn: "ဖျက်သိမ်းမည်",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
    exportBtn: "Excel အဖြစ် ထုတ်ယူမည်",
    printBtn: "ပရင့်ထုတ်မည်",
  },
  en: {
    title: "Project Teams",
    subtitle: "Manage all registered team accounts.",
    totalTeams: "Total Teams",
    noTeams: "No project teams have been created yet.",
    createOne: "Create a new team account",
    tableNo: "No.",
    tableName: "Team Name",
    tableEmail: "Email",
    tableAddedOn: "Added On",
    tableActions: "Actions",
    editBtn: "Edit",
    deleteBtn: "Delete",
    editTitle: "Edit Team",
    nameLabel: "Team Name",
    emailLabel: "Email",
    pwdLabel: "Reset Password (Optional)",
    pwdPlaceholder: "Leave blank to keep current password",
    cancelBtn: "Cancel",
    saveBtn: "Save Changes",
    savingBtn: "Saving...",
    deleteTitle: "Confirm Deletion",
    deleteWarning: "Are you sure you want to delete this team? This action cannot be undone.",
    confirmDeleteBtn: "Delete Team",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
    exportBtn: "Export Excel",
    printBtn: "Print List",
  }
};

export default function TeamListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- UI Settings ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const t = translations[lang];

  // --- Modal States ---
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  // --- Fetch Data ---
  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/vote/users?role=TEAM");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load teams.");
        setTeams(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, [status]);

  // --- Export and Print Handlers ---
  const handleExportExcel = () => {
    if (teams.length === 0) return;
    
    const exportData = teams.map((tItem, i) => ({
      "No.": i + 1,
      "Name": tItem.name,
      "Email": tItem.email,
      "Added On": new Date(tItem.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, "Team_List.xlsx");
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
      
      if (!res.ok) throw new Error(data.error || "Failed to delete team.");
      
      setTeams((prev) => prev.filter((team) => team._id !== deleteTarget.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  // --- Edit Handlers ---
  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditEmail(team.email);
    setEditPassword(""); 
    setModalError("");
  };

  const closeEditModal = () => {
    setEditingTeam(null);
    setModalError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    setIsSubmitting(true);
    setModalError("");

    try {
      const payload: any = { id: editingTeam._id, name: editName, email: editEmail, role: "TEAM" };
      if (editPassword) payload.password = editPassword;

      const res = await fetch("/api/vote/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update team.");

      setTeams((prev) =>
        prev.map((team) => (team._id === editingTeam._id ? { ...team, name: editName, email: editEmail } : team))
      );
      closeEditModal();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Checks ---
  if (status === "loading") {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <div className="max-w-6xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 print:pb-0">
            
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-4 print:mb-4">
              <div>
                {/* Export & Print Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportExcel}
                    disabled={teams.length === 0}
                    className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <span className="hidden sm:inline">{t.exportBtn}</span>
                  </button>

                  <button 
                    onClick={handlePrint}
                    disabled={teams.length === 0}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-2xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    <span className="hidden sm:inline">{t.printBtn}</span>
                  </button>
                </div>
              </div>

              {/* Quick Stats & Action Buttons (Hidden on Print) */}
              {!isLoading && !error && (
                <div className="flex flex-wrap items-center gap-3 print:hidden">
                  <div className="flex gap-4 bg-white dark:bg-gray-800 p-2.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="text-center px-6">
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider mb-0.5">{t.totalTeams}</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">{teams.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error ? (
              <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-500/20 font-bold print:hidden">{error}</div>
            ) : isLoading ? (
              <div className="flex justify-center py-20 print:hidden">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : teams.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center transition-colors print:hidden">
                <p className="text-gray-500 dark:text-gray-400 mb-4 font-medium">{t.noTeams}</p>
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
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.tableName}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.tableEmail}</th>
                        <th className="px-6 py-5 text-left text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:text-black print:border-b print:border-black">{t.tableAddedOn}</th>
                        <th className="px-6 py-5 text-right text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider print:hidden">{t.tableActions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:divide-gray-300">
                      {teams.map((team, index) => (
                        <tr key={team._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors print:bg-white print:text-black">
                          <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-bold print:text-black">
                            {index + 1}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white text-base print:text-black">{team.name}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 print:text-black">{team.email}</div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400 print:text-black">
                            {new Date(team.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-bold space-x-4 print:hidden">
                            <button onClick={() => openEditModal(team)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                              {t.editBtn}
                            </button>
                            <button onClick={() => openDeleteModal(team._id, team.name)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors">
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
      {editingTeam && (
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