// file: app/typing/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

// 100 Words scaled from Easy (Daily Objects) to Hard (Adulting & Concepts)
const DAILY_WORDS = [
  // Levels 1-10: Very Easy (3-4 letters)
  { word: "CUP", hint: "Used for drinking coffee or tea" },
  { word: "BED", hint: "Where you sleep every night" },
  { word: "KEY", hint: "Unlocks your front door" },
  { word: "SOAP", hint: "Used to wash your hands" },
  { word: "MILK", hint: "Often poured into cereal" },
  { word: "DOOR", hint: "You walk through this to enter a room" },
  { word: "SHOE", hint: "Footwear for leaving the house" },
  { word: "FORK", hint: "Utensil for eating dinner" },
  { word: "COMB", hint: "Used to tidy your hair" },
  { word: "WORK", hint: "Where you go to earn a living" },

  // Levels 11-20: Easy (4-5 letters)
  { word: "DESK", hint: "Where you sit to use a computer" },
  { word: "TIME", hint: "What a clock measures" },
  { word: "WASH", hint: "To clean your clothes or body" },
  { word: "ALARM", hint: "Wakes you up in the morning" },
  { word: "PHONE", hint: "Device you check constantly" },
  { word: "SLEEP", hint: "Resting at the end of the day" },
  { word: "WATER", hint: "Essential liquid to stay hydrated" },
  { word: "TOWEL", hint: "Used to dry off after a shower" },
  { word: "MONEY", hint: "Used to pay for daily expenses" },
  { word: "CLOCK", hint: "Tells you if you are running late" },

  // Levels 21-30: Easy-Medium (5-6 letters)
  { word: "CHAIR", hint: "Furniture you sit on" },
  { word: "TRAIN", hint: "Public transport on rails" },
  { word: "SHIRT", hint: "Clothing worn on the upper body" },
  { word: "COFFEE", hint: "Morning energy drink for many" },
  { word: "MIRROR", hint: "Look in this before leaving home" },
  { word: "DISHES", hint: "What you wash after eating" },
  { word: "WALLET", hint: "Holds your cash and cards" },
  { word: "SUBWAY", hint: "Underground public transportation" },
  { word: "TICKET", hint: "Required to board a bus or train" },
  { word: "BUDGET", hint: "Managing your monthly money" },

  // Levels 31-40: Medium (6-7 letters)
  { word: "WINDOW", hint: "Lets natural light into your home" },
  { word: "JACKET", hint: "Worn when the weather gets cold" },
  { word: "TRAFFIC", hint: "Cars stuck on the road during rush hour" },
  { word: "LAUNDRY", hint: "The chore of washing dirty clothes" },
  { word: "GARBAGE", hint: "What you take out on trash day" },
  { word: "ROUTINE", hint: "Your daily schedule of habits" },
  { word: "MORNING", hint: "The first part of the day" },
  { word: "EVENING", hint: "Time to wind down after work" },
  { word: "COOKING", hint: "Preparing a meal at home" },
  { word: "RUNNING", hint: "A common form of cardio exercise" },

  // Levels 41-50: Medium (7-8 letters)
  { word: "COMMUTE", hint: "The journey between home and work" },
  { word: "WEEKEND", hint: "Saturday and Sunday" },
  { word: "WORKOUT", hint: "Going to the gym to stay healthy" },
  { word: "MEETING", hint: "A gathering to discuss work topics" },
  { word: "SAVINGS", hint: "Money put away for the future" },
  { word: "WEATHER", hint: "Check this before choosing an outfit" },
  { word: "GROCERY", hint: "Store where you buy food" },
  { word: "CLEANING", hint: "Tidying up the house" },
  { word: "INVOICE", hint: "A bill received for services" },
  { word: "INTERNET", hint: "Essential connection for modern life" },

  // Levels 51-60: Medium-Hard (8-9 letters)
  { word: "CALENDAR", hint: "Used to track dates and appointments" },
  { word: "APPLIANCE", hint: "Fridge, oven, or washing machine" },
  { word: "FURNITURE", hint: "Sofas, tables, and beds" },
  { word: "PHARMACY", hint: "Where you pick up medicine" },
  { word: "DEADLINE", hint: "The time a task must be completed" },
  { word: "LANDLORD", hint: "The person you pay rent to" },
  { word: "RECYCLING", hint: "Separating plastic, paper, and glass" },
  { word: "EXPENSES", hint: "The cost required for daily living" },
  { word: "MECHANIC", hint: "Who you call when the car breaks down" },
  { word: "UTILITIES", hint: "Water, gas, and electric bills" },

  // Levels 61-70: Hard (9-10 letters)
  { word: "NUTRITION", hint: "Eating a balanced, healthy diet" },
  { word: "INSURANCE", hint: "Protection for health, car, or home" },
  { word: "MORTGAGE", hint: "A loan taken to buy a house" },
  { word: "RETIREMENT", hint: "Stopping work in older age" },
  { word: "INVESTMENT", hint: "Putting money into stocks or property" },
  { word: "INTERVIEW", hint: "Meeting to get a new job" },
  { word: "OVERTIME", hint: "Working extra hours" },
  { word: "PARENTING", hint: "The daily job of raising children" },
  { word: "OBLIGATION", hint: "A duty or commitment you must fulfill" },
  { word: "DEDUCTIBLE", hint: "Amount paid before insurance covers the rest" },

  // Levels 71-80: Hard (10-12 letters)
  { word: "MAINTENANCE", hint: "Keeping your car or house in working order" },
  { word: "APPOINTMENT", hint: "Scheduled time to see a doctor or dentist" },
  { word: "TEMPERATURE", hint: "How hot or cold it is outside" },
  { word: "CHOLESTEROL", hint: "Health metric checked by doctors" },
  { word: "METABOLISM", hint: "How fast your body burns food" },
  { word: "MULTITASKING", hint: "Doing several chores at the same time" },
  { word: "ORGANIZATION", hint: "Keeping your life and home orderly" },
  { word: "PRODUCTIVITY", hint: "Getting a lot of things done efficiently" },
  { word: "NEIGHBORHOOD", hint: "The local area where you live" },
  { word: "RELATIONSHIP", hint: "Managing a connection with a partner or friend" },

  // Levels 81-90: Very Hard (12-14 letters)
  { word: "INDEPENDENCE", hint: "Living on your own and relying on yourself" },
  { word: "SATISFACTION", hint: "Feeling content with your day" },
  { word: "PERSEVERANCE", hint: "Pushing through a difficult work week" },
  { word: "AUTHENTICITY", hint: "Being true to yourself in daily life" },
  { word: "DEPRECIATION", hint: "Your car losing value over time" },
  { word: "VULNERABILITY", hint: "Opening up emotionally to others" },
  { word: "COMMUNICATING", hint: "Talking clearly with colleagues or family" },
  { word: "PROCRASTINATE", hint: "Putting off doing the laundry until tomorrow" },
  { word: "COMPROMISING", hint: "Finding middle ground in a daily argument" },
  { word: "VOLUNTEERING", hint: "Giving free time to help the community" },

  // Levels 91-100: Expert (14+ letters / Complex concepts)
  { word: "SUSTAINABILITY", hint: "Living in a way that protects the environment" },
  { word: "RESPONSIBILITY", hint: "Taking ownership of your adult duties" },
  { word: "PRIORITIZATION", hint: "Deciding which daily task is most important" },
  { word: "ACCOMPLISHMENT", hint: "Finishing a major life goal" },
  { word: "ADMINISTRATION", hint: "Managing the paperwork of adult life" },
  { word: "INFRASTRUCTURE", hint: "The roads and grids that keep the city running" },
  { word: "ACCOUNTABILITY", hint: "Being answerable for your actions" },
  { word: "PROCRASTINATION", hint: "The habit of delaying important tasks" },
  { word: "INTERDEPENDENCE", hint: "Relying on others while they rely on you" },
  { word: "UNPREDICTABILITY", hint: "When life throws a sudden flat tire at you" },
];

