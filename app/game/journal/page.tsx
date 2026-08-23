// file: app/game/journal/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

// --- Journal Preset Data (English & Myanmar) ---
const JOURNAL_DATA = {
  aimAndFocus: {
    en: "University Journal of Student Projects and Research (UJSPR) is an international platform for young scientists and engineers who study in all fields of computer science and technology to publish high quality and refereed papers. Papers reporting original research and innovative student projects which are below plagiarism 25% are welcome. Papers for publication in the journal are selected through rigorous peer review, to ensure originality, timeliness, relevance, and readability.",
    mm: "UJSPR သည် ကွန်ပျူတာသိပ္ပံနှင့် နည်းပညာနယ်ပယ်အသီးသီးတွင် ပညာသင်ကြားနေသော လူငယ်သိပ္ပံပညာရှင်များနှင့် အင်ဂျင်နီယာများအတွက် အရည်အသွေးမြင့်မားပြီး အကဲဖြတ်စစ်ဆေးပြီးသော စာတမ်းများကို ထုတ်ဝေရန် နိုင်ငံတကာပလက်ဖောင်းတစ်ခု ဖြစ်ပါသည်။ မူရင်းသုတေသနများနှင့် ဆန်းသစ်တီထွင်မှုရှိသော ကျောင်းသားပရောဂျက်များကို တင်ပြထားသည့်၊ ခိုးယူကူးချမှု (Plagiarism) ၂၅% အောက်ရှိသော စာတမ်းများကို ဖိတ်ခေါ်အပ်ပါသည်။"
  },
  scopes: [
    {
      category: "Computer Science",
      icon: "💻",
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/20",
      topics: [
        "Big Data Analytics", "Artificial Intelligence", "Machine & Deep Learning", 
        "Internet of Things (IoT)", "Cloud Computing", "Computer Vision", 
        "Natural Language Processing", "Web Technologies", "Semantic Web", 
        "High Performance Computing", "Parallel Computing", "Distributed Computing", 
        "Computer Graphics", "Database Systems", "Operating System"
      ]
    },
    {
      category: "Computer Technology",
      icon: "⚙️",
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/20",
      topics: [
        "Networking", "Cybersecurity", "Cryptography & Network Security", 
        "Digital Signal Processing", "Embedded System", "Control System", 
        "Electrical Circuit", "Fuzzy Logic", "Image Processing", "Stenography"
      ]
    },
    {
      category: "Information Science",
      icon: "📊",
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-950/20",
      topics: [
        "Information System", "Information Management", "Information Security", 
        "Information Retrieval", "Software Engineering", "Data Modeling & Data Analysis", 
        "Knowledge Engineering", "Data Mining", "E-commerence"
      ]
    }
  ],
  editors: [
    {
      group: "Executive Editor",
      members: [
        { name: "Prof. Dr. Tun Myat Aung", desc: "Ph.D (Tech. Sci., I.T, MEPhI)" }
      ]
    },
    {
      group: "Technical Editorial Board",
      members: [
        { name: "Prof. Dr. Khin Kyu Kyu", desc: "Ph.D(CHT), Faculty of Computer Systems and Technologies" },
        { name: "Prof. Dr. Thae Thae Soe", desc: "Ph.D(IT), Faculty of Information Science" },
        { name: "Prof. Dr. Thae Thae Htwe", desc: "Ph.D(Applied Maths), Faculty of Computing" },
        { name: "Prof. Dr. Naw Wai Wai Sin", desc: "Ph.D(Engineering Physics), Department of Natural Science" },
        { name: "Assoc. Prof. Dr. Ei Ei Mon", desc: "Ph.D(IT), Faculty of Computer Science" },
        { name: "Assoc. Prof. Daw Myo Myo Khin", desc: "M.Sc (Physics), M.I.Sc, Dept of IT Supporting and Maintenance" },
        { name: "Assoc. Prof. Dr. Hnin Cherry", desc: "Ph.D(IT), Faculty of Computer Science" },
        { name: "Assoc. Prof. Daw Thida Soe", desc: "M.Sc (Physics), M.A.Sc (Computer Engineering)" },
        { name: "Assoc. Prof. Daw Soe Soe Mon", desc: "M.Sc(Physics), M.A.Sc(Computer Technology)" },
        { name: "Assoc. Prof. Daw Khin San Wai", desc: "M.C.Sc, Dept of IT Supporting and Maintenance" }
      ]
    },
    {
      group: "Language Editorial Board",
      members: [
        { name: "Assoc. Prof. Daw Win Theingi Myint", desc: "M.A (ESP), Department of Language" },
        { name: "Daw Win Mar Soe", desc: "M.A (English), Department of Language" }
      ]
    },
    {
      group: "Technical Committee & Officers",
      members: [
        { name: "Daw Khaing Thazin Nwe", desc: "Associate Professor, Faculty of Information Science" },
        { name: "U Htet Wai Lwin", desc: "Lecturer, Faculty of Computer Science" },
        { name: "Daw San San Myat", desc: "Student Affairs Officer" },
        { name: "U Win Myat Htut", desc: "Finance Officer" }
      ]
    }
  ]
};

