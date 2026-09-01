// file: app/vote/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function VotingLandingPage() {
  const [schedule, setSchedule] = useState({ start: 0, end: 0 });
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch the schedule from the database on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/vote/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.startDate && data.endDate) {
            setSchedule({
              start: new Date(data.startDate).getTime(),
              end: new Date(data.endDate).getTime(),
            });
          }
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. Real-time status checker (updates every second without hitting the DB)
  useEffect(() => {
    if (!schedule.start || !schedule.end) {
      setIsVotingOpen(false);
      return;
    }

    const checkTime = () => {
      const now = new Date().getTime();
      setIsVotingOpen(now >= schedule.start && now <= schedule.end);
    };

    checkTime(); // Check immediately
    const timer = setInterval(checkTime, 1000); // Re-check every second
    return () => clearInterval(timer);
  }, [schedule]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col justify-center items-center relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full text-center">
        
        {/* Header Section */}
        <div className="mb-16">
          
          {/* Dynamic Live Status Badge */}
          {isLoading ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm mb-6 border border-gray-200 shadow-sm transition-all duration-300">
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              Checking schedule...
            </div>
          ) : isVotingOpen ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 font-semibold text-sm mb-6 border border-green-200 shadow-sm transition-all duration-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Voting is currently OPEN
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 font-semibold text-sm mb-6 border border-red-200 shadow-sm transition-all duration-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"></path></svg>
              Voting is currently CLOSED
            </div>
          )}
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 mb-6 tracking-tight">
            Project Showcase 2026
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Welcome to the official University of Computer Studies, Hinthada voting portal. Please select your account type below to continue.
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Voter Portal */}
          <Link href="/vote/login" className="group relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Voter Portal</h3>
            <p className="text-gray-500 leading-relaxed">
              Sign in to browse project submissions and cast your official vote.
            </p>
          </Link>

          {/* Team Portal */}
          <Link href="/vote/login" className="group relative bg-white/80 backdrop-blur-lg rounded-3xl p-8 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Team Portal</h3>
            <p className="text-gray-500 leading-relaxed">
              Sign in to submit and manage your team's project details and images.
            </p>
          </Link>

          {/* Admin Portal */}
          <Link href="/vote/admin/login" className="group relative bg-gray-900 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center border border-gray-800">
            <div className="w-20 h-20 bg-gray-800 text-gray-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white group-hover:text-gray-900 transition-all duration-300 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Admin Portal</h3>
            <p className="text-gray-400 leading-relaxed">
              Secure access to create accounts and manage the voting system.
            </p>
          </Link>

        </div>
      </main>
    </div>
  );
}