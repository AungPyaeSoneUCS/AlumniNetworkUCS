// file: app/typing/page.tsx

"use client";

import React, { useEffect, useRef, useState } from 'react';

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 360;
const FLOOR_Y = 300; 
const PLAYER_SIZE = 60; // Doubled player size
const GROUND_Y = FLOOR_Y - PLAYER_SIZE;

const GRAVITY = 0.7;
const JUMP_POWER = -13; // Increased to compensate for larger scale
const BASE_OBSTACLE_SPEED = 7;
const MAX_SPEED_MULTIPLIER = 2.4;
const SPAWN_RATE_FRAMES = 85; 
const MAX_AIR_WALK_FUEL = 60; // 60 frames = 1 second of air walking

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

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
  type: 'tall' | 'floating' | 'short';
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
}

export default function EndlessRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Mutable engine state to bypass React renders for 60FPS performance
  const engine = useRef({
    frames: 0,
    score: 0,
    speedMultiplier: 1,
    keys: {} as Record<string, boolean>,
    player: { 
      x: 100, 
      y: GROUND_Y, 
      width: PLAYER_SIZE, 
      height: PLAYER_SIZE, 
      vy: 0, 
      jumps: 0,
      isAirWalking: false,
      airWalkFuel: MAX_AIR_WALK_FUEL
    },
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    stars: [] as Star[],
    animationId: 0,
  });

  // Initialize background stars once
  useEffect(() => {
    engine.current.stars = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * FLOOR_Y,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count: number, speed = 2) => {
    for (let i = 0; i < count; i++) {
      engine.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 1) * speed * 2,
        life: 1.0,
        color,
        size: Math.random() * 3 + 2,
      });
    }
  };

  const jump = () => {
    const state = engine.current;
    if (state.player.jumps < 2 && gameState === 'playing') {
      state.player.vy = JUMP_POWER;
      state.player.jumps++;
      
      // Jump particles
      spawnParticles(
        state.player.x + state.player.width / 2,
        state.player.y + state.player.height,
        '#34d399', 
        12,
        2
      );
    }
  };

  const startGame = () => {
    engine.current = {
      ...engine.current,
      frames: 0,
      score: 0,
      speedMultiplier: 1,
      keys: {},
      player: { 
        x: 100, 
        y: GROUND_Y, 
        width: PLAYER_SIZE, 
        height: PLAYER_SIZE, 
        vy: 0, 
        jumps: 0,
        isAirWalking: false,
        airWalkFuel: MAX_AIR_WALK_FUEL
      },
      obstacles: [],
      particles: [],
      animationId: 0,
    };
    setGameState('playing');
    setScore(0);
  };

  const gameOver = () => {
    setGameState('gameover');
    if (engine.current.score > highScore) {
      setHighScore(engine.current.score);
    }
    
    // Crash Explosion
    spawnParticles(
      engine.current.player.x + PLAYER_SIZE / 2,
      engine.current.player.y + PLAYER_SIZE / 2,
      '#f43f5e', 
      40,
      5
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Helper function for procedural human joints
    const drawLimb = (x: number, y: number, angle1: number, length1: number, angle2: number, length2: number, width: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(x, y);
      const jointX = x + Math.sin(angle1) * length1;
      const jointY = y + Math.cos(angle1) * length1;
      ctx.lineTo(jointX, jointY);

      if (length2 > 0) {
        const endX = jointX + Math.sin(angle2) * length2;
        const endY = jointY + Math.cos(angle2) * length2;
        ctx.lineTo(endX, endY);
      }
      ctx.stroke();
    };

    const loop = () => {
      const state = engine.current;
      
      // --- 1. Clear & Draw Background ---
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#64748b'; // slate-500
      state.stars.forEach(star => {
        if (gameState === 'playing') {
          star.x -= star.speed * state.speedMultiplier * 2;
          if (star.x < 0) {
            star.x = CANVAS_WIDTH;
            star.y = Math.random() * FLOOR_Y;
          }
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- 2. Game Logic ---
      if (gameState === 'playing') {
        state.frames++;
        
        if (state.frames % 300 === 0 && state.speedMultiplier < MAX_SPEED_MULTIPLIER) {
          state.speedMultiplier += 0.1;
        }

        // --- AIR WALK LOGIC ---
        const canAirWalk = state.player.y < GROUND_Y - 20 && state.player.vy >= -4 && state.player.airWalkFuel > 0;
        const isHoldingSpace = state.keys['Space'] || state.keys['ArrowUp'];
        const isHoldingRight = state.keys['ArrowRight'];

        if (isHoldingSpace && isHoldingRight && canAirWalk) {
          state.player.isAirWalking = true;
        } else {
          state.player.isAirWalking = false;
        }

        if (state.player.isAirWalking) {
          state.player.vy = 0; // Defy gravity
          state.player.airWalkFuel--;
          
          if (state.frames % 2 === 0) {
            spawnParticles(state.player.x, state.player.y + state.player.height - 10, '#0ea5e9', 3, 2); 
          }
        } else {
          state.player.vy += GRAVITY;
        }

        state.player.y += state.player.vy;

        if (state.player.y >= GROUND_Y) {
          state.player.y = GROUND_Y;
          state.player.vy = 0;
          state.player.jumps = 0;
          state.player.airWalkFuel = MAX_AIR_WALK_FUEL; 
          state.player.isAirWalking = false;
        }

        // Spawn Obstacles
        const currentSpawnRate = Math.max(40, Math.floor(SPAWN_RATE_FRAMES / state.speedMultiplier));

        if (state.frames % currentSpawnRate === 0) {
          const rand = Math.random();
          let type: Obstacle['type'] = 'short';
          let height = 40;
          let width = 30;
          let y = FLOOR_Y - height;

          if (rand > 0.8) {
            type = 'floating';
            height = 30;
            width = 45;
            y = FLOOR_Y - 100; 
          } else if (rand > 0.5) {
            type = 'tall';
            height = 75;
            y = FLOOR_Y - height;
          }

          state.obstacles.push({ x: CANVAS_WIDTH, y, width, height, passed: false, type });
        }
      }

      // --- 3. Draw Floor & Grid ---
      ctx.fillStyle = '#020617'; 
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);
      
      ctx.strokeStyle = '#065f46'; 
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y);
      ctx.lineTo(CANVAS_WIDTH, FLOOR_Y);
      ctx.stroke();

      if (gameState === 'playing' || gameState === 'gameover') {
        const lineOffset = (state.frames * BASE_OBSTACLE_SPEED * state.speedMultiplier) % 60;
        for (let i = CANVAS_WIDTH; i > 0; i -= 60) {
          const lx = i - lineOffset;
          ctx.beginPath();
          ctx.moveTo(lx, FLOOR_Y);
          ctx.lineTo(lx - 30, CANVAS_HEIGHT);
          ctx.strokeStyle = '#064e3b'; 
          ctx.stroke();
        }
      }

      // --- 4. Draw Particles ---
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02; 

        if (p.life <= 0) {
          state.particles.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }

      // --- 5. Draw Obstacles ---
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f43f5e';
      ctx.fillStyle = '#f43f5e'; 
      ctx.strokeStyle = '#fda4af'; 
      ctx.lineWidth = 2;

      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        
        if (gameState === 'playing') {
          obs.x -= BASE_OBSTACLE_SPEED * state.speedMultiplier;
        }

        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

        if (!obs.passed && state.player.x > obs.x + obs.width) {
          obs.passed = true;
          state.score += 10;
          setScore(state.score);
        }

        // Forgiving Hitboxes for the bigger human
        const hitPadX = 14;
        const hitPadY = 12;
        if (
          gameState === 'playing' &&
          state.player.x + hitPadX < obs.x + obs.width &&
          state.player.x + state.player.width - hitPadX > obs.x &&
          state.player.y + hitPadY < obs.y + obs.height &&
          state.player.y + state.player.height - hitPadY > obs.y
        ) {
          gameOver();
        }

        if (obs.x + obs.width < 0) {
          state.obstacles.splice(i, 1);
        }
      }

      // --- 6. Draw Player (Fluid Human Kinematics) ---
      if (gameState !== 'gameover') {
        const px = state.player.x;
        const py = state.player.y;
        const isJumping = state.player.y < GROUND_Y && !state.player.isAirWalking;
        const runCycle = state.frames * 0.3 * state.speedMultiplier;
        
        // Body segment lengths based on 60px size
        const cx = px + PLAYER_SIZE / 2; // Center X
        const bounce = (!isJumping && !state.player.isAirWalking) ? Math.max(0, Math.sin(runCycle * 2)) * 4 : 0;
        const neckY = py + 14 + bounce;
        const hipY = py + 34 + bounce;
        const thighLen = 14;
        const calfLen = 14;
        const upperArmLen = 12;
        const lowerArmLen = 12;

        ctx.shadowBlur = 15;
        ctx.shadowColor = '#10b981'; 
        
        // --- Calculate Joint Angles ---
        let lThigh, lCalf, rThigh, rCalf, lShoulder, lElbow, rShoulder, rElbow;
        
        if (state.player.isAirWalking) {
          // Hover/Air-Walk Pose (Leaning forward, legs trailing back, arms forward)
          lThigh = -0.5; lCalf = -0.8;
          rThigh = -0.2; rCalf = -0.6;
          lShoulder = 1.2; lElbow = 1.5;
          rShoulder = 1.0; rElbow = 1.2;
        } else if (isJumping) {
          if (state.player.jumps === 2) {
            // Double Jump (Tucked Flip Pose)
            lThigh = 1.2; lCalf = 2.5;
            rThigh = 0.8; rCalf = 2.0;
            lShoulder = -1.0; lElbow = -1.5;
            rShoulder = -0.5; rElbow = -1.0;
          } else {
            // Standard Leap (One knee up, one leg trailing)
            lThigh = 1.0; lCalf = 0.6;
            rThigh = -0.4; rCalf = -0.4;
            lShoulder = -0.8; lElbow = -0.5;
            rShoulder = 1.2; rElbow = 1.0;
          }
        } else {
          // Natural Running Cycle Trigonometry
          const legSwing = Math.sin(runCycle) * 0.9;
          const armSwing = -Math.sin(runCycle) * 0.9;

          lThigh = legSwing + 0.2; // +0.2 adds a slight forward lean
          rThigh = -legSwing + 0.2;
          
          // Knee bends naturally when swinging backward
          lCalf = lThigh - (Math.cos(runCycle) + 1) * 0.9;
          rCalf = rThigh - (Math.cos(runCycle + Math.PI) + 1) * 0.9;

          lShoulder = armSwing;
          rShoulder = -armSwing;
          lElbow = lShoulder + 0.7; // Constant slight bend at elbow
          rElbow = rShoulder + 0.7;
        }

        // Draw Right Limbs (Background) - Darker Color
        drawLimb(cx, hipY, rThigh, thighLen, rCalf, calfLen, 6, '#047857'); // Dark Emerald
        drawLimb(cx, neckY + 2, rShoulder, upperArmLen, rElbow, lowerArmLen, 5, '#047857');

        // Draw Torso (Slightly tilted forward)
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(cx, neckY);
        ctx.lineTo(cx - 2, hipY); // -2 leans the hips slightly back from the neck
        ctx.stroke();

        // Draw Head
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(cx + 2, neckY - 8, 8, 0, Math.PI * 2); // Leaning forward slightly
        ctx.fill();

        // Draw Left Limbs (Foreground) - Brighter Color
        drawLimb(cx, hipY, lThigh, thighLen, lCalf, calfLen, 6, '#34d399'); // Bright Emerald
        drawLimb(cx, neckY + 2, lShoulder, upperArmLen, lElbow, lowerArmLen, 5, '#34d399');
        
        ctx.shadowBlur = 0; 

        // Fuel Bar UI (Appears when in the air or fuel is low)
        if (state.player.y < GROUND_Y || state.player.airWalkFuel < MAX_AIR_WALK_FUEL) {
          const fuelRatio = Math.max(0, state.player.airWalkFuel / MAX_AIR_WALK_FUEL);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(px + 10, py - 15, 40, 5);
          ctx.fillStyle = fuelRatio > 0.3 ? '#0ea5e9' : '#f43f5e';
          ctx.fillRect(px + 10, py - 15, 40 * fuelRatio, 5);
        }
      }
      
      // --- 7. HUD ---
      if (gameState === 'playing') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`SCORE: ${state.score}`, 20, 35);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`SPEED: ${state.speedMultiplier.toFixed(1)}x`, 20, 60);
      }

      // Loop
      if (gameState !== 'start') {
        state.animationId = requestAnimationFrame(loop);
      }
    };

    if (gameState === 'playing' || gameState === 'gameover') {
      engine.current.animationId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(engine.current.animationId);
  }, [gameState]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      engine.current.keys[e.code] = true;

      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        if (e.repeat) return; 
        
        if (gameState === 'playing') jump();
        if (gameState === 'start' || gameState === 'gameover') startGame();
      }

      if (e.code === 'ArrowRight') {
        e.preventDefault(); 
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.current.keys[e.code] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Touch Event Listeners for Mobile
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (gameState === 'playing') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      
      engine.current.keys['Space'] = true;
      if (clickX > rect.width / 2) {
        // Tapping right half = Air Walk
        engine.current.keys['ArrowRight'] = true;
      }
      jump();
    } else {
      startGame();
    }
  };

  const handlePointerUp = () => {
    engine.current.keys['Space'] = false;
    engine.current.keys['ArrowRight'] = false;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono p-4 touch-none select-none">
      <div className="max-w-5xl w-full flex flex-col items-center">
        
        {/* Header */}
        <div className="mb-4 flex flex-col items-center w-full max-w-[800px]">
          <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            Neon Runner
          </h1>
          <div className="flex justify-between w-full mt-4 px-4">
            <span className="text-emerald-400 font-bold text-lg">SCORE: {score}</span>
            <span className="text-cyan-400 font-bold text-lg">HIGH: {highScore}</span>
          </div>
        </div>

        {/* Game Container */}
        <div 
          className="relative w-full aspect-[20/9] max-w-[800px] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.2)] ring-4 ring-slate-800 cursor-pointer bg-slate-900"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-full block"
          />

          {/* Start Screen Overlay */}
          {gameState === 'start' && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <div className="bg-slate-950/90 p-8 rounded-3xl border border-emerald-500/30 text-center shadow-2xl max-w-md mx-4">
                <p className="text-slate-300 mb-3 text-lg">
                  Press <strong className="text-emerald-400">SPACE</strong> or <strong className="text-emerald-400">TAP</strong> to jump.
                </p>
                <p className="text-slate-400 mb-8 text-sm">
                  Hold <strong className="text-cyan-400">SPACE + ➡️</strong> (or hold right-screen) in mid-air to <strong className="text-cyan-400">Air-Walk</strong>.
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-2xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 w-full"
                >
                  INITIALIZE
                </button>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-rose-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <h2 className="text-5xl md:text-6xl font-black text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
                SYSTEM FAILURE
              </h2>
              <p className="text-white text-xl mb-10">
                Run Score: <span className="font-bold text-emerald-400">{score}</span>
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                className="px-10 py-4 bg-white hover:bg-slate-200 text-rose-900 font-black text-2xl rounded-full transition-transform hover:scale-105 shadow-xl active:scale-95"
              >
                REBOOT SYSTEM
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}