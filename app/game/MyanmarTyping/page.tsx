// file: app/typing/page.tsx

"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const MYANMAR_SENTENCES = [
  "မမ ဝဝ ထထ က၊ အက ပထမ။",
  "ဘဘ ဦးဦး ထီးထီး ယူ၊ ယူ ယူ ရိုရို ယူ။",
  "ဖိုးထောင် လာပြီ ခြင်္သေ့ကြီး၊ ဟောက်သံ ပေးလို့ ကြောက်စရာကြီး။",
  "ရွှေဖရုံသီး ဖရုံယို၊ စားလို့ကောင်းတဲ့ ဖရုံယို။",
  "ကြောင်ကလေး ဝါဝါ၊ ကြွက်ကလေး ရှာပါ။ ကြွက်ကလေး မတွေ့၊ ငိုလို့သာ နေ။",
  "တီတီတာတာ ဥဩဘာသာ၊ နွေအခါမှာ သာယာချိုအေး တေးသံပေး။",
  "ဖိုးရွှေလမင်း အဝိုင်းသား၊ ထိန်ထိန်လင်းလို့ သာပါလား။",
  "လွယ်အိတ်ကလေး လွယ်ကာသာ၊ ကျောင်းကိုသွားမယ် ရွှေမင်းသား။",
  "ဆင်ကလေး ရေကူး၊ နှာမောင်းလေး ကော့ထောင်၊ ပျော်စရာကောင်းတဲ့ ရေကန်ဘောင်။",
  "မိုးကလေးရွာ၊ ဖားကလေးအော်၊ ပျော်စရာကောင်းတဲ့ မိုးရာသီ။",
  "ပုရွက်ဆိတ်ကလေး ညီညီညာ၊ အစာရှာကြ သွားစို့လေ။",
  "ရွှေကျေးလေး သံသာသာ၊ ပျံကာသွားလို့ အစာရှာ။",
  "နေမင်းကြီး ထွက်လာပြီ၊ အလင်းရောင်ပေးလို့ ကြည်နူးစရာ။",
  "ကလေးငယ်ငယ် ပန်းကဲ့သို့၊ မွှေးကြိုင်လှပ လန်းဆန်းပါစေ။",
  "သစ်ပင်စိုက်လျှင် အရိပ်ရ၊ အေးမြချမ်းသာ အားလုံးအတွက်ပါ။",
  "စာအုပ်ခဲတံ အစုံယူ၊ ကျောင်းကိုသွားမယ် ရွှေမင်းသူ။",
  "ဖိုးရွှေကြာသီး ရေပေါ်မှာ၊ လှိုင်းကလေးပုတ်တော့ ကခုန်ရှာ။",
  "လိပ်ပြာကလေး လှပစွာ၊ ပန်းပွင့်ပေါ်မှာ နားခိုရှာ။",
  "ခေါင်းလောင်းလေးမြည် ဂျောင်ဂျင်ဂျင်၊ ကျောင်းတက်ချိန်ရောက်ပြီ လာကြစို့။",
  "တို့များကျောင်းမှာ ပျော်စရာ၊ ဆရာမက ပုံပြောပြ။"
];

type GameState = "waiting" | "typing" | "finished";

export default function MyanmarTypingGame() {
  const [isMounted, setIsMounted] = useState(false);

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

      {/* h-screen overflow-hidden guarantees fitting in one view */}
      <main className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          
          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* ================= STATS ================= */}
            <div className="px-4 pt-4 md:px-6 md:pt-6">
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {/* Speed */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Speed</p>
                  <p className="mt-1 text-2xl font-black text-emerald-400 md:text-3xl">{wpm}</p>
                </div>

                {/* Accuracy */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Accuracy</p>
                  <p className="mt-1 text-2xl font-black text-cyan-400 md:text-3xl">
                    {accuracy}<span className="text-sm">%</span>
                  </p>
                </div>

                {/* Time */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Time</p>
                  <p className="mt-1 text-2xl font-black text-purple-400 md:text-3xl">
                    {Math.round(timeElapsed)}<span className="ml-1 text-sm">s</span>
                  </p>
                </div>
              </div>
            </div>

            {/* ================= TYPING SECTION ================= */}
            <div className="px-4 pb-4 pt-4 md:px-6 md:pb-6">
              <div className="mb-2 flex items-end justify-between gap-2">
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
                className="rounded-xl border-2 border-slate-800 bg-slate-950 px-4 py-4 cursor-text"
              >
                <div className="myanmar-text text-center text-xl leading-relaxed text-slate-400 md:text-2xl">
                  {targetText}
                </div>
              </div>

              {/* ================= LIVE CHECK ================= */}
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
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
                            : "bg-cyan-400",
                      ].join(" ")}
                    />
                    <div className="flex items-center gap-2">
                      <p className="myanmar-text text-xs font-medium text-slate-300">
                        {gameState === "waiting" && "ဒီနေရာမှာ စတင်ရိုက်ထည့်ပါ"}
                        {gameState === "typing" &&
                          (isCurrentInputCorrect
                            ? "မှန်ကန်နေပါသည်"
                            : "စာသား မမှန်ပါ")}
                        {gameState === "finished" && "ပြီးဆုံးပါပြီ"}
                      </p>
                      <span className="text-[10px] text-slate-600 hidden sm:inline">
                        ({correctCharacters} correct {incorrectCharacters > 0 && `· ${incorrectCharacters} wrong`})
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600">
                    {inputGraphemes.length} / {targetGraphemes.length}
                  </div>
                </div>
              </div>

              {/* ================= INPUT ================= */}
              <div className="mt-3">
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
                    "myanmar-text w-full rounded-xl border-2 bg-slate-950 px-4 py-3",
                    "text-lg text-white outline-none transition-all",
                    "placeholder:text-slate-600 focus:border-cyan-500",
                    "focus:ring-2 focus:ring-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-60",
                  ].join(" ")}
                />
              </div>

              {/* ================= PROGRESS ================= */}
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* ================= RESULT / BUTTONS ================= */}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between h-[52px]">
                {gameState === "finished" ? (
                  <p className="myanmar-text text-sm font-bold text-emerald-400">
                    🎉 ကောင်းမွန်စွာ ရိုက်နှိပ်နိုင်ခဲ့ပါတယ်
                  </p>
                ) : (
                  <p className="myanmar-text text-[10px] text-slate-500 hidden sm:block">
                    စာရိုက်နေစဉ် အမြန်နှုန်းနှင့် တိကျမှုကို တစ်ချိန်တည်း တွက်ချက်ပေးပါသည်။
                  </p>
                )}

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={resetCurrentTest}
                    className="myanmar-text flex-1 sm:flex-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                  >
                    ပြန်စမ်းမည်
                  </button>
                  
                  <button
                    type="button"
                    onClick={nextSentence}
                    className="myanmar-text flex-1 sm:flex-none rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500 hover:text-slate-950 border border-slate-700 hover:border-cyan-500"
                  >
                    {gameState === "finished" ? "နောက်တစ်ခု" : "ကျော်မည် (Skip)"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-2 text-center mt-2">
            <p className="text-[10px] text-slate-700">
              Myanmar Unicode Typing Practice
            </p>
          </footer>

        </div>
      </main>
    </>
  );
}