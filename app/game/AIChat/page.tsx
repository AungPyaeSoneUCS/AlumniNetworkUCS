// file: app/game/AIChat/page.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

// --- Preset Data & Responses ---
const PRESET_QUESTIONS = [
  "ကွန်ပျူတာတက္ကသိုလ်(ဟင်္သာတ) ဆိုတာ ဘာလဲ",
  "UCSH ကို ဘယ်အချိန်က စတင်တည်ထောင်ခဲ့သလဲ",
  "တက္ကသိုလ်ရဲ့ မျှော်မှန်းချက် (Vision) ကဘာလဲ",
  "တက္ကသိုလ်ရဲ့ ရည်ရွယ်ချက် (Mission) တွေကဘာလဲ",
  "တက္ကသိုလ်ရဲ့ ရည်မှန်းချက်ပန်းတိုင် (Goals) တွေကဘာလဲ",
  "တက္ကသိုလ်ရဲ့ မူဝါဒ (Policy) တွေကဘာလဲ",
  "ဘယ်လိုဘွဲ့တွေ ပေးအပ်ချီးမြှင့်သလဲ",
  "ကွန်ပျူတာသိပ္ပံ ဆိုတာဘာလဲ",
  "ကွန်ပျူတာနည်းပညာဆိုတာ ဘာလဲ"
];

