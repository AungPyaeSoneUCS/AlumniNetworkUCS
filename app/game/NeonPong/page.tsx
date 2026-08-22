// file: app/typing/page.tsx

"use client";

import React, { useEffect, useRef, useState } from 'react';

// Game Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 7;
const WIN_SCORE = 5;
const INITIAL_BALL_SPEED = 4.5;

type GameState = 'start' | 'playing' | 'gameover';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Trail {
  x: number;
  y: number;
  life: number;
}

export default function NeonPong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  // Mutable game engine to prevent 60FPS React re-render lag
  const engine = useRef({
    frames: 0,
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 0, dy: 0 },
    playerX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    aiX: (CANVAS_WIDTH - PADDLE_WIDTH) / 2,
    keys: { left: false, right: false },
    particles: [] as Particle[],
    trails: [] as Trail[],
    shake: 0,
    volleyCount: 0,
    animationId: 0,
  });

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

  const resetBall = (servingToPlayer: boolean) => {
    engine.current.ball.x = CANVAS_WIDTH / 2;
    engine.current.ball.y = CANVAS_HEIGHT / 2;
    engine.current.ball.dx = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
    engine.current.ball.dy = servingToPlayer ? INITIAL_BALL_SPEED : -INITIAL_BALL_SPEED;
    engine.current.volleyCount = 0;
    engine.current.trails = [];
  };

  const startGame = () => {
    setPlayerScore(0);
    setAiScore(0);
    
    engine.current.particles = [];
    engine.current.trails = [];
    engine.current.playerX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    engine.current.aiX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    
    resetBall(true);
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    const draw = () => {
      const state = engine.current;
      state.frames++;

      // --- 1. Screen Shake & Clear ---
      ctx.save();
      if (state.shake > 0) {
        const dx = (Math.random() - 0.5) * state.shake;
        const dy = (Math.random() - 0.5) * state.shake;
        ctx.translate(dx, dy);
        state.shake -= 0.5; // decay
      }

      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // --- 2. Draw Retro Grid ---
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      const offset = (state.frames * 0.5) % 20;
      for (let i = 0; i < CANVAS_WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < CANVAS_HEIGHT; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i + offset);
        ctx.lineTo(CANVAS_WIDTH, i + offset);
        ctx.stroke();
      }

      // Draw Center Net (Glowing Dashed line)
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#334155';
      ctx.setLineDash([10, 15]);
      ctx.beginPath();
      ctx.moveTo(0, CANVAS_HEIGHT / 2);
      ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
      ctx.stroke();
      ctx.setLineDash([]); 
      ctx.shadowBlur = 0;

      // --- 3. Update AI Paddle Position (Lerp tracking) ---
      // AI smoothly follows the ball based on its center
      const aiCenter = state.aiX + PADDLE_WIDTH / 2;
      const targetX = state.ball.x;
      // Lerp (Linear Interpolation) factor. Increase for harder AI.
      state.aiX += (targetX - aiCenter) * 0.12; 
      // Clamp AI to bounds
      state.aiX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, state.aiX));

      // --- 4. Update Player Paddle Position ---
      if (state.keys.right && state.playerX < CANVAS_WIDTH - PADDLE_WIDTH) {
        state.playerX += 7;
      } else if (state.keys.left && state.playerX > 0) {
        state.playerX -= 7;
      }

      // --- 5. Draw Paddles ---
      const renderPaddle = (x: number, y: number, color: string) => {
        ctx.fillStyle = color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.roundRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.fill();
        // Inner bright core
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.roundRect(x + 5, y + 3, PADDLE_WIDTH - 10, PADDLE_HEIGHT - 6, 3);
        ctx.fill();
      };

      // AI Paddle (Top - Pink)
      renderPaddle(state.aiX, 15, '#ec4899'); // pink-500
      // Player Paddle (Bottom - Cyan)
      renderPaddle(state.playerX, CANVAS_HEIGHT - PADDLE_HEIGHT - 15, '#06b6d4'); // cyan-500

      // --- 6. Ball Physics & Collisions ---
      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      // Ball Trail Logic
      state.trails.push({ x: state.ball.x, y: state.ball.y, life: 1.0 });
      if (state.trails.length > 10) state.trails.shift(); // Keep last 10 frames

      // Draw Trail
      state.trails.forEach((t, i) => {
        const ratio = i / state.trails.length;
        ctx.beginPath();
        ctx.arc(t.x, t.y, BALL_RADIUS * ratio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(16, 185, 129, ${ratio * 0.5})`; // emerald shadow
        ctx.fill();
      });

      // Wall collisions (Left/Right)
      if (state.ball.x - BALL_RADIUS <= 0 || state.ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
        state.ball.dx = -state.ball.dx;
        // Push ball inside bounds to prevent sticking
        state.ball.x = state.ball.x - BALL_RADIUS <= 0 ? BALL_RADIUS + 1 : CANVAS_WIDTH - BALL_RADIUS - 1;
        spawnParticles(state.ball.x, state.ball.y, '#10b981', 8);
      }

      // AI Paddle Collision (Top)
      if (
        state.ball.dy < 0 && // Moving up
        state.ball.y - BALL_RADIUS <= 15 + PADDLE_HEIGHT &&
        state.ball.y - BALL_RADIUS > 10 &&
        state.ball.x + BALL_RADIUS >= state.aiX &&
        state.ball.x - BALL_RADIUS <= state.aiX + PADDLE_WIDTH
      ) {
        state.ball.dy = -state.ball.dy;
        state.ball.dy += 0.2; // Speed up slightly
        
        // English (spin)
        const hitPoint = state.ball.x - (state.aiX + PADDLE_WIDTH / 2);
        state.ball.dx = hitPoint * 0.15;
        
        spawnParticles(state.ball.x, state.ball.y + BALL_RADIUS, '#ec4899', 15);
        state.shake = 4;
        state.volleyCount++;
      }

      // Player Paddle Collision (Bottom)
      if (
        state.ball.dy > 0 && // Moving down
        state.ball.y + BALL_RADIUS >= CANVAS_HEIGHT - 15 - PADDLE_HEIGHT &&
        state.ball.y + BALL_RADIUS < CANVAS_HEIGHT - 10 &&
        state.ball.x + BALL_RADIUS >= state.playerX &&
        state.ball.x - BALL_RADIUS <= state.playerX + PADDLE_WIDTH
      ) {
        state.ball.dy = -state.ball.dy;
        state.ball.dy -= 0.2; // Speed up slightly
        
        // English (spin)
        const hitPoint = state.ball.x - (state.playerX + PADDLE_WIDTH / 2);
        state.ball.dx = hitPoint * 0.15;
        
        spawnParticles(state.ball.x, state.ball.y - BALL_RADIUS, '#06b6d4', 15);
        state.shake = 5;
        state.volleyCount++;
      }

      // --- 7. Draw Ball ---
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; 
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#10b981'; // Emerald glow
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- 8. Draw & Update Particles ---
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
          ctx.shadowBlur = 5;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
      ctx.shadowBlur = 0;

      // Restore context after screen shake
      ctx.restore(); 

      // --- 9. Scoring ---
      // Ball goes past AI (Player scores)
      if (state.ball.y < -BALL_RADIUS * 2) {
        setPlayerScore((prev) => {
          const nextScore = prev + 1;
          if (nextScore >= WIN_SCORE) setGameState('gameover');
          return nextScore;
        });
        if (playerScore + 1 < WIN_SCORE) resetBall(false);
      }

      // Ball goes past Player (AI scores)
      if (state.ball.y > CANVAS_HEIGHT + BALL_RADIUS * 2) {
        setAiScore((prev) => {
          const nextScore = prev + 1;
          if (nextScore >= WIN_SCORE) setGameState('gameover');
          return nextScore;
        });
        if (aiScore + 1 < WIN_SCORE) resetBall(true);
      }

      state.animationId = requestAnimationFrame(draw);
    };

    engine.current.animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(engine.current.animationId);
  }, [gameState, playerScore, aiScore]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) engine.current.keys.left = true;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) engine.current.keys.right = true;
      if (e.code === 'Space' && gameState !== 'playing') {
        e.preventDefault();
        startGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) engine.current.keys.left = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) engine.current.keys.right = false;
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Touch/Mouse paddle tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const relativeX = (e.clientX - rect.left) * scaleX;

    if (relativeX > 0 && relativeX < CANVAS_WIDTH) {
      engine.current.playerX = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, relativeX - PADDLE_WIDTH / 2));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-sans p-4 select-none touch-none">
      <div className="w-full flex flex-col items-center max-w-[400px]">
        
        {/* Header */}
        <div className="w-full flex justify-between items-end mb-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
            Neon Pong
          </h1>
        </div>

        {/* HUD */}
        <div className="w-full flex justify-between px-1 mb-2 text-sm font-bold tracking-wider">
          <span className="text-pink-500 shadow-pink-500/50 drop-shadow-md">AI: {aiScore}</span>
          <span className="text-cyan-400 shadow-cyan-400/50 drop-shadow-md">PLAYER: {playerScore}</span>
        </div>

        {/* Canvas Container */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-4 ring-slate-800 bg-slate-900 touch-none">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onPointerMove={handlePointerMove}
            className="w-full h-full block cursor-none"
          />

          {/* Start Screen */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="bg-slate-900/90 border border-cyan-500/30 p-6 rounded-2xl text-center max-w-[85%] shadow-2xl">
                <p className="text-slate-300 mb-6 text-sm">
                  First to <strong className="text-emerald-400">{WIN_SCORE}</strong> points wins.<br/><br/>Use <strong className="text-cyan-400">Arrows / A-D</strong> or <strong className="text-cyan-400">Touch & Drag</strong> to defend your sector.
                </p>
                <button 
                  onClick={startGame}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 w-full"
                >
                  START MATCH
                </button>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10">
              <h2 className={`text-5xl font-black mb-2 drop-shadow-lg ${playerScore > aiScore ? 'text-cyan-400 shadow-cyan-500/50' : 'text-pink-500 shadow-pink-500/50'}`}>
                {playerScore > aiScore ? 'VICTORY' : 'DEFEATED'}
              </h2>
              <p className="text-white text-lg mb-8">
                Final Score: <span className="font-bold text-emerald-400">{playerScore} - {aiScore}</span>
              </p>
              <button 
                onClick={startGame}
                className="px-10 py-4 bg-white text-slate-950 hover:bg-slate-200 font-bold text-xl rounded-full transition-all shadow-xl active:scale-95 hover:scale-105"
              >
                REMATCH
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}