// file: app/typing/page.tsx

"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

// Game Constants
const CANVAS_SIZE = 400;
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const INITIAL_SPEED = 130; // ms per frame
const MIN_SPEED = 60; // Max speed cap
const SPEED_INCREMENT = 2; // Speed up per food eaten

type GameState = 'start' | 'playing' | 'gameover';
type Point = { x: number; y: number };

export default function NeonSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Mutable game engine state to avoid React re-render lags during gameplay
  const engine = useRef({
    snake: [{ x: 10, y: 10 }] as Point[],
    direction: { x: 0, y: -1 } as Point,      // Current moving direction
    nextDirection: { x: 0, y: -1 } as Point,  // Queued direction
    food: { x: 5, y: 5 } as Point,
    lastRenderTime: 0,
    speed: INITIAL_SPEED,
    animationId: 0,
    touchStart: { x: 0, y: 0 }
  });

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

  const startGame = () => {
    engine.current = {
      ...engine.current,
      snake: [{ x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) }],
      direction: { x: 0, y: -1 },
      nextDirection: { x: 0, y: -1 },
      speed: INITIAL_SPEED,
      lastRenderTime: 0,
    };
    engine.current.food = generateFood(engine.current.snake);
    setScore(0);
    setGameState('playing');
  };

  const gameOver = () => {
    setGameState('gameover');
    setHighScore((prev) => Math.max(prev, score));
    cancelAnimationFrame(engine.current.animationId);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const draw = (currentTime: number) => {
      engine.current.animationId = requestAnimationFrame(draw);

      const state = engine.current;
      const msSinceLastRender = currentTime - state.lastRenderTime;

      // Throttle game logic based on speed (simulates retro tick rate)
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
        setScore((prev) => prev + 10);
        state.speed = Math.max(MIN_SPEED, state.speed - SPEED_INCREMENT); // Increase speed smoothly
        state.food = generateFood(state.snake);
      } else {
        state.snake.pop(); // Remove tail if no food eaten
      }

      // --- 2. Draw Graphics ---
      
      // Background & Grid
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      
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
      if (e.code === 'Space' && gameState !== 'playing') {
        e.preventDefault();
        startGame();
        return;
      }

      // Prevent scrolling with arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': changeDirection(0, -1); break;
        case 'ArrowDown': case 's': case 'S': changeDirection(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': changeDirection(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': changeDirection(1, 0); break;
      }
    };

    // Add { passive: false } to allow e.preventDefault() on window level
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeDirection]);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-sans p-4 select-none touch-none">
      <div className="w-full flex flex-col items-center max-w-[400px]">
        
        {/* Game Header */}
        <div className="w-full flex justify-between items-end mb-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            NEON_SNAKE
          </h1>
        </div>

        {/* HUD */}
        <div className="w-full flex justify-between px-1 mb-2 text-sm font-bold tracking-wider">
          <span className="text-emerald-400">SCORE: {score}</span>
          <span className="text-cyan-400">HIGH: {highScore}</span>
        </div>

        {/* Canvas Container */}
        <div 
          className="relative w-full aspect-square rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-4 ring-slate-800 bg-slate-900 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-full h-full block"
          />

          {/* Overlays */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <p className="text-slate-300 mb-6 text-center text-sm px-4">Use WASD, Arrows, D-Pad, or Swipe to move</p>
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95"
              >
                START GAME
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10">
              <h2 className="text-4xl font-black text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">CRASHED!</h2>
              <p className="text-white text-lg mb-8">Final Score: <span className="font-bold text-emerald-400">{score}</span></p>
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-white text-rose-900 hover:bg-slate-200 font-bold text-lg rounded-xl transition-transform hover:scale-105 shadow-xl active:scale-95"
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Mobile D-Pad Controls */}
        <div className="mt-8 grid grid-cols-3 gap-2 w-48 sm:hidden">
          <div />
          <button 
            onClick={() => changeDirection(0, -1)}
            className="bg-slate-800 active:bg-slate-700 text-slate-400 p-4 rounded-lg flex items-center justify-center shadow-lg border border-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <div />
          <button 
            onClick={() => changeDirection(-1, 0)}
            className="bg-slate-800 active:bg-slate-700 text-slate-400 p-4 rounded-lg flex items-center justify-center shadow-lg border border-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={() => changeDirection(0, 1)}
            className="bg-slate-800 active:bg-slate-700 text-slate-400 p-4 rounded-lg flex items-center justify-center shadow-lg border border-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button 
            onClick={() => changeDirection(1, 0)}
            className="bg-slate-800 active:bg-slate-700 text-slate-400 p-4 rounded-lg flex items-center justify-center shadow-lg border border-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

      </div>
    </div>
  );
}