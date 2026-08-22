// file: app/game/MemoryMatch/page.tsx


"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// --- Game Constants & Assets ---
// 32 unique retro/cyberpunk icons to draw from dynamically
const ALL_ICONS = [
  "👾", "🔋", "💾", "💿", "🚀", "💻", "🕹️", "📡", 
  "⚡", "🔮", "🧬", "🧪", "⚙️", "🔧", "🧲", "💡", 
  "🛡️", "⚔️", "💣", "💎", "⏳", "🧭", "🗝️", "🔓", 
  "🎵", "🎧", "📸", "📼", "📱", "📟", "📺", "📻"
];
const PAIRS_NEEDED = 8; 

type GameState = "start" | "playing" | "win";

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function NeonMemoryMatch() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);

  // --- Shuffle & Initialize Deck ---
  const initializeGame = useCallback(() => {
    // Select 8 random unique icons from the pool of 32
    const shuffledIcons = [...ALL_ICONS]
      .sort(() => Math.random() - 0.5)
      .slice(0, PAIRS_NEEDED);

    // Create pairs and shuffle the final 16-card deck
    const shuffledDeck = [...shuffledIcons, ...shuffledIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(shuffledDeck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setTimeElapsed(0);
    setScore(0);
    setGameState("playing");
  }, []);

  // --- Timer ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === "playing") {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // --- Card Click Handler ---
  const handleCardClick = (index: number) => {
    // Ignore clicks if game is not active, card is already flipped/matched, or 2 cards are already flipping
    if (
      gameState !== "playing" ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      flippedIndices.length >= 2
    ) {
      return;
    }

    const newFlippedIndices = [...flippedIndices, index];
    setFlippedIndices(newFlippedIndices);

    // Optimistically flip the card
    setCards((prevCards) =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );

    // If two cards are flipped, check for a match
    if (newFlippedIndices.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIndex, secondIndex] = newFlippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[index]; // The one just clicked

      if (firstCard.icon === secondCard.icon) {
        // MATCH!
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card, i) =>
              i === firstIndex || i === secondIndex
                ? { ...card, isMatched: true }
                : card
            )
          );
          setFlippedIndices([]);
          
          setMatches((prev) => {
            const newMatches = prev + 1;
            if (newMatches === PAIRS_NEEDED) {
              handleWin();
            }
            return newMatches;
          });
        }, 500); // Short delay to let the flip animation finish
      } else {
        // NO MATCH
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card, i) =>
              i === firstIndex || i === secondIndex
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedIndices([]);
        }, 1000); // Give player a second to memorize
      }
    }
  };

  // --- Win Logic & Scoring ---
  const handleWin = useCallback(() => {
    setGameState("win");
    setScore(() => {
      // Base score 10,000. Deduct for excess moves and time.
      const movePenalty = moves * 50;
      const timePenalty = timeElapsed * 20;
      return Math.max(1000, 10000 - movePenalty - timePenalty);
    });
  }, [moves, timeElapsed]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      {/* 
        Custom CSS for 3D Card Flipping. 
      */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />

      {/* 100dvh and overflow-hidden prevent the desktop scrolling issue entirely */}
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-slate-950 font-mono p-2 sm:p-4 select-none touch-manipulation overflow-hidden">
        <div className="w-full flex flex-col items-center max-w-[600px] h-full justify-center">
          
          {/* Back to Menu Navigation */}
          <div className="w-full mb-2 sm:mb-4 shrink-0 px-2">
            <Link 
              href="/game" 
              className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-violet-400 transition-colors group"
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

          {/* Header */}
          <div className="w-full flex justify-between items-end mb-2 sm:mb-4 px-2 shrink-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
              NEON MATCH
            </h1>
          </div>

          {/* HUD (Heads Up Display) */}
          <div className="w-full flex justify-between items-center px-2 py-2 sm:py-3 mb-4 sm:mb-6 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-sm sm:text-base font-bold tracking-wider shrink-0">
            <div className="flex flex-col items-center w-1/3 border-r border-slate-800">
              <span className="text-slate-500 text-[10px] sm:text-xs uppercase">Moves</span>
              <span className="text-cyan-400 drop-shadow-md">{moves}</span>
            </div>
            <div className="flex flex-col items-center w-1/3 border-r border-slate-800">
              <span className="text-slate-500 text-[10px] sm:text-xs uppercase">Matches</span>
              <span className="text-emerald-400 drop-shadow-md">{matches} / 8</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <span className="text-slate-500 text-[10px] sm:text-xs uppercase">Time</span>
              <span className="text-pink-400 drop-shadow-md">{formatTime(timeElapsed)}</span>
            </div>
          </div>

          {/* Game Board Container - Shrinks to fit within 60% of viewport height to stay on screen natively */}
          <div className="relative w-full aspect-square max-w-[min(100%,60vh)] sm:max-w-[min(600px,60vh)] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.15)] ring-4 ring-slate-800 bg-slate-900 p-2 sm:p-4 lg:p-5 shrink-0">
            
            {/* 4x4 Grid */}
            <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
              {cards.map((card, index) => (
                <div 
                  key={card.id} 
                  onClick={() => handleCardClick(index)}
                  className="perspective-1000 w-full h-full cursor-pointer group active:scale-90 transition-transform duration-150"
                >
                  <div 
                    className={`relative w-full h-full duration-500 transform-style-3d transition-transform ease-out ${
                      card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* FRONT OF CARD (The Neon Back Design) */}
                    <div className="absolute inset-0 backface-hidden bg-slate-800 border-2 border-violet-500/50 rounded-lg sm:rounded-xl flex items-center justify-center shadow-[inset_0_0_15px_rgba(139,92,246,0.2)] group-hover:border-violet-400 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all">
                      {/* Circuit/Logo Pattern */}
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 sm:border-4 border-violet-500/30 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-violet-400 rounded-full shadow-[0_0_8px_#a78bfa]"></div>
                      </div>
                    </div>

                    {/* BACK OF CARD (The Icon) */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-slate-950 border-2 rounded-lg sm:rounded-xl flex items-center justify-center text-3xl sm:text-4xl md:text-5xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] ${
                      card.isMatched 
                        ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                        : 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    }`}>
                      <span className={card.isMatched ? 'animate-pulse opacity-50' : 'drop-shadow-lg'}>
                        {card.icon}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Start Screen Overlay */}
            {gameState === 'start' && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 sm:p-6">
                <div className="bg-slate-900 border border-violet-500/30 p-5 sm:p-8 rounded-2xl text-center shadow-2xl w-full max-w-sm">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-2 tracking-widest">SYSTEM READY</h2>
                  <p className="text-slate-400 mb-6 text-xs sm:text-sm">
                    Find all <strong className="text-emerald-400">8 pairs</strong> of matching modules.<br/>Minimize moves and time for a higher score.
                  </p>
                  <button 
                    onClick={initializeGame}
                    className="px-6 sm:px-8 py-3 bg-violet-500 hover:bg-violet-400 text-slate-950 font-black text-lg sm:text-xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.5)] active:scale-95 w-full"
                  >
                    BOOT SEQUENCE
                  </button>
                </div>
              </div>
            )}

            {/* Victory Screen Overlay */}
            {gameState === 'win' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-4 sm:p-6">
                <div className="text-center w-full max-w-md">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                    DECRYPTED
                  </h2>
                  <p className="text-white text-sm sm:text-base lg:text-lg mb-2">Memory Arrays Synchronized.</p>
                  
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 sm:p-4 my-4 sm:my-6 inline-block text-left shadow-lg">
                    <p className="text-slate-400 text-xs sm:text-sm lg:text-base mb-1">FINAL SCORE: <span className="text-cyan-400 font-bold ml-2 text-lg sm:text-xl lg:text-2xl">{score}</span></p>
                    <p className="text-slate-400 text-xs sm:text-sm lg:text-base mb-1">MOVES: <span className="text-white ml-2">{moves}</span></p>
                    <p className="text-slate-400 text-xs sm:text-sm lg:text-base">TIME: <span className="text-white ml-2">{formatTime(timeElapsed)}</span></p>
                  </div>

                  <button 
                    onClick={initializeGame}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-slate-950 hover:bg-slate-200 font-bold text-base sm:text-lg lg:text-xl rounded-full transition-all shadow-xl active:scale-95 hover:scale-105 w-full max-w-[250px]"
                  >
                    PLAY AGAIN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}