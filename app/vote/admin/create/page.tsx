"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import AdminNav from "@/app/vote/components/AdminNav"; // Ensure this path matches your folder structure

// --- Translations Dictionary (Page Content Only) ---
const translations = {
  my: {
    createTitle: "အကောင့် စီမံခန့်ခွဲခြင်း",
    whatAdminCanDo: "အက်ဒမင် ဘာလုပ်နိုင်သလဲ? ",
    optSingle: "အကောင့်တစ်ခုချင်း ဖန်တီးမည်",
    optImport: "အစုလိုက် ဖန်တီးမည် (Excel)",
    optExport: "အကောင့်များ ဆွဲထုတ်မည် (Export)",
    formDesc: "စနစ်တွင် ပါဝင်မည့်သူအသစ်ကို မှတ်ပုံတင်ရန် အချက်အလက်များဖြည့်ပါ။",
    nameLabel: "အမည် သို့မဟုတ် အဖွဲ့အမည်",
    emailLabel: "အီးမေးလ် လိပ်စာ",
    pwdLabel: "ယာယီ စကားဝှက်",
    roleLabel: "ရာထူး သတ်မှတ်ရန်",
    roleVoter: "မဲပေးသူ (Voter) - မဲတစ်မဲ ပေးနိုင်သည်",
    roleTeam: "ပရောဂျက်အဖွဲ့ (Team) - ပရောဂျက် တင်သွင်းနိုင်သည်",
    createBtn: "အကောင့် ဖန်တီးမည်",
    creatingBtn: "ဖန်တီးနေပါသည်...",
    emailError: "အီးမေးလ်သည် @gmail.com (သို့) @ucsh.edu.mm ဖြစ်ရမည်။",
    accessRestricted: "ဝင်ရောက်ခွင့် ကန့်သတ်ထားပါသည်",
    loginRequired: "သင်သည် အက်ဒမင်အဖြစ် လုံခြုံစွာ အကောင့်ဝင်ထားရပါမည်။",
    goLogin: "အက်ဒမင် လော့ဂ်အင်သို့ သွားရန်",
    bulkDesc: "Excel ဖိုင်ကိုအသုံးပြု၍ အကောင့်များကို အစုလိုက်ထည့်သွင်းနိုင်သည်။",
    downloadTemplate: "နမူနာ Excel ဖိုင် ဒေါင်းလုဒ်လုပ်ရန်",
    importExcel: "Excel ဖိုင် ထည့်သွင်းမည်",
    importingBtn: "ထည့်သွင်းနေပါသည်...",
    exportDesc: "စနစ်အတွင်းရှိ မှတ်ပုံတင်ထားသော အကောင့်အားလုံးကို Excel ဖိုင်ဖြင့် သိမ်းဆည်းပါ။",
    exportAccounts: "အကောင့်များ Export လုပ်ရန်",
  },
  en: {
    createTitle: "Account Management",
    whatAdminCanDo: "What can Admin do? ",
    optSingle: "Single Account",
    optImport: "Bulk Import (Excel)",
    optExport: "Export Accounts",
    formDesc: "Fill out the details below to securely register a new participant.",
    nameLabel: "Full Name or Team Name",
    emailLabel: "Email Address",
    pwdLabel: "Temporary Password",
    roleLabel: "Assign Role",
    roleVoter: "Voter - Can cast one vote",
    roleTeam: "Project Team - Can submit a project",
    createBtn: "Register Account",
    creatingBtn: "Creating...",
    emailError: "Email must end with @gmail.com or @ucsh.edu.mm only.",
    accessRestricted: "Access Restricted",
    loginRequired: "You must be securely logged in as an Administrator.",
    goLogin: "Go to Admin Login",
    bulkDesc: "Easily import multiple accounts at once using an Excel file.",
    downloadTemplate: "Download Template",
    importExcel: "Import Excel File",
    importingBtn: "Importing...",
    exportDesc: "Download a complete list of all registered voters and teams currently in the system.",
    exportAccounts: "Export Accounts",
  }
};

