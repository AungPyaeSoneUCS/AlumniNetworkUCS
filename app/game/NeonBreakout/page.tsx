// file: app/game/NeonBreakout/page.tsx

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

// --- Game Constants ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 120;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const INITIAL_BALL_SPEED = 6;

const BRICK_ROWS = 6;
const BRICK_COLS = 9;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 12;
const BRICK_OFFSET_TOP = 80;
const BRICK_OFFSET_LEFT = 37; // Center the grid: (800 - (9 * 70 + 8 * 12)) / 2

// Neon Theme Colors
const ROW_COLORS = [
  "#f43f5e", // rose-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
];

type GameState = "start" | "playing" | "gameover" | "win";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Brick {
  x: number;
  y: number;
  status: 1 | 0;
  color: string;
}

export default function NeonBreakout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mutable engine state (avoids React re-render lag)
  const engine = useRef({
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 },
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 40, dx: INITIAL_BALL_SPEED, dy: -INITIAL_BALL_SPEED },
    bricks: [] as Brick[],
    particles: [] as Particle[],
    keys: { left: false, right: false },
    score: 0,
    animationId: 0,
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

  const initBricks = () => {
    const bricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
          y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
          status: 1,
          color: ROW_COLORS[r % ROW_COLORS.length],
        });
      }
    }
    return bricks;
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      engine.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color,
        size: Math.random() * 3 + 1,
      });
    }
  };

  const startGame = useCallback((keepScore: boolean = false) => {
    engine.current = {
      ...engine.current,
      paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 },
      ball: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 50,
        dx: (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED,
        dy: -INITIAL_BALL_SPEED,
      },
      bricks: initBricks(),
      particles: [],
      score: keepScore ? engine.current.score : 0,
    };
    setScore(engine.current.score);
    setGameState("playing");
  }, []);

  const endGame = (status: "gameover" | "win") => {
    setGameState(status);
    if (engine.current.score > highScore) {
      setHighScore(engine.current.score);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const loop = () => {
      const state = engine.current;

      // --- 1. Background ---
      ctx.fillStyle = "#0f172a"; // slate-900
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === "playing") {
        // --- 2. Move Paddle ---
        const paddleSpeed = 9;
        if (state.keys.right && state.paddle.x < CANVAS_WIDTH - PADDLE_WIDTH) {
          state.paddle.x += paddleSpeed;
        } else if (state.keys.left && state.paddle.x > 0) {
          state.paddle.x -= paddleSpeed;
        }

        // --- 3. Move Ball ---
        state.ball.x += state.ball.dx;
        state.ball.y += state.ball.dy;

        // Wall Collision (Left / Right)
        if (state.ball.x + state.ball.dx > CANVAS_WIDTH - BALL_RADIUS || state.ball.x + state.ball.dx < BALL_RADIUS) {
          state.ball.dx = -state.ball.dx;
        }
        // Wall Collision (Top)
        if (state.ball.y + state.ball.dy < BALL_RADIUS) {
          state.ball.dy = -state.ball.dy;
        }
        // Bottom (Game Over)
        else if (state.ball.y + state.ball.dy > CANVAS_HEIGHT - BALL_RADIUS) {
          endGame("gameover");
          return;
        }

        // Paddle Collision
        if (
          state.ball.y + BALL_RADIUS >= CANVAS_HEIGHT - PADDLE_HEIGHT - 20 &&
          state.ball.x > state.paddle.x &&
          state.ball.x < state.paddle.x + PADDLE_WIDTH
        ) {
          state.ball.dy = -Math.abs(state.ball.dy); // Force ball upwards
          
          // Change ball angle based on where it hit the paddle
          const hitPoint = state.ball.x - (state.paddle.x + PADDLE_WIDTH / 2);
          state.ball.dx = (hitPoint / (PADDLE_WIDTH / 2)) * (INITIAL_BALL_SPEED + 2);
          
          spawnParticles(state.ball.x, state.ball.y, "#06b6d4", 5); // cyan spark
        }

        // Brick Collision
        let activeBricks = 0;
        for (let i = 0; i < state.bricks.length; i++) {
          const b = state.bricks[i];
          if (b.status === 1) {
            activeBricks++;
            if (
              state.ball.x > b.x &&
              state.ball.x < b.x + BRICK_WIDTH &&
              state.ball.y > b.y &&
              state.ball.y < b.y + BRICK_HEIGHT
            ) {
              state.ball.dy = -state.ball.dy; // Reverse ball
              b.status = 0; // Break brick
              state.score += 10;
              setScore(state.score);
              spawnParticles(b.x + BRICK_WIDTH / 2, b.y + BRICK_HEIGHT / 2, b.color, 15);
              
              // Slight speed increase over time
              if (Math.abs(state.ball.dy) < 12) {
                state.ball.dy += state.ball.dy > 0 ? 0.1 : -0.1;
              }
            }
          }
        }

        // Win Condition
        if (activeBricks === 0) {
          endGame("win");
          return;
        }
      }

      // --- 4. Draw Elements ---

      // Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;

        if (p.life <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
      ctx.shadowBlur = 0; // reset

      // Draw Bricks
      state.bricks.forEach((b) => {
        if (b.status === 1) {
          ctx.fillStyle = b.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = b.color;
          ctx.fillRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT);
          // Inner detail
          ctx.fillStyle = "rgba(255,255,255,0.2)";
          ctx.fillRect(b.x + 2, b.y + 2, BRICK_WIDTH - 4, 4);
        }
      });

      // Draw Paddle
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#06b6d4"; // cyan-500
      ctx.fillStyle = "#22d3ee"; // cyan-400
      const px = state.paddle.x;
      const py = CANVAS_HEIGHT - PADDLE_HEIGHT - 20;
      ctx.beginPath();
      ctx.roundRect(px, py, PADDLE_WIDTH, PADDLE_HEIGHT, 8);
      ctx.fill();

      // Draw Ball
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#f8fafc";
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0; // reset

      // Loop
      if (gameState !== "start") {
        state.animationId = requestAnimationFrame(loop);
      }
    };

    if (gameState === "playing" || gameState === "gameover" || gameState === "win") {
      engine.current.animationId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(engine.current.animationId);
  }, [gameState, highScore]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d") engine.current.keys.right = true;
      if (e.key === "ArrowLeft" || e.key === "a") engine.current.keys.left = true;
      
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState !== "playing") {
          startGame(gameState === "win"); // Keep score if starting next level
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d") engine.current.keys.right = false;
      if (e.key === "ArrowLeft" || e.key === "a") engine.current.keys.left = false;
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameState, startGame]);

  // Touch / Mouse Tracking for Mobile/Desktop Paddle Control
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    
    // Calculate pointer X relative to canvas internal resolution
    const pointerX = (e.clientX - rect.left) * scaleX;
    
    // Clamp paddle within bounds
    const newPaddleX = pointerX - PADDLE_WIDTH / 2;
    engine.current.paddle.x = Math.max(0, Math.min(newPaddleX, CANVAS_WIDTH - PADDLE_WIDTH));
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-slate-950 font-mono p-2 sm:p-4 touch-none select-none overflow-hidden">
      <div className="w-full flex flex-col items-center max-w-6xl h-full justify-center">
        
        {/* Back to Menu Navigation */}
        <div className="w-full mb-2 sm:mb-4 px-2 shrink-0 max-w-[800px]">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors group"
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
        <div className="mb-2 sm:mb-4 flex flex-col items-center w-full max-w-[800px] shrink-0">
          <div className="w-full flex justify-between items-end px-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-400 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              Neon Breakout
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
          
          <div className="flex justify-between w-full mt-3 sm:mt-4 px-2">
            <span className="text-cyan-400 font-bold text-sm sm:text-lg">SCORE: {score}</span>
            <span className="text-rose-400 font-bold text-sm sm:text-lg">HIGH: {highScore}</span>
          </div>
        </div>

        {/* Game Container */}
        <div 
          ref={containerRef}
          className={`relative w-full aspect-[4/3] max-w-[min(100%,80vh)] sm:max-w-[min(800px,80vh)] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-4 ring-slate-800 cursor-none bg-slate-900 shrink-0 ${isFullscreen ? 'h-screen rounded-none ring-0 max-w-none' : ''}`}
          onPointerMove={handlePointerMove}
          onPointerDown={(e) => {
            e.preventDefault();
            if (gameState !== "playing") startGame(gameState === "win");
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full object-contain block"
          />

          {/* Start Screen Overlay */}
          {gameState === "start" && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
              <div className="bg-slate-950/90 p-6 sm:p-8 rounded-3xl border border-cyan-500/30 text-center shadow-2xl w-full max-w-md">
                <p className="text-slate-300 mb-6 text-sm sm:text-base">
                  Use <strong className="text-cyan-400">Arrows/A-D</strong> or <strong className="text-cyan-400">Drag/Touch</strong> to move the paddle.<br/>Break all the blocks.
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="px-8 py-3 sm:py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl sm:text-2xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer w-full"
                >
                  INITIALIZE
                </button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] text-center">
                SIGNAL LOST
              </h2>
              <p className="text-white text-lg sm:text-xl mb-8">
                Final Score: <span className="font-bold text-cyan-400">{score}</span>
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-white hover:bg-slate-200 text-rose-900 font-black text-xl sm:text-2xl rounded-full transition-transform hover:scale-105 shadow-xl active:scale-95 cursor-pointer"
              >
                REBOOT SYSTEM
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {gameState === "win" && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] text-center">
                SYSTEM CLEARED
              </h2>
              <p className="text-white text-lg sm:text-xl mb-8 text-center">
                Flawless Execution. Score: <span className="font-bold text-cyan-400">{score}</span>
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(true); }}
                className="px-8 sm:px-10 py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xl sm:text-2xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
              >
                NEXT LEVEL
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}