// file: app/game/MemoryMatch/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";

// --- Game Constants & Assets ---
const ICONS = ["👾", "🔋", "💾", "💿", "🚀", "💻", "🕹️", "📡"];
const DECK_SIZE = ICONS.length * 2; // 16 cards

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
    // Create pairs and shuffle
    const shuffledDeck = [...ICONS, ...ICONS]
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
            if (newMatches === ICONS.length) {
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
    setScore((prev) => {
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
        Tailwind doesn't have native perspective/preserve-3d utilities in v3 out of the box without plugins.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />

      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono p-4 select-none touch-manipulation">
        <div className="w-full flex flex-col items-center max-w-[500px]">
          
          {/* Header */}
          <div className="w-full flex justify-between items-end mb-4">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
              NEON MATCH
            </h1>
          </div>

          {/* HUD (Heads Up Display) */}
          <div className="w-full flex justify-between items-center px-2 py-3 mb-6 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-sm font-bold tracking-wider">
            <div className="flex flex-col items-center w-1/3 border-r border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Moves</span>
              <span className="text-cyan-400 drop-shadow-md">{moves}</span>
            </div>
            <div className="flex flex-col items-center w-1/3 border-r border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase">Matches</span>
              <span className="text-emerald-400 drop-shadow-md">{matches} / 8</span>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <span className="text-slate-500 text-[10px] uppercase">Time</span>
              <span className="text-pink-400 drop-shadow-md">{formatTime(timeElapsed)}</span>
            </div>
          </div>

          {/* Game Board Container */}
          <div className="relative w-full aspect-square max-w-[500px] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.15)] ring-4 ring-slate-800 bg-slate-900 p-4 sm:p-6">
            
            {/* 4x4 Grid */}
            <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-4 w-full h-full">
              {cards.map((card, index) => (
                <div 
                  key={card.id} 
                  onClick={() => handleCardClick(index)}
                  className="perspective-1000 w-full h-full cursor-pointer group"
                >
                  <div 
                    className={`relative w-full h-full duration-500 transform-style-3d transition-transform ease-out ${
                      card.isFlipped || card.isMatched ? "rotate-y-180" : ""
                    }`}
                  >
                    {/* FRONT OF CARD (The Neon Back Design) */}
                    <div className="absolute inset-0 backface-hidden bg-slate-800 border-2 border-violet-500/50 rounded-xl flex items-center justify-center shadow-[inset_0_0_15px_rgba(139,92,246,0.2)] group-hover:border-violet-400 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all">
                      {/* Circuit/Logo Pattern */}
                      <div className="w-8 h-8 rounded-full border-4 border-violet-500/30 flex items-center justify-center">
                        <div className="w-2 h-2 bg-violet-400 rounded-full shadow-[0_0_8px_#a78bfa]"></div>
                      </div>
                    </div>

                    {/* BACK OF CARD (The Icon) */}
                    <div className={`absolute inset-0 backface-hidden rotate-y-180 bg-slate-950 border-2 rounded-xl flex items-center justify-center text-3xl sm:text-4xl shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] ${
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
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6">
                <div className="bg-slate-900 border border-violet-500/30 p-6 rounded-2xl text-center shadow-2xl w-full">
                  <h2 className="text-2xl font-black text-white mb-2 tracking-widest">SYSTEM READY</h2>
                  <p className="text-slate-400 mb-6 text-sm">
                    Find all <strong className="text-emerald-400">8 pairs</strong> of matching modules.<br/>Minimize moves and time for a higher score.
                  </p>
                  <button 
                    onClick={initializeGame}
                    className="px-8 py-3 bg-violet-500 hover:bg-violet-400 text-slate-950 font-black text-xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(139,92,246,0.5)] active:scale-95 w-full"
                  >
                    BOOT SEQUENCE
                  </button>
                </div>
              </div>
            )}

            {/* Victory Screen Overlay */}
            {gameState === 'win' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6">
                <div className="text-center w-full">
                  <h2 className="text-4xl sm:text-5xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                    DECRYPTED
                  </h2>
                  <p className="text-white text-lg mb-2">Memory Arrays Synchronized.</p>
                  
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 my-6 inline-block text-left shadow-lg">
                    <p className="text-slate-400 text-sm mb-1">FINAL SCORE: <span className="text-cyan-400 font-bold ml-2 text-xl">{score}</span></p>
                    <p className="text-slate-400 text-sm mb-1">MOVES: <span className="text-white ml-2">{moves}</span></p>
                    <p className="text-slate-400 text-sm">TIME: <span className="text-white ml-2">{formatTime(timeElapsed)}</span></p>
                  </div>

                  <button 
                    onClick={initializeGame}
                    className="px-8 py-4 bg-white text-slate-950 hover:bg-slate-200 font-bold text-xl rounded-full transition-all shadow-xl active:scale-95 hover:scale-105 w-full max-w-[250px]"
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