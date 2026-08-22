// file: app/game/MyanmarTyping/page.tsx

"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

const MYANMAR_SENTENCES = [
  
  "မမ ဝဝ ထထ က၊ အက ပထမ။",
  "တို့များကျောင်းမှာ ပျော်စရာ၊ ဆရာမက ပုံပြောပြတာ။",
  "မြန်မာစာကို ကျွမ်းကျင်စွာ ရေးသားနိုင်ရန် နေ့စဉ် လေ့ကျင့်ပါ။",
  "နည်းပညာအသစ်များကို အမြဲတမ်း လေ့လာသင်ယူနေပါ။",
  "ကောင်းမွန်သော အနာဂတ်အတွက် ယနေ့မှစ၍ ကြိုးစားကြပါစို့။",
  "ပရိုဂရမ်ရေးသားခြင်းသည် တီထွင်ဖန်တီးမှုတစ်မျိုး ဖြစ်ပါသည်။",
  "အောင်မြင်မှုရရှိရန်အတွက် စိတ်ရှည်သည်းခံမှုနှင့် ဇွဲလုံ့လ လိုအပ်ပါသည်။",
  "အချိန်သည် ရွှေထက်တန်ဖိုးရှိသည်။ အချိန်ကို အကျိုးရှိစွာ အသုံးချပါ။",
  "ပညာရဲရင့် ပွဲလယ်တင့်။ ပညာရှာရမည့်အရွယ်တွင် ကြိုးစားရှာဖွေပါ။",
  "လုံ့လဝီရိယရှိသူအတွက် အောင်မြင်မှုသည် လက်တစ်ကမ်းတွင်ရှိသည်။",
  "စာအုပ်စာပေ လူ့မိတ်ဆွေ။ စာဖတ်ခြင်းဖြင့် ဗဟုသုတကို တိုးပွားစေပါ။",
  "ဆရာသမားတို့၏ ဆုံးမစကားကို နားထောင်ပြီး လိုက်နာကျင့်သုံးပါ။",
  "မီးကဲ့သို့ ပူပြင်းသော ဒေါသကို ခန္တီရေဖြင့် ငြိမ်းအေးစေပါ။",
  "ကျန်းမာခြင်းသည် လာဘ်တစ်ပါး ဖြစ်သည်။ ကျန်းမာရေးကို ဂရုစိုက်ပါ။",
  "ညီညာဖြဖြ တက်ညီလက်ညီ ကြိုးစားကြပါစို့။",
  "မြန်မာစာ မြန်မာစကားကို မြတ်နိုးတန်ဖိုးထားပါ။"
];

type GameState = "waiting" | "typing" | "finished";