export default function JournalPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<"en" | "mm">("en");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-950 font-sans text-slate-100 overflow-hidden selection:bg-cyan-500/30">
      
      {/* Background Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col h-full p-4 sm:p-6">
        
        {/* Navigation & Header */}
        <div className="w-full shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors group bg-slate-900/50 px-4 py-2 rounded-lg backdrop-blur-md border border-slate-800"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO ARCADE
          </Link>

          {/* Language Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setLang("en")}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${lang === "en" ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "text-slate-400 hover:text-white"}`}
            >
              ENG
            </button>
            <button 
              onClick={() => setLang("mm")}
              className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${lang === "mm" ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "text-slate-400 hover:text-white"}`}
            >
              မြန်မာ
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar pr-2 sm:pr-4 pb-10 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          
          {/* Main Title */}
          <div className="text-center mb-12">
            <span className="px-4 py-1 text-[10px] sm:text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/50 border border-cyan-800 rounded-full inline-block mb-4 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              {lang === "en" ? "Research Publication" : "သုတေသန စာစောင်"}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 tracking-tight drop-shadow-lg leading-tight pb-2">
              University Journal of Student Projects and Research
            </h1>
            <h2 className="text-lg sm:text-xl text-slate-400 mt-2 font-bold tracking-widest">
              ( UJSPR )
            </h2>
          </div>

          {/* Aim and Focus Section */}
          <section className="bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-2xl mb-12 relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-400" />
            <h3 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
              <span>🎯</span> {lang === "en" ? "Aim and Focus" : "ရည်ရွယ်ချက်နှင့် အဓိကဦးတည်ချက်"}
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base text-justify">
              {JOURNAL_DATA.aimAndFocus[lang]}
            </p>
          </section>

          {/* Scopes Section */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
              <span>🌐</span> {lang === "en" ? "Journal Scopes" : "လွှမ်းခြုံသည့်နယ်ပယ်များ"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {JOURNAL_DATA.scopes.map((scope, idx) => (
                <div key={idx} className={`${scope.bg} border ${scope.border} p-6 rounded-2xl backdrop-blur-sm hover:-translate-y-2 transition-transform shadow-lg`}>
                  <div className="text-3xl mb-4">{scope.icon}</div>
                  <h4 className={`text-lg font-black ${scope.color} mb-4 uppercase tracking-wider`}>
                    {scope.category}
                  </h4>
                  <ul className="space-y-2">
                    {scope.topics.map((topic, i) => (
                      <li key={i} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                        <span className={`${scope.color} mt-0.5`}>▸</span> {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Editorial Board Section */}
          <section>
            <h3 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
              <span>👨‍🏫</span> {lang === "en" ? "Editorial Board & Committee" : "အယ်ဒီတာအဖွဲ့နှင့် ကော်မတီ"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {JOURNAL_DATA.editors.map((group, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
                  <h4 className="text-emerald-400 font-bold mb-4 uppercase tracking-widest text-sm border-b border-slate-800 pb-2">
                    {group.group}
                  </h4>
                  <div className="space-y-4">
                    {group.members.map((member, i) => (
                      <div key={i}>
                        <p className="text-sm font-bold text-slate-200">{member.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{member.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #06b6d4; }
      `}} />
    </div>
  );
}