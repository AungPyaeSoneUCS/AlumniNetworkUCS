// file: app/game/NeonOutpost/page.tsx

"use client";

import React, { useReducer, useEffect, useRef } from "react";
import Link from "next/link";

// --- Game Configuration & Types ---
const MAX_HEALTH = 100;
const RAID_INTERVAL = 5;
const BASE_RAID_DAMAGE = 30;
const DEFENSE_MITIGATION = 10;

type GameStatus = "playing" | "won" | "lost";

interface GameState {
  turn: number;
  baseHealth: number;
  power: number;
  metal: number;
  defenses: number;
  gameStatus: GameStatus;
  log: string[];
}

type ActionType =
  | { type: "GATHER_METAL" }
  | { type: "RECHARGE_CORE" }
  | { type: "BUILD_DEFENSE" }
  | { type: "REPAIR_BASE" }
  | { type: "BUILD_SHIP" }
  | { type: "RESET" };

const initialState: GameState = {
  turn: 1,
  baseHealth: 100,
  power: 10,
  metal: 0,
  defenses: 0,
  gameStatus: "playing",
  log: ["SYSTEM BOOT... WELCOME TO NEON OUTPOST.", "OBJECTIVE: SURVIVE AND BUILD ESCAPE SHIP."],
};

// --- Game Logic Reducer ---
const resolveTurn = (state: GameState, logMsg: string): GameState => {
  const newLog = [...state.log, logMsg];
  const newTurn = state.turn + 1;
  let newHealth = state.baseHealth;
  let newStatus = state.gameStatus;

  // Alien Raid Logic
  if (newTurn % RAID_INTERVAL === 0) {
    const damage = Math.max(0, BASE_RAID_DAMAGE - state.defenses * DEFENSE_MITIGATION);
    newHealth -= damage;
    newLog.push(
      `⚠️ ALIEN RAID! Hostiles breached perimeter. Took ${damage} damage. (${state.defenses} defenses active)`
    );

    if (newHealth <= 0) {
      newHealth = 0;
      newStatus = "lost";
      newLog.push("CRITICAL FAILURE: BASE DESTROYED. TRANSMISSION LOST.");
    }
  }

  return { ...state, turn: newTurn, baseHealth: newHealth, gameStatus: newStatus, log: newLog };
};

const gameReducer = (state: GameState, action: ActionType): GameState => {
  if (state.gameStatus !== "playing" && action.type !== "RESET") return state;

  switch (action.type) {
    case "GATHER_METAL":
      if (state.power >= 2) {
        const temp = { ...state, power: state.power - 2, metal: state.metal + 15 };
        return resolveTurn(temp, "> Gathered 15 Metal. Cost 2 Power.");
      }
      return state;

    case "RECHARGE_CORE":
      const tempCore = { ...state, power: state.power + 10 };
      return resolveTurn(tempCore, "> Core Recharged. Gained 10 Power.");

    case "BUILD_DEFENSE":
      if (state.metal >= 20 && state.power >= 5) {
        const tempDef = {
          ...state,
          metal: state.metal - 20,
          power: state.power - 5,
          defenses: state.defenses + 1,
        };
        return resolveTurn(tempDef, "> Built 1 Defense. Cost 20 Metal, 5 Power.");
      }
      return state;

    case "REPAIR_BASE":
      if (state.metal >= 10 && state.baseHealth < MAX_HEALTH) {
        const tempRep = {
          ...state,
          metal: state.metal - 10,
          baseHealth: Math.min(MAX_HEALTH, state.baseHealth + 20),
        };
        return resolveTurn(tempRep, "> Repaired Base for 20 HP. Cost 10 Metal.");
      }
      return state;

    case "BUILD_SHIP":
      if (state.metal >= 100 && state.power >= 50) {
        return {
          ...state,
          metal: state.metal - 100,
          power: state.power - 50,
          gameStatus: "won",
          log: [...state.log, "> ESCAPE SHIP CONSTRUCTED! INITIATING LAUNCH SEQUENCE...", "VICTORY ACHIEVED."],
        };
      }
      return state;

    case "RESET":
      return initialState;

    default:
      return state;
  }
};