export default function AdminCreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- States ---
  const [lang, setLang] = useState<"my" | "en">("my");
  const [isDark, setIsDark] = useState(false);
  const [activeAction, setActiveAction] = useState<"single" | "import" | "export">("single");
  const t = translations[lang];

  // --- Create Form State ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VOTER");
  const [isCreating, setIsCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ type: "", text: "" });
  const [emailValidationWarning, setEmailValidationWarning] = useState("");

  // --- Bulk Import / Export State ---
  const [isImporting, setIsImporting] = useState(false);
  const [bulkMsg, setBulkMsg] = useState({ type: "", text: "" });

  // Live Email Validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);

    if (val.trim() === "") {
      setEmailValidationWarning("");
      return;
    }

    const cleanEmail = val.trim().toLowerCase();
    const isValid = cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@ucsh.edu.mm");

    if (!isValid) {
      setEmailValidationWarning(t.emailError);
    } else {
      setEmailValidationWarning("");
    }
  };

  // --- Typing Effect State ---
  const phrases = [
    "Add new Project Teams.",
    "Register official Voters.",
    "Secure voting integrity.",
    "Manage the System.",
  ];
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const typeSpeed = isDeleting ? 40 : 80;
    const timer = setTimeout(() => {
      const fullText = phrases[phraseIndex];
      if (!isDeleting && currentPhrase === fullText) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && currentPhrase === "") {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setCurrentPhrase(fullText.substring(0, currentPhrase.length + (isDeleting ? -1 : 1)));
      }
    }, typeSpeed);
    return () => clearTimeout(timer);
  }, [currentPhrase, isDeleting, phraseIndex, status]);

  // --- Handle Action Tab Switch ---
  const changeAction = (action: "single" | "import" | "export") => {
    setActiveAction(action);
    setCreateMsg({ type: "", text: "" });
    setBulkMsg({ type: "", text: "" });
  };

  // --- Single Form Handler ---
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateMsg({ type: "", text: "" });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@ucsh.edu.mm")) {
      setCreateMsg({ type: "error", text: t.emailError });
      return;
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/vote/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: cleanEmail, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setCreateMsg({ type: "success", text: data.message });
      setName(""); setEmail(""); setPassword(""); setRole("VOTER");
      setEmailValidationWarning("");
    } catch (error: any) {
      setCreateMsg({ type: "error", text: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  // --- EXCEL BULK FUNCTIONS ---
  const handleDownloadTemplate = () => {
    const templateData = [
      { name: "AungPyaeSone", email: "aungpyaesone.ucsh@gmail.com", password: "P@ssw0rd", role: "VOTER" },
      { name: "InfinityIT", email: "aungpyaesone.dev@gmail.com", password: "P@ssw0rd", role: "TEAM" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Account_Template.xlsx");
  };

  const handleExportExisting = async () => {
    setBulkMsg({ type: "", text: "" });
    try {
      const [voterRes, teamRes] = await Promise.all([
        fetch("/api/vote/users?role=VOTER"),
        fetch("/api/vote/users?role=TEAM")
      ]);
      const voters = await voterRes.json();
      const teams = await teamRes.json();
      
      const allUsers = [...(Array.isArray(voters) ? voters : []), ...(Array.isArray(teams) ? teams : [])];
      
      if (allUsers.length === 0) {
        setBulkMsg({ type: "error", text: "No accounts found to export." });
        return;
      }

      const exportData = allUsers.map(u => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Added_On: new Date(u.createdAt).toLocaleString()
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Accounts");
      XLSX.writeFile(wb, "Existing_Accounts.xlsx");
      
      setBulkMsg({ type: "success", text: `Successfully exported ${allUsers.length} accounts.` });
    } catch (error: any) {
      setBulkMsg({ type: "error", text: "Failed to export accounts." });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBulkMsg({ type: "", text: "" });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        const [voterRes, teamRes] = await Promise.all([
          fetch("/api/vote/users?role=VOTER"),
          fetch("/api/vote/users?role=TEAM")
        ]);
        const voters = await voterRes.json();
        const teams = await teamRes.json();
        const allUsers = [...(Array.isArray(voters) ? voters : []), ...(Array.isArray(teams) ? teams : [])];
        const existingEmails = new Set(allUsers.map(u => u.email.toLowerCase()));

        let addedCount = 0;
        let skippedCount = 0;

        for (const row of jsonData) {
          const rowName = row.name || row.Name;
          const rowEmail = row.email || row.Email;
          const rowPassword = row.password || row.Password;
          const rowRole = row.role || row.Role;

          if (!rowName || !rowEmail || !rowPassword || !rowRole) {
            skippedCount++; continue;
          }

          const cleanEmail = String(rowEmail).trim().toLowerCase();
          if (!cleanEmail.endsWith("@gmail.com") && !cleanEmail.endsWith("@ucsh.edu.mm")) {
            skippedCount++; continue;
          }

          if (existingEmails.has(cleanEmail)) {
            skippedCount++; continue;
          }

          const roleNormalized = String(rowRole).toUpperCase() === "TEAM" ? "TEAM" : "VOTER";
          const response = await fetch("/api/vote/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: String(rowName).trim(), email: cleanEmail, password: String(rowPassword).trim(), role: roleNormalized }),
          });

          if (response.ok) {
            addedCount++;
            existingEmails.add(cleanEmail); 
          } else {
            skippedCount++;
          }
        }

        setBulkMsg({ 
          type: addedCount > 0 ? "success" : "error", 
          text: `Import complete. Added: ${addedCount} | Skipped/Failed: ${skippedCount}` 
        });

      } catch (error) {
        setBulkMsg({ type: "error", text: "Error parsing Excel file." });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = ""; 
      }
    };
    reader.readAsArrayBuffer(file);
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
    <div className={`${isDark ? "dark" : ""} h-screen flex flex-col overflow-hidden`}>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
        
        {/* Render Reusable Admin Navbar */}
        <AdminNav 
          lang={lang} 
          setLang={setLang} 
          isDark={isDark} 
          setIsDark={setIsDark} 
          user={user} 
        />

        {/* --- Main Area (Centered and reduced padding to avoid scrolling) --- */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col items-center justify-center">
          
          <div className="w-full max-w-2xl text-center mb-3 mt-2 sm:mt-0">
            
            <div className="h-5 flex items-center justify-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium mb-4">
              <span>{t.whatAdminCanDo}</span>
              <span className="text-blue-600 dark:text-blue-400 ml-1 font-bold">
                {currentPhrase}
                <span className="animate-pulse border-r-2 border-blue-600 dark:border-blue-400 ml-0.5"></span>
              </span>
            </div>

            {/* --- ACTION TABS (Buttons instead of select) --- */}
            <div className="flex flex-col sm:flex-row items-center justify-center bg-gray-200 dark:bg-gray-800 p-1 rounded-xl shadow-inner w-full gap-1">
              <button 
                onClick={() => changeAction("single")}
                className={`flex-1 w-full text-xs sm:text-sm font-bold py-2 px-2 rounded-lg transition-all ${activeAction === "single" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {t.optSingle}
              </button>
              <button 
                onClick={() => changeAction("import")}
                className={`flex-1 w-full text-xs sm:text-sm font-bold py-2 px-2 rounded-lg transition-all ${activeAction === "import" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {t.optImport}
              </button>
              <button 
                onClick={() => changeAction("export")}
                className={`flex-1 w-full text-xs sm:text-sm font-bold py-2 px-2 rounded-lg transition-all ${activeAction === "export" ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {t.optExport}
              </button>
            </div>
          </div>

          <div className="w-full max-w-2xl pb-4">
            
            {/* 1. SINGLE ACCOUNT FORM */}
            {activeAction === "single" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-center text-xs font-medium">{t.formDesc}</p>

                {createMsg.text && (
                  <div className={`p-2.5 mb-4 rounded-lg text-xs font-bold text-center border ${createMsg.type === "success" ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200"}`}>
                    {createMsg.text}
                  </div>
                )}

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t.nameLabel}</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t.emailLabel}</label>
                      <input type="email" required value={email} onChange={handleEmailChange} className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border rounded-lg focus:ring-2 dark:text-white transition-colors ${emailValidationWarning ? "border-red-500 focus:ring-red-500" : "border-gray-200 dark:border-gray-700 focus:ring-blue-500"}`} placeholder="user@gmail.com or user@ucsh.edu.mm" />
                      {emailValidationWarning && (
                        <p className="mt-1 text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                          {emailValidationWarning}
                        </p>
                      )}
                    </div>

                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t.pwdLabel}</label>
                      <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">{t.roleLabel}</label>
                    <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors appearance-none">
                      <option value="VOTER">{t.roleVoter}</option>
                      <option value="TEAM">{t.roleTeam}</option>
                    </select>
                  </div>

                  <button type="submit" disabled={isCreating || Boolean(emailValidationWarning)} className="w-full mt-2 py-2.5 px-4 text-white text-sm font-bold rounded-lg shadow-sm transition-all duration-200 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed">
                    {isCreating ? t.creatingBtn : t.createBtn}
                  </button>
                </form>
              </div>
            )}

            {/* 2. BULK IMPORT SECTION */}
            {activeAction === "import" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-gray-500 dark:text-gray-400 mb-5 text-center text-xs font-medium">{t.bulkDesc}</p>

                {bulkMsg.text && (
                  <div className={`p-2.5 mb-4 rounded-lg text-xs font-bold text-center border ${bulkMsg.type === "success" ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200"}`}>
                    {bulkMsg.text}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch">
                  <button onClick={handleDownloadTemplate} className="flex-1 flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-blue-600 dark:text-blue-400 font-bold gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    <span className="text-xs">{t.downloadTemplate}</span>
                  </button>

                  <div className="flex-1 relative flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-green-200 dark:border-green-900/50 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-green-600 dark:text-green-400 font-bold gap-2 cursor-pointer">
                    {isImporting ? (
                      <div className="flex flex-col items-center gap-1.5">
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-xs">{t.importingBtn}</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span className="text-xs">{t.importExcel}</span>
                        <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. EXPORT ACCOUNTS SECTION */}
            {activeAction === "export" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
                <p className="text-gray-500 dark:text-gray-400 mb-5 text-xs font-medium">{t.exportDesc}</p>

                {bulkMsg.text && (
                  <div className={`p-2.5 mb-4 rounded-lg text-xs font-bold text-center border ${bulkMsg.type === "success" ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200"}`}>
                    {bulkMsg.text}
                  </div>
                )}

                <button onClick={handleExportExisting} className="inline-flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-purple-600 dark:text-purple-400 font-bold gap-2 w-full sm:w-1/2 mx-auto">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span className="text-xs">{t.exportAccounts}</span>
                </button>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}