export default function MyanmarTypingGame() {
  const [isMounted, setIsMounted] = useState(false);

  // Pick a random sentence to start
  const [sentenceIndex, setSentenceIndex] = useState(0);

  const targetText = MYANMAR_SENTENCES[sentenceIndex];

  const [inputVal, setInputVal] = useState("");
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * Prevent hydration mismatch.
   */
  useEffect(() => {
    setIsMounted(true);
    setSentenceIndex(Math.floor(Math.random() * MYANMAR_SENTENCES.length));
  }, []);

  /*
   * Myanmar Unicode grapheme segmentation.
   */
  const segmenter = useMemo(() => {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
      return new Intl.Segmenter("my", {
        granularity: "grapheme",
      });
    }
    return null;
  }, []);

  const getGraphemes = (text: string): string[] => {
    if (segmenter) {
      return Array.from(segmenter.segment(text), (item) => item.segment);
    }
    return Array.from(text);
  };

  const targetGraphemes = useMemo(
    () => getGraphemes(targetText),
    [targetText, segmenter]
  );

  const inputGraphemes = useMemo(
    () => getGraphemes(inputVal),
    [inputVal, segmenter]
  );

  const correctCharacters = useMemo(() => {
    let correct = 0;
    const count = Math.min(inputGraphemes.length, targetGraphemes.length);

    for (let i = 0; i < count; i++) {
      if (inputGraphemes[i] === targetGraphemes[i]) {
        correct++;
      }
    }
    return correct;
  }, [inputGraphemes, targetGraphemes]);

  const incorrectCharacters = useMemo(() => {
    return Math.max(0, inputGraphemes.length - correctCharacters);
  }, [inputGraphemes.length, correctCharacters]);

  const progress = useMemo(() => {
    if (targetGraphemes.length === 0) {
      return 0;
    }
    return Math.min(
      100,
      Math.round((inputGraphemes.length / targetGraphemes.length) * 100)
    );
  }, [inputGraphemes.length, targetGraphemes.length]);

  const calculateAccuracy = (typed: string[]) => {
    if (typed.length === 0) {
      return 100;
    }
    let correct = 0;
    const count = Math.min(typed.length, targetGraphemes.length);

    for (let i = 0; i < count; i++) {
      if (typed[i] === targetGraphemes[i]) {
        correct++;
      }
    }
    return Math.max(0, Math.round((correct / typed.length) * 100));
  };

  const calculateWpm = (characters: number, seconds: number) => {
    if (characters <= 0 || seconds <= 0) {
      return 0;
    }
    const minutes = seconds / 60;
    return Math.round(characters / 5 / minutes);
  };

  useEffect(() => {
    if (gameState !== "typing" || startTime === null) {
      return;
    }

    const interval = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setTimeElapsed(elapsed);
      setWpm(calculateWpm(inputGraphemes.length, elapsed));
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [gameState, startTime, inputGraphemes.length]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const typedGraphemes = getGraphemes(value);

    if (typedGraphemes.length > targetGraphemes.length) {
      return;
    }

    if (gameState === "waiting" && typedGraphemes.length > 0) {
      const now = Date.now();
      setStartTime(now);
      setGameState("typing");
    }

    setInputVal(value);

    const currentAccuracy = calculateAccuracy(typedGraphemes);
    setAccuracy(currentAccuracy);

    if (typedGraphemes.length === targetGraphemes.length) {
      const finishedAt = Date.now();
      const finalStartTime = startTime ?? finishedAt;
      const finalSeconds = (finishedAt - finalStartTime) / 1000;

      setTimeElapsed(finalSeconds);
      setWpm(calculateWpm(typedGraphemes.length, finalSeconds));
      setGameState("finished");
    }
  };

  const resetCurrentTest = () => {
    setInputVal("");
    setGameState("waiting");
    setStartTime(null);
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const nextSentence = () => {
    setInputVal("");
    setGameState("waiting");
    setStartTime(null);
    setTimeElapsed(0);
    setWpm(0);
    setAccuracy(100);

    setSentenceIndex((previous) => (previous + 1) % MYANMAR_SENTENCES.length);

    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
  };

  const isCurrentInputCorrect = useMemo(() => {
    if (inputGraphemes.length === 0) {
      return true;
    }
    const lastIndex = inputGraphemes.length - 1;
    return inputGraphemes[lastIndex] === targetGraphemes[lastIndex];
  }, [inputGraphemes, targetGraphemes]);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        html,
        body {
          font-family:
            "Noto Sans Myanmar",
            "Myanmar Text",
            "Padauk",
            "Myanmar3",
            sans-serif;
          /* Ensure no scrollbars appear on the body */
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        input,
        button {
          font-family:
            "Noto Sans Myanmar",
            "Myanmar Text",
            "Padauk",
            "Myanmar3",
            sans-serif;
        }

        .myanmar-text {
          font-family:
            "Noto Sans Myanmar",
            "Myanmar Text",
            "Padauk",
            "Myanmar3",
            sans-serif;

          font-feature-settings:
            "liga" 1,
            "clig" 1;

          font-kerning: normal;
          text-rendering: optimizeLegibility;
          font-synthesis: none;
        }
      `}</style>

      {/* h-[100dvh] guarantees fitting in one view without scrolling on mobile */}
      <main className="h-[100dvh] w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-2 sm:p-4">
        
        <div className="w-full max-w-4xl flex flex-col h-full max-h-[800px] justify-center">
          
          {/* Back to Menu Navigation */}
          <div className="w-full mb-3 px-2 shrink-0">
            <Link 
              href="/game" 
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-amber-400 transition-colors group"
            >
              <svg 
                className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK TO ARCADE
            </Link>
          </div>

          <section className="flex flex-col flex-1 overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl relative">
            
            {/* ================= STATS ================= */}
            <div className="px-3 pt-3 md:px-6 md:pt-6 shrink-0">
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {/* Speed */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-3 text-center transition-all duration-300">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500">Speed</p>
                  <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl md:text-3xl font-black text-emerald-400">{wpm}</p>
                </div>

                {/* Accuracy */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-3 text-center transition-all duration-300">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500">Accuracy</p>
                  <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl md:text-3xl font-black text-cyan-400">
                    {accuracy}<span className="text-xs sm:text-sm">%</span>
                  </p>
                </div>

                {/* Time */}
                <div className="rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950 p-2 sm:p-3 text-center transition-all duration-300">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500">Time</p>
                  <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl md:text-3xl font-black text-purple-400">
                    {Math.round(timeElapsed)}<span className="ml-1 text-xs sm:text-sm">s</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ================= TYPING SECTION ================= */}
            <div className="px-3 pb-3 pt-3 md:px-6 md:pb-6 flex flex-col flex-1 overflow-hidden">
              <div className="mb-2 flex items-end justify-between gap-2 shrink-0">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Type This Text
                  </p>
                </div>
                <div className="shrink-0 text-[10px] text-slate-600">
                  {sentenceIndex + 1} / {MYANMAR_SENTENCES.length}
                </div>
              </div>

              {/* ================= TARGET TEXT ================= */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="rounded-xl border-2 border-slate-800 bg-slate-950 px-3 py-3 sm:px-4 sm:py-5 cursor-text flex-1 overflow-y-auto custom-scrollbar flex items-center justify-center min-h-[80px]"
              >
                <div className="myanmar-text text-center text-lg sm:text-xl md:text-2xl leading-relaxed text-slate-400">
                  {targetText}
                </div>
              </div>

              {/* ================= LIVE CHECK ================= */}
              <div className="mt-2 sm:mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-2 sm:p-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "h-2 w-2 rounded-full shrink-0",
                        gameState === "finished"
                          ? "bg-emerald-400"
                          : gameState === "typing"
                            ? isCurrentInputCorrect
                              ? "bg-emerald-400"
                              : "bg-rose-400"
                            : "bg-amber-400",
                      ].join(" ")}
                    />
                    <div className="flex items-center gap-2">
                      <p className="myanmar-text text-[10px] sm:text-xs font-medium text-slate-300">
                        {gameState === "waiting" && "ဒီနေရာမှာ စတင်ရိုက်ထည့်ပါ"}
                        {gameState === "typing" &&
                          (isCurrentInputCorrect
                            ? "မှန်ကန်နေပါသည်"
                            : "စာသား မမှန်ပါ")}
                        {gameState === "finished" && "ပြီးဆုံးပါပြီ"}
                      </p>
                      <span className="text-[9px] sm:text-[10px] text-slate-600 hidden sm:inline">
                        ({correctCharacters} correct {incorrectCharacters > 0 && `· ${incorrectCharacters} wrong`})
                      </span>
                    </div>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-600">
                    {inputGraphemes.length} / {targetGraphemes.length}
                  </div>
                </div>
              </div>

              {/* ================= INPUT ================= */}
              <div className="mt-2 sm:mt-3 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  disabled={gameState === "finished"}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="ဒီနေရာမှာ စတင်ရိုက်ထည့်ပါ"
                  className={[
                    "myanmar-text w-full rounded-xl border-2 bg-slate-950 px-3 py-2.5 sm:px-4 sm:py-3",
                    "text-base sm:text-lg text-white outline-none transition-all",
                    "placeholder:text-slate-600 focus:border-amber-500",
                    "focus:ring-2 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60",
                  ].join(" ")}
                />
              </div>

              {/* ================= PROGRESS ================= */}
              <div className="mt-2 sm:mt-3 shrink-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* ================= RESULT / BUTTONS ================= */}
              <div className="mt-3 sm:mt-4 shrink-0 min-h-[60px]">
                {gameState === "finished" ? (
                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 sm:p-4">
                    <div className="flex flex-col text-center sm:text-left w-full sm:w-auto">
                      <p className="myanmar-text text-xs sm:text-sm font-bold text-emerald-400">
                        🎉 ကောင်းမွန်စွာ ရိုက်နှိပ်နိုင်ခဲ့ပါတယ်!
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-300 mt-1 uppercase tracking-wider font-sans">
                        Final Score: <span className="text-emerald-400 font-black">{wpm} WPM</span> &nbsp;•&nbsp; <span className="text-cyan-400 font-black">{accuracy}% ACC</span>
                      </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={resetCurrentTest}
                        className="myanmar-text flex-1 sm:flex-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                      >
                        ပြန်စမ်းမည်
                      </button>
                      
                      <button
                        type="button"
                        onClick={nextSentence}
                        className="myanmar-text flex-1 sm:flex-none rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 transition shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:bg-amber-400"
                      >
                        နောက်တစ်ခု (Next)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between h-full">
                    <p className="myanmar-text text-[9px] sm:text-[10px] text-slate-500 text-center sm:text-left">
                      စာရိုက်နေစဉ် အမြန်နှုန်းနှင့် တိကျမှုကို တစ်ချိန်တည်း တွက်ချက်ပေးပါသည်။
                    </p>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={resetCurrentTest}
                        className="myanmar-text flex-1 sm:flex-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                      >
                        ပြန်စမ်းမည် (Reset)
                      </button>
                      
                      <button
                        type="button"
                        onClick={nextSentence}
                        className="myanmar-text flex-1 sm:flex-none rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-amber-400 transition hover:bg-amber-500 hover:text-slate-950 border border-slate-700 hover:border-amber-500"
                      >
                        ကျော်မည် (Skip)
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="py-2 text-center mt-1 shrink-0">
            <p className="text-[9px] sm:text-[10px] text-slate-700">
              Myanmar Unicode Typing Practice
            </p>
          </footer>

        </div>
      </main>

      <style jsx global>{`
        /* Custom scrollbar for target text box if it gets too long on small screens */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
    </>
  );
}