const MAX_MISTAKES = 6;

type GameState = "playing" | "win" | "gameover" | "completed";

export default function DailyLifeHacker() {
  const [level, setLevel] = useState(1);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [score, setScore] = useState(0);

  // Derive current word from level
  const currentWordObj = useMemo(() => {
    // Array is 0-indexed, levels are 1-100
    const index = Math.min(level - 1, DAILY_WORDS.length - 1);
    return DAILY_WORDS[index];
  }, [level]);

  const resetBoard = useCallback(() => {
    setGuessedLetters(new Set());
    setMistakes(0);
    setGameState("playing");
  }, []);

  const handleNextLevel = useCallback(() => {
    if (level < 100) {
      setLevel((prev) => prev + 1);
      resetBoard();
    } else {
      setGameState("completed");
    }
  }, [level, resetBoard]);

  const handleGuess = useCallback(
    (letter: string) => {
      if (gameState !== "playing" || guessedLetters.has(letter)) return;

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      if (!currentWordObj.word.includes(letter)) {
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        if (newMistakes >= MAX_MISTAKES) {
          setGameState("gameover");
        }
      } else {
        // Check for win condition
        const isWon = currentWordObj.word
          .split("")
          .every((char) => newGuessed.has(char));
        
        if (isWon) {
          setGameState("win");
          // Give more points for harder levels
          setScore((prev) => prev + (100 * Math.ceil(level / 10)));
        }
      }
    },
    [gameState, guessedLetters, currentWordObj, mistakes, level]
  );

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      
      if (/^[A-Z]$/.test(letter)) {
        handleGuess(letter);
      } else if (e.code === "Enter" || e.code === "Space") {
        if (gameState === "win") {
          e.preventDefault();
          handleNextLevel();
        } else if (gameState === "gameover") {
          e.preventDefault();
          resetBoard(); // Retry same level
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGuess, gameState, handleNextLevel, resetBoard]);

  // Generate masked word view
  const maskedWord = currentWordObj.word
    .split("")
    .map((char) => (guessedLetters.has(char) ? char : "_"))
    .join(" ");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono p-4 select-none">
      <div className="w-full flex flex-col items-center max-w-[500px]">
        {/* Terminal Header */}
        <div className="w-full flex justify-between items-end mb-4 px-2">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              LIFE_HACKER v3.0
            </h1>
            <p className="text-slate-500 text-xs mt-1">SIMULATING DAILY EXISTENCE</p>
          </div>
          <div className="text-right">
            <span className="text-emerald-400 text-sm font-bold block mb-1">
              PTS: {score}
            </span>
            <span className="text-cyan-400 text-xs font-bold px-2 py-1 bg-cyan-950/50 border border-cyan-800 rounded">
              LVL {level}/100
            </span>
          </div>
        </div>

        {/* Terminal Container */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-4 ring-slate-800 bg-slate-900 p-6 flex flex-col items-center">
          
          {/* Security Status (Hangman Lives) */}
          <div className="w-full flex justify-between items-center mb-6 text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span>
              STRESS_LEVEL: <strong className="text-rose-500">{mistakes}/{MAX_MISTAKES}</strong>
            </span>
            <span className="text-emerald-500 animate-pulse">● ROUTINE_STABLE</span>
          </div>

          {/* Hint Box */}
          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-4 mb-6 text-center shadow-inner">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Current Challenge:
            </p>
            <p className="text-cyan-300 text-sm md:text-base">{currentWordObj.hint}</p>
          </div>

          {/* Word Display */}
          <div className="text-2xl md:text-3xl tracking-widest text-emerald-400 font-bold mb-8 text-center drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] flex flex-wrap justify-center gap-y-3">
            {maskedWord}
          </div>

          {/* Virtual Keyboard Grid */}
          <div className="grid grid-cols-7 gap-1.5 w-full mb-2">
            {alphabet.map((letter) => {
              const isGuessed = guessedLetters.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={isGuessed || gameState !== "playing"}
                  className={`py-2.5 rounded text-sm font-bold transition-all ${
                    isGuessed
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800"
                      : "bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-700 active:scale-95 shadow-sm"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Overlays for Win / Game Over / Completion */}
          {gameState !== "playing" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6 text-center">
              {gameState === "win" && (
                <>
                  <h2 className="text-3xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                    SUCCESS!
                  </h2>
                  <p className="text-slate-300 text-sm mb-6">
                    You navigated this daily challenge.
                  </p>
                  <button
                    onClick={handleNextLevel}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  >
                    {level === 100 ? "FINISH GAME" : "NEXT LEVEL"}
                  </button>
                </>
              )}

              {gameState === "gameover" && (
                <>
                  <h2 className="text-3xl font-black text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">
                    OVERWHELMED
                  </h2>
                  <p className="text-slate-300 text-sm mb-2">The challenge was:</p>
                  <p className="text-emerald-400 font-bold text-xl mb-6">
                    {currentWordObj.word}
                  </p>
                  <button
                    onClick={resetBoard}
                    className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-base rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(225,29,72,0.5)]"
                  >
                    RETRY LEVEL
                  </button>
                </>
              )}

              {gameState === "completed" && (
                <>
                  <h2 className="text-3xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                    LIFE MASTERED
                  </h2>
                  <p className="text-slate-300 text-sm mb-2">
                    You survived all 100 levels of daily existence.
                  </p>
                  <p className="text-emerald-400 font-bold text-lg mb-6">
                    Final Score: {score}
                  </p>
                  <button
                    onClick={() => {
                      setLevel(1);
                      setScore(0);
                      resetBoard();
                    }}
                    className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                  >
                    RESTART SIMULATION
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}