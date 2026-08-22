// file: app/game/SlidingTilePuzzle/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const GRID_SIZE = 3;
const NUM_TILES = GRID_SIZE * GRID_SIZE;

// Helper to generate the winning state: [1, 2, 3, 4, 5, 6, 7, 8, 0]
const getSolvedState = () => [...Array(NUM_TILES - 1).keys()].map((n) => n + 1).concat(0);

// Calculates which tiles are allowed to slide into the empty space (0)
const getValidMoves = (emptyIndex: number) => {
  const validMoves = [];
  const row = Math.floor(emptyIndex / GRID_SIZE);
  const col = emptyIndex % GRID_SIZE;
  
  if (row > 0) validMoves.push(emptyIndex - GRID_SIZE); // up
  if (row < GRID_SIZE - 1) validMoves.push(emptyIndex + GRID_SIZE); // down
  if (col > 0) validMoves.push(emptyIndex - 1); // left
  if (col < GRID_SIZE - 1) validMoves.push(emptyIndex + 1); // right
  
  return validMoves;
};

export default function SlidingTilePuzzle() {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const startNewGame = useCallback(() => {
    let currentTiles = getSolvedState();
    let emptyIdx = NUM_TILES - 1;
    let lastMove = -1;
    
    // Shuffle by making random valid moves (guarantees the puzzle remains solvable)
    // 150 steps is enough to thoroughly scramble a 3x3 board
    for (let i = 0; i < 150; i++) {
      const validMoves = getValidMoves(emptyIdx);
      // Filter out the last move to prevent the shuffle from just bouncing back and forth
      const filteredMoves = validMoves.filter(m => m !== lastMove);
      const moveChoices = filteredMoves.length > 0 ? filteredMoves : validMoves;
      const randomMove = moveChoices[Math.floor(Math.random() * moveChoices.length)];
      
      [currentTiles[emptyIdx], currentTiles[randomMove]] = [currentTiles[randomMove], currentTiles[emptyIdx]];
      lastMove = emptyIdx;
      emptyIdx = randomMove;
    }
    
    setTiles(currentTiles);
    setMoves(0);
    setIsSolved(false);
    setIsReady(true);
  }, []);

  // Initialize the game on component mount
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleTileClick = (index: number) => {
    if (isSolved) return;
    
    const emptyIndex = tiles.indexOf(0);
    const validMoves = getValidMoves(emptyIndex);

    // If clicked tile is adjacent to the empty space, swap them
    if (validMoves.includes(index)) {
      const newTiles = [...tiles];
      [newTiles[emptyIndex], newTiles[index]] = [newTiles[index], newTiles[emptyIndex]];
      setTiles(newTiles);
      setMoves((m) => m + 1);
      
      // Check Win Condition
      const solved = getSolvedState();
      if (newTiles.every((val, i) => val === solved[i])) {
        setIsSolved(true);
      }
    }
  };

  // Prevent SSR Hydration mismatch flash
  if (!isReady) return null;

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-slate-950 font-mono p-2 sm:p-4 select-none touch-manipulation overflow-hidden">
      <div className="w-full flex flex-col items-center max-w-[500px] h-full justify-center">
        
        {/* Back to Menu Navigation */}
        <div className="w-full mb-2 sm:mb-4 shrink-0 px-2">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-blue-400 transition-colors group"
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
            NEON SLIDER
          </h1>
        </div>

        {/* HUD (Score) */}
        <div className="w-full flex justify-between items-center px-4 py-2 sm:py-3 mb-3 sm:mb-6 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-sm sm:text-base font-bold tracking-wider shrink-0">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest">Protocol</span>
            <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] mt-0.5">SEQUENCE REPAIR</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-widest">Moves</span>
            <span className="text-white text-lg sm:text-xl mt-0.5">{moves}</span>
          </div>
        </div>

        {/* Game Board Container - Strict scaling to fit 100dvh gracefully */}
        <div className="relative w-full aspect-square max-w-[min(100%,50vh)] sm:max-w-[400px] mx-auto rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)] ring-4 ring-slate-800 bg-slate-900 p-2 sm:p-4 overflow-hidden shrink-0">
          
          <div 
            className="w-full h-full grid gap-2 sm:gap-3" 
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          >
            {tiles.map((tile, index) => {
              const isEmpty = tile === 0;
              const emptyIndex = tiles.indexOf(0);
              const validMoves = getValidMoves(emptyIndex);
              const canMove = validMoves.includes(index) && !isSolved;

              return (
                <button
                  key={index}
                  onClick={() => handleTileClick(index)}
                  disabled={isEmpty || isSolved}
                  className={`
                    relative aspect-square flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black rounded-xl transition-all duration-200
                    ${isEmpty 
                      ? 'bg-slate-950/50 border-2 border-dashed border-slate-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]' 
                      : `bg-slate-800 border border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] ${canMove ? 'hover:bg-indigo-500 hover:text-white hover:border-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] cursor-pointer active:scale-95' : ''}`
                    }
                    ${isSolved && !isEmpty ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.8)]' : ''}
                  `}
                >
                  {!isEmpty && (
                    <span className="drop-shadow-md">
                      {tile}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Victory Screen Overlay */}
          {isSolved && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-4 sm:p-6 animate-in fade-in duration-500">
              <div className="bg-slate-900 border border-slate-700 p-5 sm:p-8 rounded-3xl text-center shadow-2xl w-full max-w-[320px]">
                <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-widest text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]">
                  RESTORED
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mb-6">
                  Grid realigned in <span className="text-white font-bold">{moves}</span> moves.
                </p>
                
                <button 
                  onClick={startNewGame}
                  className="w-full py-3 sm:py-4 bg-white text-slate-950 hover:bg-slate-200 font-black text-lg sm:text-xl rounded-xl transition-all shadow-xl active:scale-95"
                >
                  SCRAMBLE AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Reset Button (Only visible during play) */}
        {!isSolved && (
          <div className="w-full flex justify-center mt-4 sm:mt-6 shrink-0">
            <button
              onClick={startNewGame}
              className="px-6 py-3 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white text-slate-400 text-xs font-bold tracking-widest rounded-lg transition-colors shadow-md active:scale-95"
            >
              FORCE REBOOT (RESTART)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}