// Simple AI Response logic based on preset questions
const getAIResponse = (question: string): string => {
  if (question.includes("တည်ထောင်") || question.includes("ဘယ်အချိန်က")) {
    return "၂၀၀၁ ခုနှစ် စက်တင်ဘာလတွင် အစိုးရကွန်ပျူတာကောလိပ် (GCC) အဖြစ် စတင်တည်ထောင်ခဲ့ပြီး၊ ၂၀၀၇ ခုနှစ်တွင် ကွန်ပျူတာတက္ကသိုလ်(ဟင်္သာတ) [UCSH] အဖြစ် အဆင့်မြှင့်တင်ခဲ့ပါသည်။ တက္ကသိုလ်သည် ဧရာဝတီတိုင်းဒေသကြီး၊ ဟင်္သာတမြို့နယ်တွင် တည်ရှိပြီး သိပ္ပံနှင့်နည်းပညာဝန်ကြီးဌာန လက်အောက်တွင် ပါဝင်ပါသည်။";
  } else if (question.includes("မျှော်မှန်းချက်") || question.toLowerCase().includes("vision")) {
    return "UCSH ၏ မျှော်မှန်းချက် (Vision) များမှာ-\n(၁) ဒေသတွင်း ICT နည်းပညာများ ပြန့်ပွားစေရန်\n(၂) ဒေသတွင်း လိုအပ်သော ICT လူ့စွမ်းအားအရင်းအမြစ်များ ဖြည့်ဆည်းပေးရန်\n(၃) ဒေသတွင်း နယ်ပယ်အသီးသီးတွင် ICT အခြေခံ သုတေသနများ ပြုလုပ်ရန်\n(၄) ဒေသတွင်း ICT အခြေခံ စက်မှုလုပ်ငန်းများ ဖွံ့ဖြိုးတိုးတက်စေရန် တို့ဖြစ်ပါသည်။";
  } else if (question.includes("ရည်ရွယ်ချက်") || question.toLowerCase().includes("mission")) {
    return "UCSH ၏ ရည်ရွယ်ချက် (Mission) များမှာ-\n(၁) အရည်အသွေးပြည့်ဝသော ICT လူ့စွမ်းအားအရင်းအမြစ်များ မွေးထုတ်ရန်\n(၂) နိုင်ငံတကာစံနှုန်းများနှင့်အညီ ခေတ်မီသင်ရိုးညွှန်းတမ်းများဖြင့် ကျောင်းသားများကို သင်ကြားလေ့ကျင့်ပေးရန်\n(၃) နောက်ဆုံးပေါ်နည်းပညာများကို သင်ထောက်ကူပစ္စည်းများဖြင့် သင်ကြားပေးရန်\n(၄) သိပ္ပံနှင့်နည်းပညာ နယ်ပယ်အသီးသီးတွင် ICT အခြေခံ သုတေသနများ ပြုလုပ်ရန်\n(၅) နိုင်ငံတကာစံနှုန်းများနှင့်ကိုက်ညီသော တက္ကသိုလ်ပတ်ဝန်းကျင်ကောင်းတစ်ခု ဖြစ်လာစေရန် တို့ဖြစ်ပါသည်။";
  } else if (question.includes("ရည်မှန်းချက်") || question.includes("ပန်းတိုင်") || question.toLowerCase().includes("goal")) {
    return "UCSH ၏ ရည်မှန်းချက်ပန်းတိုင် (Objectives/Goals) များမှာ-\n(၁) သင်ကြားသင်ယူမှု အရည်အသွေးတိုးတက်စေရန်နှင့် အရည်အသွေးမီ လူ့စွမ်းအားအရင်းအမြစ်များ မွေးထုတ်ရန်\n(၂) ကျောင်းသားများ၏ ကာယ၊ ဉာဏ၊ စာရိတ္တ၊ မိတ္တ၊ ဘောဂ ဟူသော ဗလငါးတန် ဖွံ့ဖြိုးစေရန်\n(၃) နိုင်ငံတကာအဆင့်မီ သင်ရိုးများ၊ သင်ထောက်ကူများနှင့် နည်းပညာများကို အသုံးပြု၍ လေ့ကျင့်ပညာပေးရန်\n(၄) နိုင်ငံနှင့် ဒေသအကျိုးပြု e-government ဝန်ဆောင်မှုများကို အထောက်အကူပြုမည့် ပရောဂျက်များ ဖန်တီးရန်\n(၅) တက္ကသိုလ်၏ ပုံရိပ်ကို မြှင့်တင်ရန်နှင့် သန့်ရှင်း၊ လှပ၊ စိမ်းလန်းသော တက္ကသိုလ်ဖြစ်စေရန်\n(၆) Smart University တစ်ခုဖြစ်လာစေရန် တို့ဖြစ်ပါသည်။";
  } else if (question.includes("မူဝါဒ") || question.toLowerCase().includes("policy")) {
    return "UCSH ၏ မူဝါဒ (Policy) များမှာ-\n(၁) စာမေးပွဲအောင်ချက်ရာခိုင်နှုန်း တိုးတက်စေရန်\n(၂) သင်ကြားသင်ယူမှုအရည်အသွေး မြင့်မားတိုးတက်စေရန်\n(၃) နိုင်ငံတကာအဆင့်မီ တက္ကသိုလ်တစ်ခုအဖြစ် ရပ်တည်ရန်\n(၄) လူငယ်များ၏ ကာယနှင့် ဉာဏ ကျန်းမာရေး တိုးတက်စေရန်\n(၅) နိုင်ငံတော်၏ မူဝါဒများနှင့် ညွှန်ကြားချက်များကို အကောင်အထည်ဖော်ရန် တို့ဖြစ်ပါသည်။";
  } else if (question.includes("ဘွဲ့")) {
    return "ကွန်ပျူတာတက္ကသိုလ်(ဟင်္သာတ) သည် ပြည်တွင်းပြည်ပရှိ ကွန်ပျူတာသိပ္ပံနှင့် ကွန်ပျူတာနည်းပညာ နယ်ပယ်များအတွက် လိုအပ်သော လူ့စွမ်းအားအရင်းအမြစ်များကို ဖြည့်ဆည်းပေးရန် နိုင်ငံတကာအဆင့်မီ ကွန်ပျူတာသိပ္ပံဘွဲ့ (B.C.Sc.) နှင့် ကွန်ပျူတာနည်းပညာဘွဲ့ (B.C.Tech.) များကို ပေးအပ်ချီးမြှင့်လျက်ရှိပါသည်။";
  } else if (question.includes("ဟင်္သာတ") || question.includes("UCSH")) { 
    return "ကွန်ပျူတာတက္ကသိုလ်(ဟင်္သာတ) [UCSH] သည် ဧရာဝတီတိုင်းဒေသကြီး၊ ဟင်္သာတမြို့နယ်တွင် တည်ရှိပြီး သိပ္ပံနှင့်နည်းပညာဝန်ကြီးဌာန လက်အောက်ရှိ အဆင့်မြင့်ပညာတက္ကသိုလ်တစ်ခု ဖြစ်ပါသည်။ ၂၀၀၁ ခုနှစ်တွင် အစိုးရကွန်ပျူတာကောလိပ်အဖြစ် စတင်ခဲ့ပြီး ၂၀၀၇ တွင် တက္ကသိုလ်အဖြစ် ပြောင်းလဲဖွဲ့စည်းခဲ့ပါသည်။";
  } else if (question.includes("သိပ္ပံ")) {
    return "ကွန်ပျူတာသိပ္ပံ (Computer Science) ဆိုသည်မှာ ကွန်ပျူတာ ဆော့ဖ်ဝဲလ်စနစ်များ (Software Systems)၊ ပရိုဂရမ်ရေးသားခြင်း (Programming)၊ အယ်လ်ဂိုရီသမ် (Algorithms) များနှင့် အချက်အလက်များ (Data Structures) အကြောင်းကို အဓိကထား လေ့လာရသော ပညာရပ်ဖြစ်ပါသည်။";
  } else if (question.includes("နည်းပညာ")) {
    return "ကွန်ပျူတာနည်းပညာ (Computer Technology) ဆိုသည်မှာ ကွန်ပျူတာ ဟာ့ဒ်ဝဲလ်စနစ်များ (Hardware)၊ ကွန်ရက်ချိတ်ဆက်ခြင်း (Networking)၊ Embedded Systems နှင့် အီလက်ထရောနစ် ပစ္စည်းများ၏ လုပ်ဆောင်ပုံများကို လက်တွေ့ အသုံးချလေ့လာရသော ပညာရပ်ဖြစ်ပါသည်။";
  }
  return "မေးခွန်းအတွက် ကျေးဇူးတင်ပါသည်။ သင့်မေးခွန်းအား AI စနစ်မှ လက်ခံရရှိပြီး မှတ်တမ်းတင်ထားပါသည်။ နောက်ထပ်သိရှိလိုသည်များကို ဆက်လက်မေးမြန်းနိုင်ပါသည်။";
};

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isTyping?: boolean;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "မင်္ဂလာပါ။ NEON AI မှ ကြိုဆိုပါတယ်။ ကွန်ပျူတာတက္ကသိုလ်(ဟင်္သာတ) နှင့် ပတ်သက်၍ သင် သိရှိလိုသည်များကို မေးမြန်းနိုင်ပါသည်။",
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  const handleSend = (text: string) => {
    if (!text.trim() || isAiTyping) return;

    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsAiTyping(true);

    // 2. Simulate AI Processing & Typing delay
    setTimeout(() => {
      const aiResponseText = getAIResponse(text);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: "ai", text: aiResponseText };
      
      setMessages((prev) => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 1500); // 1.5s delay
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-950 font-sans text-slate-100 overflow-hidden selection:bg-cyan-500/30">
      
      {/* Background Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col h-full p-2 sm:p-4">
        
        {/* Navigation & Header */}
        <div className="w-full shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO ARCADE
          </Link>

          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest">
              NEON AI_CHAT
            </h1>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto w-full bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 custom-scrollbar backdrop-blur-sm">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] sm:max-w-[80%] p-3 sm:p-5 rounded-2xl text-sm sm:text-base leading-relaxed whitespace-pre-line ${
                  msg.sender === "user" 
                    ? "bg-cyan-600/20 border border-cyan-500/50 text-cyan-50 rounded-br-none shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                    : "bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-none shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                }`}
              >
                {msg.sender === "ai" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">NEON_AI</span>
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isAiTyping && (
            <div className="flex w-full justify-start animate-in fade-in duration-300">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-bl-none p-4 flex gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          
          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input & Preset Area */}
        <div className="w-full shrink-0 mt-4 flex flex-col gap-3">
          
          {/* Preset Chips */}
          <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar snap-x">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isAiTyping}
                className="shrink-0 snap-start bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950 hover:border-cyan-400 px-4 py-2 rounded-full text-xs sm:text-sm transition-all whitespace-nowrap active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Form */}
          <form 
            onSubmit={handleSubmit}
            className="flex gap-2 bg-slate-900/80 border border-slate-700 p-2 rounded-full shadow-lg backdrop-blur-md focus-within:border-cyan-500 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isAiTyping}
              placeholder="သင်သိရှိလိုသည်များကို မေးမြန်းပါ..."
              className="flex-1 bg-transparent border-none outline-none px-4 text-slate-100 text-sm sm:text-base placeholder:text-slate-500 disabled:opacity-50"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isAiTyping}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-90"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>

      </div>

      {/* Global Styles for Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}