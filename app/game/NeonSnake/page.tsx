// file: app/game/NeonSnake/page.tsx

"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// --- Game Constants ---
const CANVAS_SIZE = 400;
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

type Difficulty = 'easy' | 'normal' | 'hard';
type GameState = 'start' | 'playing' | 'gameover';
type Point = { x: number; y: number };

const DIFFICULTY_SETTINGS = {
  easy: { initialSpeed: 180, minSpeed: 90, increment: 1, points: 5, color: 'text-cyan-400', border: 'border-cyan-500' },
  normal: { initialSpeed: 130, minSpeed: 60, increment: 2, points: 10, color: 'text-emerald-400', border: 'border-emerald-500' },
  hard: { initialSpeed: 80, minSpeed: 30, increment: 3, points: 20, color: 'text-rose-500', border: 'border-rose-500' },
};

export default function NeonSnake() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [gameState, setGameState] = useState<GameState>('start');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mutable game engine state to avoid React re-render lags during gameplay
  const engine = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    direction: { x: 0, y: -1 } as Point,      // Current moving direction
    nextDirection: { x: 0, y: -1 } as Point,  // Queued direction (prevents self-collision bug)
    food: { x: 5, y: 5 } as Point,
    lastRenderTime: 0,
    speed: 130,
    minSpeed: 60,
    speedIncrement: 2,
    pointsPerFood: 10,
    animationId: 0,
    touchStart: { x: 0, y: 0 }
  });

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    let isOccupied = true;
    while (isOccupied) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      isOccupied = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }
    return newFood!;
  }, []);

  const startGame = useCallback((selectedDiff: Difficulty = difficulty) => {
    const settings = DIFFICULTY_SETTINGS[selectedDiff];
    
    engine.current = {
      ...engine.current,
      snake: [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }],
      direction: { x: 0, y: -1 },
      nextDirection: { x: 0, y: -1 },
      speed: settings.initialSpeed,
      minSpeed: settings.minSpeed,
      speedIncrement: settings.increment,
      pointsPerFood: settings.points,
      lastRenderTime: 0,
    };
    engine.current.food = generateFood(engine.current.snake);
    setScore(0);
    setGameState('playing');
  }, [difficulty, generateFood]);

  const gameOver = () => {
    setGameState('gameover');
    setHighScore((prev) => Math.max(prev, score));
    cancelAnimationFrame(engine.current.animationId);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    const draw = (currentTime: number) => {
      engine.current.animationId = requestAnimationFrame(draw);

      const state = engine.current;
      const msSinceLastRender = currentTime - state.lastRenderTime;

      // Throttle game logic based on current speed
      if (msSinceLastRender < state.speed) return;
      state.lastRenderTime = currentTime;

      // --- 1. Update Logic ---
      state.direction = { ...state.nextDirection };
      const head = { ...state.snake[0] };
      head.x += state.direction.x;
      head.y += state.direction.y;

      // Collision: Walls
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
      }

      // Collision: Self
      if (state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
      }

      state.snake.unshift(head); // Add new head

      // Check if food eaten
      if (head.x === state.food.x && head.y === state.food.y) {
        setScore((prev) => prev + state.pointsPerFood);
        state.speed = Math.max(state.minSpeed, state.speed - state.speedIncrement); // Increase speed smoothly
        state.food = generateFood(state.snake);
      } else {
        state.snake.pop(); // Remove tail if no food eaten
      }

      // --- 2. Draw Graphics ---
      
      // Background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
      // Grid
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CANVAS_SIZE, i);
        ctx.stroke();
      }

      // Draw Food (Pulsing Glow)
      const fX = state.food.x * CELL_SIZE;
      const fY = state.food.y * CELL_SIZE;
      const pulse = Math.sin(currentTime / 200) * 2;
      
      ctx.fillStyle = '#f43f5e'; // rose-500
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f43f5e';
      ctx.beginPath();
      ctx.arc(fX + CELL_SIZE/2, fY + CELL_SIZE/2, (CELL_SIZE/2) - 3 + pulse, 0, 2 * Math.PI);
      ctx.fill();

      // Draw Snake
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#10b981'; // emerald-500
      
      state.snake.forEach((segment, index) => {
        const sX = segment.x * CELL_SIZE;
        const sY = segment.y * CELL_SIZE;
        
        // Head is brighter, body slightly darker
        ctx.fillStyle = index === 0 ? '#34d399' : '#10b981'; 
        
        // Slight padding to show segment separation
        ctx.fillRect(sX + 1, sY + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        // Draw Snake Eyes on the Head
        if (index === 0) {
          ctx.fillStyle = '#022c22'; // Dark emerald for eyes
          ctx.shadowBlur = 0;
          const eyeSize = 3;
          let e1x = 0, e1y = 0, e2x = 0, e2y = 0;

          // Position eyes based on direction
          if (state.direction.y === -1) { // Up
            e1x = sX + 4; e1y = sY + 4; e2x = sX + CELL_SIZE - 7; e2y = sY + 4;
          } else if (state.direction.y === 1) { // Down
            e1x = sX + 4; e1y = sY + CELL_SIZE - 7; e2x = sX + CELL_SIZE - 7; e2y = sY + CELL_SIZE - 7;
          } else if (state.direction.x === -1) { // Left
            e1x = sX + 4; e1y = sY + 4; e2x = sX + 4; e2y = sY + CELL_SIZE - 7;
          } else if (state.direction.x === 1) { // Right
            e1x = sX + CELL_SIZE - 7; e1y = sY + 4; e2x = sX + CELL_SIZE - 7; e2y = sY + CELL_SIZE - 7;
          }

          ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
          ctx.fillRect(e2x, e2y, eyeSize, eyeSize);
        }
      });
      
      ctx.shadowBlur = 0; // reset
    };

    engine.current.animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(engine.current.animationId);
  }, [gameState, score, generateFood]); 

  // Direct Control Function for D-Pad
  const changeDirection = useCallback((newX: number, newY: number) => {
    const { direction } = engine.current;
    if (newX !== 0 && direction.x !== -newX) engine.current.nextDirection = { x: newX, y: 0 };
    if (newY !== 0 && direction.y !== -newY) engine.current.nextDirection = { x: 0, y: newY };
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Start game on spacebar
      if (e.code === 'Space') {
        if (gameState !== 'playing') {
          e.preventDefault();
          startGame(difficulty);
        }
        return;
      }

      // Prevent scrolling with arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (gameState === 'playing') {
        switch (e.key) {
          case 'ArrowUp': case 'w': case 'W': changeDirection(0, -1); break;
          case 'ArrowDown': case 's': case 'S': changeDirection(0, 1); break;
          case 'ArrowLeft': case 'a': case 'A': changeDirection(-1, 0); break;
          case 'ArrowRight': case 'd': case 'D': changeDirection(1, 0); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, difficulty, changeDirection, startGame]);

  // Touch / Swipe Controls
  const handleTouchStart = (e: React.TouchEvent) => {
    engine.current.touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - engine.current.touchStart.x;
    const dy = touchEndY - engine.current.touchStart.y;
    
    // Swipe threshold to prevent accidental taps
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 1 : -1, 0);
    } else {
      changeDirection(0, dy > 0 ? 1 : -1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-slate-950 font-sans p-2 sm:p-4 touch-none select-none overflow-hidden">
      <div className="w-full flex flex-col items-center max-w-lg h-full justify-center">
        
        {/* Back to Menu Navigation */}
        <div className="w-full mb-2 sm:mb-4 px-2 shrink-0">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-emerald-400 transition-colors group"
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
        <div className="mb-2 sm:mb-4 flex flex-col items-center w-full shrink-0">
          <div className="w-full flex justify-between items-end px-2">
            <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              NEON_SNAKE
            </h1>

            {/* Full Screen Toggle Button */}
            <button 
              onClick={toggleFullScreen}
              className="bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:border-slate-500 text-slate-300 p-2 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              )}
            </button>
          </div>

          {/* HUD */}
          <div className="w-full flex justify-between px-2 mt-3 sm:mt-4 text-sm sm:text-base font-bold tracking-wider">
            <span className="text-emerald-400">SCORE: {score}</span>
            <span className="text-cyan-400">HIGH: {highScore}</span>
          </div>
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className={`relative w-full aspect-square max-w-[min(100%,60vh)] sm:max-w-[min(400px,60vh)] rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-4 ring-slate-800 bg-slate-900 touch-none shrink-0 ${isFullscreen ? 'h-screen rounded-none ring-0 max-w-none' : ''}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-full h-full object-contain block"
          />

          {/* Start Screen Overlays */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
              <div className="bg-slate-900/90 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl text-center shadow-2xl w-full max-w-[90%]">
                
                <h3 className="text-slate-300 font-bold mb-3 tracking-widest uppercase text-sm">Select Difficulty</h3>
                
                {/* Difficulty Selector */}
                <div className="flex justify-center gap-2 mb-6">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map((level) => {
                    const isActive = difficulty === level;
                    const settings = DIFFICULTY_SETTINGS[level];
                    return (
                      <button
                        key={level}
                        onClick={() => setDifficulty(level)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                          isActive 
                            ? `${settings.color} border-2 ${settings.border} bg-slate-950 shadow-[0_0_10px_currentColor]` 
                            : 'text-slate-500 border-2 border-slate-800 hover:border-slate-600 bg-slate-900'
                        }`}
                      >
                        {level}
                      </button>
                    )
                  })}
                </div>

                <p className="text-slate-400 mb-6 text-xs sm:text-sm">Use <strong className="text-emerald-400">WASD</strong>, <strong className="text-emerald-400">Arrows</strong>, <strong className="text-emerald-400">D-Pad</strong>, or <strong className="text-emerald-400">Swipe</strong> to move.</p>
                
                <button 
                  onClick={() => startGame(difficulty)}
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 w-full"
                >
                  START GAME
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-4">
              <div className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl text-center shadow-2xl w-full max-w-[90%]">
                <h2 className="text-4xl sm:text-5xl font-black text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">CRASHED!</h2>
                <p className="text-white text-lg sm:text-xl mb-8">
                  Final Score: <span className="font-bold text-emerald-400">{score}</span>
                </p>
                <button 
                  onClick={() => startGame(difficulty)}
                  className="px-8 py-3 bg-white text-rose-900 hover:bg-slate-200 font-bold text-xl rounded-full transition-transform hover:scale-105 shadow-xl active:scale-95 w-full"
                >
                  TRY AGAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile D-Pad Controls */}
        <div className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 w-48 shrink-0 lg:hidden">
          <div />
          <button 
            onClick={() => changeDirection(0, -1)}
            className="bg-slate-900 active:bg-slate-800 text-emerald-500 p-4 rounded-xl flex items-center justify-center shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
          </button>
          <div />
          <button 
            onClick={() => changeDirection(-1, 0)}
            className="bg-slate-900 active:bg-slate-800 text-emerald-500 p-4 rounded-xl flex items-center justify-center shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => changeDirection(0, 1)}
            className="bg-slate-900 active:bg-slate-800 text-emerald-500 p-4 rounded-xl flex items-center justify-center shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button 
            onClick={() => changeDirection(1, 0)}
            className="bg-slate-900 active:bg-slate-800 text-emerald-500 p-4 rounded-xl flex items-center justify-center shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7-7" /></svg>
          </button>
        </div>

      </div>
    </div>
  );
}