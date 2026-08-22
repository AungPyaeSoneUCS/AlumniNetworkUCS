// file: app/game/NeonTicTacToe/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from 'react';

type Player = 'X' | 'O' | null;
type GameMode = 'pvp' | 'ai' | null;

interface WinState {
  winner: Player | 'Draw';
  line: number[] | null;
}

// --- Winning Logic ---
const calculateWinner = (squares: Player[]): WinState | null => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  
  if (!squares.includes(null)) {
    return { winner: 'Draw', line: null };
  }
  
  return null;
};

// --- Smart AI Logic ---
const getAiMove = (squares: Player[]): number => {
  const emptyIndices = squares.map((sq, i) => sq === null ? i : null).filter(i => i !== null) as number[];
  
  // Helper to find a winning move for a given player
  const findWinningMove = (player: Player) => {
    for (let i of emptyIndices) {
      const boardCopy = [...squares];
      boardCopy[i] = player;
      if (calculateWinner(boardCopy)?.winner === player) return i;
    }
    return null;
  };

  // 1. Win if possible
  const winMove = findWinningMove('O');
  if (winMove !== null) return winMove;

  // 2. Block player 'X' from winning
  const blockMove = findWinningMove('X');
  if (blockMove !== null) return blockMove;

  // 3. Take the center if available
  if (emptyIndices.includes(4)) return 4;

  // 4. Take a random available corner or edge
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
};

