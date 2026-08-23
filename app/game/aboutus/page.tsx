// file: app/game/aboutus/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function AboutUsPage() {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animations on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-cyan-500/30 pb-20">

      {/* Background Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 md:pt-16">

        {/* Back Navigation */}
        <div className="mb-8">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO ARCADE
          </Link>
        </div>

        {/* Header Title */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}>
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mt-4 tracking-tight">
            University of Computer Studies, Hinthada
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm">UCSH — Ayeyarwady Region, Myanmar</p>
        </div>

        {/* SECTION 1: ABOUT US (Left-in animation) */}
        <section className={`mb-16 transition-all duration-1000 transform ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"}`}>
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-cyan-400 to-emerald-400" />
            <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
              <span>🏛️</span> About Us
            </h2>
            <p className="text-slate-300 leading-relaxed text-base md:text-lg text-justify">
              Government Computer College (GCC) was founded on September, 2001. In 2007 it was reformed as University of Computer Studies, Hinthada (UCSH). UCSH is located in Hinthada Township, Ayeyarwady Region, Myanmar. UCSH is one of the higher educational institutions under the Ministry of Science and Technology, Myanmar. UCSH is a university that offers internationally standardized courses in the fields of computer science and computer technology. The university now provides degrees in computer science and computer technology to satisfy the human resource demands for advanced technologies in computer science and computer technology both at home and abroad.
            </p>
          </div>
        </section>

        {/* SECTION 2: VISION & MISSION (Right-in animation) */}
        <section className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 transition-all duration-1000 delay-200 transform ${isVisible ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"}`}>
          
          {/* Vision */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-400" />
            <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-3">
              <span>🔭</span> Vision
            </h2>
            <ul className="space-y-3 text-slate-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">▸</span> To broaden ICT technologies in the region
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">▸</span> To fulfill the required ICT human resources in the region
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">▸</span> To carry out ICT-based research in different fields of the region
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-1">▸</span> To develop ICT-based industries in the region
              </li>
            </ul>
          </div>

          {/* Mission */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-400" />
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
              <span>🎯</span> Mission
            </h2>
            <ul className="space-y-3 text-slate-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">▸</span> To produce well-qualified ICT human resources
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">▸</span> To train and teach the students with the updated curriculum in accordance with international standard
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">▸</span> To teach the students the latest technologies with the aid of teaching tools
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">▸</span> To carry out ICT-based researches in different fields of Science and Technology
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-1">▸</span> To become a good university environment in line with international standards.
              </li>
            </ul>
          </div>

        </section>

        {/* SECTION 3: OBJECTIVES/GOALS & POLICY (Left-in animation) */}
        <section className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 transition-all duration-1000 delay-300 transform ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"}`}>
          
          {/* Objectives / Goals */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-400" />
            <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3">
              <span>🎯</span> Objectives / Goals
            </h2>
            <ul className="space-y-3 text-slate-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">▪</span> To improve the quality of teaching and learning and to produce quality human resources.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">▪</span> To develop the five strengths of student such as physical, mental, moral, friendly, financial.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">▪</span> To provide training and education using curricula, teaching aids, and technologies that are in line with international standards.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">▪</span> To develop the projects that benefit the country, benefit the region and support the e-government service.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">▪</span> To improve the image of the university, to keep it clean, beautiful, and green.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">▪</span> To become a Smart University.
              </li>
            </ul>
          </div>

          {/* Policy */}
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group hover:border-rose-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-2 h-full bg-rose-400" />
            <h2 className="text-2xl font-bold text-rose-400 mb-4 flex items-center gap-3">
              <span>📜</span> Policy
            </h2>
            <ul className="space-y-3 text-slate-300 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-1">✔️</span> To improve the rate of passing the exam.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-1">✔️</span> To improve the quality of teaching and learning.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-1">✔️</span> To stand as a university of international standard.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-1">✔️</span> To get improved in youths&apos; physical and mental wellbeing.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 mt-1">✔️</span> To implement the policies and instructions of the state.
              </li>
            </ul>
          </div>

        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-900">
          <p className="text-xs font-mono text-slate-600 tracking-widest uppercase">
            University of Computer Studies, Hinthada (UCSH)
          </p>
        </div>

      </div>
    </div>
  );
}