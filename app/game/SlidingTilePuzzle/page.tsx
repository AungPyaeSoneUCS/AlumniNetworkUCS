'use client';

import React, { useState, useEffect } from 'react';

const GRID_SIZE = 3;
const NUM_TILES = GRID_SIZE * GRID_SIZE;

// Helper to generate the winning state: [1, 2, 3, 4, 5, 6, 7, 8, 0]
const getSolvedState = () => [...Array(NUM_TILES - 1).keys()].map((n) => n + 1).concat(0);

export default function PuzzleGame() {
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isSolved, setIsSolved] = useState(false);

  // Initialize the game on component mount
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    let currentTiles = getSolvedState();
    let emptyIdx = NUM_TILES - 1;
    
    // Shuffle by making random valid moves (guarantees the puzzle remains solvable)
    for (let i = 0; i < 150; i++) {
      const validMoves = getValidMoves(emptyIdx);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [currentTiles[emptyIdx], currentTiles[randomMove]] = [currentTiles[randomMove], currentTiles[emptyIdx]];
      emptyIdx = randomMove;
    }
    
    setTiles(currentTiles);
    setMoves(0);
    setIsSolved(false);
  };

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
      checkWin(newTiles);
    }
  };

  const checkWin = (currentTiles: number[]) => {
    const solved = getSolvedState();
    if (currentTiles.every((val, index) => val === solved[index])) {
      setIsSolved(true);
    }
  };

  // Loading state while useEffect initializes the board
  if (tiles.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-slate-100 font-sans">
      <div className="max-w-md w-full p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Sliding Puzzle</h1>
            <p className="text-slate-400 mt-1">Order tiles from 1 to 8</p>
          </div>
          <div className="text-right">
            <span className="block text-sm text-slate-400 font-medium">MOVES</span>
            <span className="text-2xl font-bold text-white">{moves}</span>
          </div>
        </div>

        {/* Game Board */}
        <div 
          className="grid gap-2 mb-6" 
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
          {tiles.map((tile, index) => {
            const isEmpty = tile === 0;
            return (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                disabled={isEmpty || isSolved}
                className={`
                  relative aspect-square flex items-center justify-center text-3xl font-bold rounded-lg transition-all duration-200
                  ${isEmpty 
                    ? 'bg-slate-900/50 border-2 border-dashed border-slate-700' 
                    : 'bg-emerald-500 hover:bg-emerald-400 hover:-translate-y-1 shadow-lg text-white border-b-4 border-emerald-700 active:translate-y-0 active:border-b-0 cursor-pointer'}
                `}
              >
                {!isEmpty && tile}
              </button>
            );
          })}
        </div>

        {/* Controls & Win State */}
        <div className="flex flex-col items-center gap-4">
          {isSolved && (
            <div className="w-full p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-center animate-pulse">
              <span className="text-emerald-400 font-bold text-lg">🎉 Puzzle Solved in {moves} moves!</span>
            </div>
          )}
          
          <button
            onClick={startNewGame}
            className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            {isSolved ? 'Play Again' : 'Restart Game'}
          </button>
        </div>
        
      </div>
    </div>
  );
}