export default function NeonTicTacToe() {
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [winState, setWinState] = useState<WinState | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0 });

  // --- Handle Cell Click ---
  const handleClick = useCallback((index: number) => {
    // Ignore click if cell is filled, game is over, or it's the AI's turn
    if (board[index] || winState || (gameMode === 'ai' && !xIsNext)) return;

    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    
    const result = calculateWinner(newBoard);
    if (result) {
      setWinState(result);
      if (result.winner === 'X') setScores(s => ({ ...s, X: s.X + 1 }));
      else if (result.winner === 'O') setScores(s => ({ ...s, O: s.O + 1 }));
    } else {
      setXIsNext(!xIsNext);
    }
  }, [board, winState, gameMode, xIsNext]);

  // --- AI Turn Effect ---
  useEffect(() => {
    if (gameMode === 'ai' && !xIsNext && !winState) {
      const timer = setTimeout(() => {
        const aiIndex = getAiMove(board);
        const newBoard = [...board];
        newBoard[aiIndex] = 'O';
        setBoard(newBoard);
        
        const result = calculateWinner(newBoard);
        if (result) {
          setWinState(result);
          if (result.winner === 'X') setScores(s => ({ ...s, X: s.X + 1 }));
          else if (result.winner === 'O') setScores(s => ({ ...s, O: s.O + 1 }));
        } else {
          setXIsNext(true);
        }
      }, 600); // Artificial delay for realism
      
      return () => clearTimeout(timer);
    }
  }, [xIsNext, gameMode, winState, board]);

  // --- Game Controls ---
  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinState(null);
  };

  const quitToMenu = () => {
    setGameMode(null);
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinState(null);
    setScores({ X: 0, O: 0 });
  };

  // --- Dynamic Styling Helpers ---
  const getCellClass = (index: number) => {
    const base = "flex items-center justify-center text-5xl md:text-7xl font-black rounded-lg transition-all duration-300";
    const bg = "bg-slate-950 hover:bg-slate-900";
    
    // Win highlighting
    if (winState?.line?.includes(index)) {
      if (winState.winner === 'X') return `${base} bg-cyan-950/80 shadow-[inset_0_0_20px_rgba(6,182,212,0.8)] border-2 border-cyan-400`;
      if (winState.winner === 'O') return `${base} bg-pink-950/80 shadow-[inset_0_0_20px_rgba(236,72,153,0.8)] border-2 border-pink-400`;
    }
    
    return `${base} ${bg}`;
  };

  const getSymbolClass = (player: Player) => {
    if (player === 'X') return "text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.9)]";
    if (player === 'O') return "text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.9)]";
    return "";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono p-4 select-none touch-manipulation">
      <div className="w-full flex flex-col items-center max-w-[450px]">
        
        {/* Header */}
        <div className="w-full flex justify-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            Neon TTT
          </h1>
        </div>

        {/* HUD (Score & Turn Indicator) */}
        {gameMode && (
          <div className="w-full grid grid-cols-3 gap-2 px-2 py-3 mb-6 bg-slate-900 border border-slate-800 rounded-xl shadow-inner text-sm font-bold tracking-wider">
            <div className={`flex flex-col items-center border-r border-slate-800 transition-opacity ${xIsNext && !winState ? 'opacity-100 scale-105' : 'opacity-50'}`}>
              <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">P1 (X)</span>
              <span className="text-white text-lg mt-1">{scores.X}</span>
            </div>
            
            <div className="flex flex-col items-center justify-center border-r border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase tracking-widest">Turn</span>
              {winState ? (
                <span className="text-emerald-400 mt-1 uppercase text-xs animate-pulse">Game Over</span>
              ) : (
                <span className={`text-xl mt-1 ${xIsNext ? 'text-cyan-400' : 'text-pink-500'}`}>
                  {xIsNext ? 'X' : 'O'}
                </span>
              )}
            </div>

            <div className={`flex flex-col items-center transition-opacity ${!xIsNext && !winState ? 'opacity-100 scale-105' : 'opacity-50'}`}>
              <span className="text-pink-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
                {gameMode === 'ai' ? 'CPU (O)' : 'P2 (O)'}
              </span>
              <span className="text-white text-lg mt-1">{scores.O}</span>
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="relative w-full aspect-square rounded-xl shadow-[0_0_40px_rgba(30,41,59,0.5)] ring-4 ring-slate-800 bg-slate-800 p-2 sm:p-3 overflow-hidden">
          
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2 sm:gap-3 bg-slate-800">
            {board.map((cell, index) => (
              <button
                key={index}
                onClick={() => handleClick(index)}
                disabled={cell !== null || winState !== null || (gameMode === 'ai' && !xIsNext)}
                className={getCellClass(index)}
              >
                <span className={`transform transition-transform duration-300 ${cell ? 'scale-100' : 'scale-0'} ${getSymbolClass(cell)}`}>
                  {cell}
                </span>
              </button>
            ))}
          </div>

          {/* Start Screen Overlay */}
          {!gameMode && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6">
              <div className="w-full max-w-[280px] space-y-4">
                <button 
                  onClick={() => setGameMode('ai')}
                  className="w-full py-4 bg-cyan-500/10 border-2 border-cyan-500 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-black text-xl rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)]"
                >
                  VS. SYSTEM (AI)
                </button>
                <button 
                  onClick={() => setGameMode('pvp')}
                  className="w-full py-4 bg-pink-500/10 border-2 border-pink-500 hover:bg-pink-500 text-pink-400 hover:text-slate-950 font-black text-xl rounded-xl transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.8)]"
                >
                  LOCAL CO-OP
                </button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {winState && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-6 animate-in fade-in duration-500">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl text-center shadow-2xl w-full max-w-[300px]">
                <h2 className="text-3xl font-black mb-4 tracking-widest drop-shadow-md">
                  {winState.winner === 'X' && <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">X WINS</span>}
                  {winState.winner === 'O' && <span className="text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">O WINS</span>}
                  {winState.winner === 'Draw' && <span className="text-slate-300">STALEMATE</span>}
                </h2>
                
                <div className="space-y-3">
                  <button 
                    onClick={resetBoard}
                    className="w-full py-3 bg-white text-slate-950 hover:bg-slate-200 font-bold text-lg rounded-xl transition-all shadow-xl active:scale-95"
                  >
                    PLAY AGAIN
                  </button>
                  <button 
                    onClick={quitToMenu}
                    className="w-full py-3 bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm rounded-xl transition-all active:scale-95 border border-slate-700"
                  >
                    CHANGE MODE
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}