// file: app/game/NeonBreakout/page.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

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

  const startGame = () => {
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
      score: 0,
    };
    setScore(0);
    setGameState("playing");
  };

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
  }, [gameState]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "d") engine.current.keys.right = true;
      if (e.key === "ArrowLeft" || e.key === "a") engine.current.keys.left = true;
      
      if (e.code === "Space") {
        e.preventDefault();
        if (gameState !== "playing") startGame();
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
  }, [gameState]);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono p-4 touch-none select-none">
      <div className="max-w-4xl w-full flex flex-col items-center">
        
        {/* Header */}
        <div className="mb-4 flex flex-col items-center w-full max-w-[800px]">
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-rose-400 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            Neon Breakout
          </h1>
          <div className="flex justify-between w-full mt-4 px-2">
            <span className="text-cyan-400 font-bold">SCORE: {score}</span>
            <span className="text-rose-400 font-bold">HIGH: {highScore}</span>
          </div>
        </div>

        {/* Game Container */}
        <div 
          className="relative w-full aspect-[4/3] max-w-[800px] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-4 ring-slate-800 cursor-none bg-slate-900"
          onPointerMove={handlePointerMove}
          onPointerDown={(e) => {
            e.preventDefault();
            if (gameState !== "playing") startGame();
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />

          {/* Start Screen Overlay */}
          {gameState === "start" && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <p className="text-slate-300 mb-6 text-center text-sm px-4">
                Use <strong className="text-white">Arrows/A-D</strong> or <strong className="text-white">Drag/Touch</strong> to move the paddle.<br/>Break all the blocks.
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
              >
                INITIALIZE
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === "gameover" && (
            <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <h2 className="text-4xl md:text-5xl font-black text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
                SIGNAL LOST
              </h2>
              <p className="text-white text-lg mb-8">
                Final Score: <span className="font-bold text-cyan-400">{score}</span>
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-8 py-4 bg-white hover:bg-slate-200 text-rose-900 font-black text-xl rounded-full transition-transform hover:scale-105 shadow-xl active:scale-95 cursor-pointer"
              >
                REBOOT SYSTEM
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {gameState === "win" && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <h2 className="text-4xl md:text-5xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                SYSTEM CLEARED
              </h2>
              <p className="text-white text-lg mb-8">
                Flawless Execution. Score: <span className="font-bold text-cyan-400">{score}</span>
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 cursor-pointer"
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