export default function NeonOutpost() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the log to the bottom when new messages arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.log]);

  const turnsUntilRaid = RAID_INTERVAL - (state.turn % RAID_INTERVAL);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-zinc-950 font-mono text-zinc-300 p-2 sm:p-4 overflow-hidden select-none">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
        
        {/* Navigation - Top Bar */}
        <div className="w-full shrink-0 pb-2 sm:pb-4 flex justify-between items-center">
          <Link
            href="/game"
            className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-[#00ffff] hover:text-[#ff00ff] transition-colors group drop-shadow-[0_0_5px_#00ffff]"
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
          
          {/* Mobile Force Restart Button */}
          <button
            onClick={() => dispatch({ type: "RESET" })}
            className="text-[10px] sm:text-xs text-zinc-500 hover:text-rose-500 transition-colors uppercase tracking-widest font-bold border border-zinc-800 hover:border-rose-500 px-3 py-1 rounded"
          >
            FORCE REBOOT
          </button>
        </div>

        {/* Main Content Split Area */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 min-h-0">
          
          {/* ================= LEFT COLUMN: Controls & Status ================= */}
          <div className="flex flex-col lg:w-2/3 h-full overflow-y-auto custom-scrollbar pr-1 lg:pr-2 pb-2">
            
            {/* Header */}
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-[#ff00ff]/50 pb-3 mb-4 shrink-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff00ff] tracking-widest drop-shadow-[0_0_10px_#ff00ff] uppercase mb-2 sm:mb-0">
                Neon Outpost
              </h1>
              <div className="flex flex-col items-start sm:items-end">
                <span className="text-lg sm:text-xl text-[#39ff14] font-bold drop-shadow-[0_0_5px_#39ff14]">
                  TURN: {state.turn}
                </span>
                <span className={`text-[10px] sm:text-xs mt-1 font-bold tracking-wider ${turnsUntilRaid === 1 ? 'text-[#ff00ff] animate-pulse drop-shadow-[0_0_8px_#ff00ff]' : 'text-[#ffbf00]'}`}>
                  NEXT RAID IN: {turnsUntilRaid} {turnsUntilRaid === 1 ? 'TURN' : 'TURNS'}
                </span>
              </div>
            </header>

            {/* HUD / Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 shrink-0">
              <div className="flex flex-col p-3 sm:p-4 bg-zinc-900 border border-[#00ffff]/40 rounded-lg shadow-[inset_0_0_15px_rgba(0,255,255,0.1)]">
                <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Power Core</span>
                <span className="text-2xl sm:text-3xl font-black text-[#00ffff] drop-shadow-[0_0_8px_#00ffff]">⚡ {state.power}</span>
              </div>
              <div className="flex flex-col p-3 sm:p-4 bg-zinc-900 border border-zinc-500/40 rounded-lg shadow-[inset_0_0_15px_rgba(161,161,170,0.1)]">
                <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Metal Scrap</span>
                <span className="text-2xl sm:text-3xl font-black text-zinc-300 drop-shadow-[0_0_8px_#d4d4d8]">🔩 {state.metal}</span>
              </div>
              <div className="flex flex-col p-3 sm:p-4 bg-zinc-900 border border-[#39ff14]/40 rounded-lg shadow-[inset_0_0_15px_rgba(57,255,20,0.1)]">
                <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Base Health</span>
                <span className={`text-2xl sm:text-3xl font-black ${state.baseHealth <= 30 ? 'text-[#ff00ff] animate-pulse drop-shadow-[0_0_8px_#ff00ff]' : 'text-[#39ff14] drop-shadow-[0_0_8px_#39ff14]'}`}>
                  ❤️ {state.baseHealth}
                </span>
              </div>
              <div className="flex flex-col p-3 sm:p-4 bg-zinc-900 border border-[#ffbf00]/40 rounded-lg shadow-[inset_0_0_15px_rgba(255,191,0,0.1)]">
                <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Defenses</span>
                <span className="text-2xl sm:text-3xl font-black text-[#ffbf00] drop-shadow-[0_0_8px_#ffbf00]">🛡️ {state.defenses}</span>
              </div>
            </div>

            {/* Action Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
              
              <button
                onClick={() => dispatch({ type: "GATHER_METAL" })}
                disabled={state.power < 2 || state.gameStatus !== "playing"}
                className="flex flex-col items-start p-3 sm:p-4 bg-zinc-900 border border-zinc-700 hover:border-zinc-400 hover:bg-zinc-800 transition-all rounded-lg group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:border-zinc-700 text-left"
              >
                <span className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Gather Metal</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 mb-3">Scavenge the wasteland for raw materials. (+15 Metal)</span>
                <span className="mt-auto text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-[#00ffff]/30 text-[#00ffff] rounded font-bold">Cost: ⚡ 2</span>
              </button>

              <button
                onClick={() => dispatch({ type: "RECHARGE_CORE" })}
                disabled={state.gameStatus !== "playing"}
                className="flex flex-col items-start p-3 sm:p-4 bg-zinc-900 border border-zinc-700 hover:border-[#00ffff] hover:bg-zinc-800 hover:shadow-[0_0_15px_#00ffff] transition-all rounded-lg group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:border-zinc-700 disabled:hover:shadow-none text-left"
              >
                <span className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Recharge Core</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 mb-3">Divert solar energy to the main grid. (+10 Power)</span>
                <span className="mt-auto text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-[#39ff14]/30 text-[#39ff14] rounded font-bold">Free Action</span>
              </button>

              <button
                onClick={() => dispatch({ type: "BUILD_DEFENSE" })}
                disabled={state.metal < 20 || state.power < 5 || state.gameStatus !== "playing"}
                className="flex flex-col items-start p-3 sm:p-4 bg-zinc-900 border border-zinc-700 hover:border-[#ffbf00] hover:bg-zinc-800 hover:shadow-[0_0_15px_#ffbf00] transition-all rounded-lg group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:border-zinc-700 disabled:hover:shadow-none text-left"
              >
                <span className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Build Defense</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 mb-3">Construct a plasma turret. (-10 dmg taken from raids)</span>
                <div className="mt-auto flex flex-wrap gap-2">
                  <span className="text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-zinc-500/50 text-zinc-300 rounded font-bold">Cost: 🔩 20</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-[#00ffff]/30 text-[#00ffff] rounded font-bold">Cost: ⚡ 5</span>
                </div>
              </button>

              <button
                onClick={() => dispatch({ type: "REPAIR_BASE" })}
                disabled={state.metal < 10 || state.baseHealth >= 100 || state.gameStatus !== "playing"}
                className="flex flex-col items-start p-3 sm:p-4 bg-zinc-900 border border-zinc-700 hover:border-[#39ff14] hover:bg-zinc-800 hover:shadow-[0_0_15px_#39ff14] transition-all rounded-lg group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:border-zinc-700 disabled:hover:shadow-none text-left"
              >
                <span className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">Repair Base</span>
                <span className="text-[10px] sm:text-xs text-zinc-400 mb-3">Patch hull breaches to keep the atmosphere in. (+20 HP)</span>
                <span className="mt-auto text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-zinc-500/50 text-zinc-300 rounded font-bold">Cost: 🔩 10</span>
              </button>

              <button
                onClick={() => dispatch({ type: "BUILD_SHIP" })}
                disabled={state.metal < 100 || state.power < 50 || state.gameStatus !== "playing"}
                className="flex flex-col items-start p-3 sm:p-4 bg-zinc-900 border-2 border-[#ff00ff]/50 hover:border-[#ff00ff] hover:bg-zinc-800 hover:shadow-[0_0_20px_#ff00ff] transition-all rounded-lg group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-900 disabled:hover:border-[#ff00ff]/50 disabled:hover:shadow-none sm:col-span-2 text-left"
              >
                <span className="text-base sm:text-lg font-black text-[#ff00ff] mb-1 sm:mb-2 drop-shadow-[0_0_5px_#ff00ff] uppercase">Build Escape Ship (WIN)</span>
                <span className="text-[10px] sm:text-xs text-zinc-300 mb-3">Assemble the hyper-drive and escape this rock!</span>
                <div className="mt-auto flex gap-2">
                  <span className="text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-zinc-500/50 text-zinc-300 rounded font-bold">Cost: 🔩 100</span>
                  <span className="text-[9px] sm:text-[10px] px-2 py-1 bg-zinc-950 border border-[#00ffff]/30 text-[#00ffff] rounded font-bold">Cost: ⚡ 50</span>
                </div>
              </button>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Game Log Terminal ================= */}
          <div className="flex flex-col lg:w-1/3 h-[30vh] lg:h-full bg-black border border-zinc-800 rounded-lg p-3 sm:p-4 relative shadow-[inset_0_0_20px_rgba(0,0,0,1)] shrink-0 lg:shrink">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 pointer-events-none opacity-50 rounded-lg" />
            <h2 className="text-[#00ffff] border-b border-zinc-800 pb-2 mb-2 shrink-0 z-20 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] flex justify-between items-center">
              <span>Terminal Output</span>
              <span className="animate-pulse">_</span>
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 z-20 space-y-1.5 custom-scrollbar text-[10px] sm:text-xs leading-relaxed">
              {state.log.map((msg, index) => (
                <div key={index} className={`${msg.includes("⚠️") || msg.includes("CRITICAL") ? "text-[#ff00ff] font-bold" : "text-[#39ff14]"}`}>
                  {msg}
                </div>
              ))}
              <div ref={logEndRef} className="h-1" />
            </div>
          </div>

        </div>
      </div>

      {/* Game Over / Victory Modal */}
      {state.gameStatus !== "playing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className={`flex flex-col items-center p-6 sm:p-12 rounded-2xl border-2 text-center shadow-[0_0_50px_rgba(0,0,0,1)] max-w-md w-full ${state.gameStatus === 'won' ? 'border-[#39ff14] shadow-[#39ff14]/20 bg-zinc-950' : 'border-[#ff00ff] shadow-[#ff00ff]/20 bg-zinc-950'}`}>
            
            <h2 className={`text-4xl sm:text-5xl font-black mb-2 sm:mb-4 uppercase tracking-widest drop-shadow-[0_0_15px_currentColor] ${state.gameStatus === 'won' ? 'text-[#39ff14]' : 'text-[#ff00ff]'}`}>
              {state.gameStatus === 'won' ? 'VICTORY' : 'DEFEATED'}
            </h2>
            
            <p className="text-zinc-300 text-sm sm:text-lg mb-6 sm:mb-8">
              {state.gameStatus === 'won' 
                ? `You successfully escaped on turn ${state.turn} with ${state.baseHealth} base health remaining.` 
                : `The outpost fell to the alien swarm on turn ${state.turn}.`}
            </p>
            
            <button
              onClick={() => dispatch({ type: "RESET" })}
              className={`px-6 sm:px-8 py-3 sm:py-4 font-black text-sm sm:text-xl rounded-full transition-all active:scale-95 text-zinc-950 w-full ${state.gameStatus === 'won' ? 'bg-[#39ff14] hover:bg-[#32e012] shadow-[0_0_20px_#39ff14]' : 'bg-[#ff00ff] hover:bg-[#e000e0] shadow-[0_0_20px_#ff00ff]'}`}
            >
              INITIALIZE NEW RUN
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
    </div>
  );
}