// file: app/game/SysBreach/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// --- Types & Constants ---
type CardType = "attack" | "skill" | "power";

interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  value: number;
  desc: string;
}

interface Player {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  block: number;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  intent: "attack" | "defend" | "buff";
  intentValue: number;
  sprite: string;
}

const CARDS_DB: Record<string, Omit<Card, "id">> = {
  strike: { name: "DDOS", type: "attack", cost: 1, value: 6, desc: "Deal 6 DMG." },
  heavy_strike: { name: "DATA_SPIKE", type: "attack", cost: 2, value: 14, desc: "Deal 14 DMG." },
  defend: { name: "FIREWALL", type: "skill", cost: 1, value: 5, desc: "Gain 5 BLOCK." },
  heavy_defend: { name: "PROXY_SHIELD", type: "skill", cost: 2, value: 12, desc: "Gain 12 BLOCK." },
  heal: { name: "SYS_REBOOT", type: "skill", cost: 2, value: 8, desc: "Restore 8 HP." },
};

const STARTING_DECK = [
  "strike", "strike", "strike", "strike", 
  "defend", "defend", "defend", "defend", 
  "heavy_strike", "heal"
];

const ENEMIES = [
  { name: "BASIC_ICE", hp: 30, sprite: "👾" },
  { name: "ROGUE_DRONE", hp: 45, sprite: "🛸" },
  { name: "NET_WATCHER", hp: 60, sprite: "👁️‍🗨️" },
  { name: "WIDOWMAKER_AI", hp: 85, sprite: "🕷️" },
  { name: "MEGACORP_MAINFRAME", hp: 120, sprite: "🏢" },
];

type GameState = "start" | "playing" | "victory" | "gameover";

// --- Utility Functions ---
const generateId = () => Math.random().toString(36).substring(2, 9);

const shuffle = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function SysBreach() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [gameState, setGameState] = useState<GameState>("start");
  const [floor, setFloor] = useState(1);
  
  // Entities
  const [player, setPlayer] = useState<Player>({ hp: 50, maxHp: 50, energy: 3, maxEnergy: 3, block: 0 });
  const [enemy, setEnemy] = useState<Enemy | null>(null);
  
  // Cards
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [discard, setDiscard] = useState<Card[]>([]);
  
  // FX State
  const [message, setMessage] = useState<string>("SYSTEM INITIALIZED");
  const [shake, setShake] = useState(false);

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

  // --- Core Game Logic ---

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  const notify = (msg: string) => {
    setMessage(msg);
  };

  const drawCards = (amount: number, currentDeck: Card[], currentDiscard: Card[], currentHand: Card[]) => {
    let newDeck = [...currentDeck];
    let newDiscard = [...currentDiscard];
    let newHand = [...currentHand];

    for (let i = 0; i < amount; i++) {
      if (newDeck.length === 0) {
        if (newDiscard.length === 0) break; // Completely out of cards
        newDeck = shuffle(newDiscard);
        newDiscard = [];
        notify("SHUFFLING DISCARD REPOSITORY...");
      }
      const drawnCard = newDeck.shift();
      if (drawnCard) newHand.push(drawnCard);
    }

    setDeck(newDeck);
    setDiscard(newDiscard);
    setHand(newHand);
  };

  const spawnEnemy = (floorNum: number) => {
    const enemyTemplate = ENEMIES[Math.min(floorNum - 1, ENEMIES.length - 1)];
    const hpScaling = Math.floor(enemyTemplate.hp * (1 + (floorNum - 1) * 0.15));
    
    const newEnemy: Enemy = {
      name: enemyTemplate.name,
      hp: hpScaling,
      maxHp: hpScaling,
      block: 0,
      intent: "attack",
      intentValue: 6 + Math.floor(floorNum * 1.5),
      sprite: enemyTemplate.sprite,
    };
    setEnemy(newEnemy);
  };

  const generateEnemyIntent = (e: Enemy, floorNum: number): Enemy => {
    const rand = Math.random();
    let intent: Enemy["intent"] = "attack";
    let intentValue = 0;

    if (rand < 0.6) {
      intent = "attack";
      intentValue = 5 + Math.floor(Math.random() * 4) + floorNum * 2;
    } else if (rand < 0.9) {
      intent = "defend";
      intentValue = 6 + Math.floor(Math.random() * 5) + floorNum;
    } else {
      intent = "attack"; // "Buff" could go here later, keeping it simple
      intentValue = 8 + floorNum * 3;
    }

    return { ...e, intent, intentValue };
  };

  const startCombat = (floorNum: number, keepHp = false) => {
    setFloor(floorNum);
    spawnEnemy(floorNum);
    
    if (!keepHp) {
      setPlayer({ hp: 50, maxHp: 50, energy: 3, maxEnergy: 3, block: 0 });
    } else {
      setPlayer(p => ({ ...p, energy: p.maxEnergy, block: 0 }));
    }

    // Build Initial Deck
    const initialDeck: Card[] = STARTING_DECK.map(key => ({
      id: generateId(),
      ...CARDS_DB[key]
    }));
    
    const shuffledDeck = shuffle(initialDeck);
    
    // Initial Draw
    const startingHand = shuffledDeck.splice(0, 5);
    setDeck(shuffledDeck);
    setHand(startingHand);
    setDiscard([]);
    setGameState("playing");
    notify(`BREACHING FLOOR 0${floorNum}...`);
  };

  // --- Player Actions ---

  const playCard = (cardIndex: number) => {
    if (gameState !== "playing" || !enemy) return;
    
    const card = hand[cardIndex];
    if (player.energy < card.cost) {
      notify("INSUFFICIENT ENERGY");
      return;
    }

    // Pay Cost & Move to Discard
    const newHand = [...hand];
    newHand.splice(cardIndex, 1);
    setHand(newHand);
    setDiscard([...discard, card]);
    
    let newPlayer = { ...player, energy: player.energy - card.cost };
    let newEnemy = { ...enemy };

    // Resolve Card Effect
    if (card.type === "attack") {
      const damage = Math.max(0, card.value - newEnemy.block);
      newEnemy.block = Math.max(0, newEnemy.block - card.value);
      newEnemy.hp -= damage;
      triggerShake();
      notify(`EXECUTED ${card.name}. DEALT ${damage} DMG.`);
    } else if (card.type === "skill") {
      if (card.name.includes("REBOOT")) {
        newPlayer.hp = Math.min(newPlayer.maxHp, newPlayer.hp + card.value);
        notify(`REPAIRED ${card.value} HP.`);
      } else {
        newPlayer.block += card.value;
        notify(`DEPLOYED ${card.value} BLOCK.`);
      }
    }

    // Check Death
    if (newEnemy.hp <= 0) {
      handleFloorClear();
    } else {
      setPlayer(newPlayer);
      setEnemy(newEnemy);
    }
  };

  const endTurn = () => {
    if (gameState !== "playing" || !enemy) return;

    let newPlayer = { ...player };
    let newEnemy = { ...enemy };

    // 1. Resolve Enemy Action
    if (newEnemy.intent === "attack") {
      const damage = Math.max(0, newEnemy.intentValue - newPlayer.block);
      newPlayer.block = Math.max(0, newPlayer.block - newEnemy.intentValue);
      newPlayer.hp -= damage;
      triggerShake();
      notify(`WARNING: TOOK ${damage} DMG FROM ${newEnemy.name}`);
    } else if (newEnemy.intent === "defend") {
      newEnemy.block += newEnemy.intentValue;
      notify(`${newEnemy.name} INCREASED SECURITY.`);
    }

    if (newPlayer.hp <= 0) {
      setGameState("gameover");
      return;
    }

    // 2. Cleanup Player
    newPlayer.block = 0; // Block resets every turn
    newPlayer.energy = newPlayer.maxEnergy;
    
    // 3. Discard Hand & Draw New
    const newDiscard = [...discard, ...hand];
    setPlayer(newPlayer);
    
    // Set next enemy intent
    setEnemy(generateEnemyIntent({ ...newEnemy, block: 0 }, floor)); 
    
    // Draw 5
    drawCards(5, deck, newDiscard, []);
  };

  const handleFloorClear = () => {
    notify(`THREAT NEUTRALIZED. SECURING NODE...`);
    
    // Heal slightly on floor clear
    setPlayer(p => ({ ...p, hp: Math.min(p.maxHp, p.hp + 10) }));
    
    if (floor >= ENEMIES.length) {
      setGameState("victory");
    } else {
      // Auto-advance to the next combat
      setTimeout(() => startCombat(floor + 1, true), 1500);
    }
  };

  // --- Render Helpers ---

  const getCardStyle = (type: CardType) => {
    switch (type) {
      case "attack": return "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
      case "skill": return "border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]";
      case "power": return "border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.15)]";
    }
  };

  const getCardHeaderColor = (type: CardType) => {
    switch (type) {
      case "attack": return "bg-rose-500 text-slate-950";
      case "skill": return "bg-cyan-500 text-slate-950";
      case "power": return "bg-violet-500 text-slate-950";
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-between h-[100dvh] w-full bg-slate-950 font-mono p-2 sm:p-4 select-none touch-manipulation overflow-hidden transition-transform ${shake ? 'translate-x-1 translate-y-1' : ''}`}
    >
      
      {/* Top Navigation Bar - Safely pinned above overlays */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-2 px-2 shrink-0 relative z-30">
        <Link 
          href="/game" 
          className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-emerald-400 transition-colors group bg-slate-900/50 p-2 rounded-lg backdrop-blur-md border border-slate-800"
        >
          <svg 
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">BACK TO ARCADE</span>
          <span className="sm:hidden">MENU</span>
        </Link>

        {/* Full Screen Toggle Button */}
        <button 
          onClick={toggleFullScreen}
          className="bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-slate-500 text-slate-400 p-2 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 backdrop-blur-md"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
          )}
        </button>
      </div>

      {/* HEADER / HUD */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-2 sm:mb-4 px-2 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
            SYS_BREACH
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 tracking-widest mt-1">NETWORK LAYER: 0{floor}</p>
        </div>
        
        {/* Event Log (Desktop) */}
        <div className="hidden sm:block flex-1 max-w-md ml-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center shadow-inner">
            <span className="text-xs text-cyan-400 animate-pulse font-bold">{message}</span>
          </div>
        </div>
      </div>

      {/* Event Log (Mobile) */}
      <div className="sm:hidden w-full px-2 mb-4 shrink-0">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center shadow-inner">
          <span className="text-[10px] text-cyan-400 font-bold">{message}</span>
        </div>
      </div>

      {/* COMBAT ARENA */}
      {gameState === "playing" && enemy ? (
        <div className="flex-1 w-full max-w-4xl flex flex-col justify-center items-center gap-4 sm:gap-8 relative px-2">
          
          {/* Enemy Area */}
          <div className="flex flex-col items-center w-full">
            {/* Enemy Intent */}
            <div className="mb-2 bg-slate-900 border border-slate-700 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              {enemy.intent === "attack" && <span className="text-rose-500 text-xs sm:text-sm font-bold tracking-wider">⚔️ {enemy.intentValue} DMG</span>}
              {enemy.intent === "defend" && <span className="text-cyan-500 text-xs sm:text-sm font-bold tracking-wider">🛡️ {enemy.intentValue} BLK</span>}
            </div>

            <div className="text-6xl sm:text-7xl md:text-8xl drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] mb-3 animate-bounce">
              {enemy.sprite}
            </div>
            
            <div className="text-center w-full max-w-[200px]">
              <h2 className="text-rose-400 font-bold tracking-widest text-xs sm:text-sm mb-1">{enemy.name}</h2>
              <div className="flex items-center gap-2 justify-center">
                {enemy.block > 0 && (
                  <div className="text-cyan-400 font-bold text-[10px] sm:text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-cyan-900">
                    🛡️ {enemy.block}
                  </div>
                )}
                <div className="flex-1 h-2.5 sm:h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.8)]" 
                    style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 w-10 text-right">{enemy.hp}/{enemy.maxHp}</span>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="w-full border-t border-dashed border-slate-800 relative my-2 sm:my-0">
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-3 py-0.5 rounded-full border border-slate-800 text-slate-600 text-[9px] sm:text-[10px] font-bold tracking-widest">
              CONNECTION
            </span>
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center w-full max-w-[280px] sm:max-w-md">
            
            <div className="flex justify-between w-full mb-2 items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold text-[10px] sm:text-xs tracking-wider">ENERGY:</span>
                <div className="flex gap-1">
                  {[...Array(player.maxEnergy)].map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${i < player.energy ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-800 border border-slate-700'}`} />
                  ))}
                </div>
              </div>
              <button 
                onClick={endTurn}
                className="px-3 py-1.5 sm:px-4 sm:py-1.5 border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-[10px] sm:text-xs rounded-lg transition-all active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
              >
                END TURN ⏩
              </button>
            </div>

            <div className="w-full text-center">
              <div className="flex items-center gap-2 w-full justify-center">
                {player.block > 0 && (
                  <div className="text-cyan-400 font-bold text-[10px] sm:text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-cyan-900">
                    🛡️ {player.block}
                  </div>
                )}
                <div className="flex-1 h-2.5 sm:h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-slate-400 w-10 text-right">{player.hp}/{player.maxHp}</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 w-full" /> /* Spacer when overlay is active */
      )}

      {/* DECK & HAND AREA */}
      {gameState === "playing" && (
        <div className="w-full max-w-5xl mt-auto relative pb-2 sm:pb-4 shrink-0">
          
          {/* Deck Counters */}
          <div className="absolute left-2 bottom-full mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold text-slate-500 flex flex-col">
            <span>DECK: {deck.length}</span>
          </div>
          <div className="absolute right-2 bottom-full mb-1 sm:mb-2 text-[10px] sm:text-xs font-bold text-slate-500 flex flex-col text-right">
            <span>TRASH: {discard.length}</span>
          </div>

          {/* Cards in Hand */}
          <div className="flex justify-center flex-nowrap overflow-x-auto sm:flex-wrap gap-2 sm:gap-4 px-2 pb-2 scrollbar-hide">
            {hand.map((card, index) => {
              const isPlayable = player.energy >= card.cost;
              return (
                <button
                  key={`${card.id}-${index}`}
                  onClick={() => playCard(index)}
                  disabled={!isPlayable}
                  className={`group relative flex flex-col shrink-0 w-[84px] sm:w-[120px] md:w-36 aspect-[2.5/3.5] bg-slate-900 border-2 rounded-xl overflow-hidden transition-all duration-200 ${getCardStyle(card.type)} ${isPlayable ? 'hover:-translate-y-2 sm:hover:-translate-y-4 hover:shadow-2xl cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed grayscale'}`}
                >
                  <div className={`w-full text-center py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold tracking-widest ${getCardHeaderColor(card.type)}`}>
                    {card.type.toUpperCase()}
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 relative">
                    {/* Energy Cost Bubble */}
                    <div className="absolute top-1 left-1 w-4 h-4 sm:w-5 sm:h-5 bg-slate-950 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 font-black text-[9px] sm:text-xs shadow-md">
                      {card.cost}
                    </div>
                    
                    <h3 className="text-white font-black text-[10px] sm:text-xs md:text-sm text-center mb-1 sm:mb-2 leading-tight px-1">
                      {card.name.replace("_", " ")}
                    </h3>
                    
                    <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] text-center leading-tight px-1">
                      {card.desc}
                    </p>
                  </div>

                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {gameState === "start" && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-4 sm:p-6">
          <div className="bg-slate-900 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl text-center shadow-2xl w-full max-w-md">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-cyan-500 tracking-widest drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] mb-4">
              SYS_BREACH
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mb-8 leading-relaxed">
              Deploy combat algorithms to break through corporate ICE. Manage your energy, generate block, and survive 5 layers of network security.
            </p>
            <button 
              onClick={() => startCombat(1)}
              className="px-8 sm:px-10 py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl sm:text-2xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 w-full"
            >
              INITIATE HACK
            </button>
          </div>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-4 sm:p-6">
          <div className="bg-slate-900 border border-rose-500/30 p-6 sm:p-8 rounded-3xl text-center shadow-2xl w-full max-w-md">
            <h2 className="text-4xl sm:text-5xl font-black text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
              CONNECTION SEVERED
            </h2>
            <p className="text-white text-base sm:text-lg mb-8">Your trace was detected on Floor 0{floor}.</p>
            <button 
              onClick={() => startCombat(1)}
              className="px-8 sm:px-10 py-3 sm:py-4 bg-white hover:bg-slate-200 text-rose-900 font-black text-xl sm:text-2xl rounded-full transition-transform hover:scale-105 shadow-xl active:scale-95 w-full"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      )}

      {gameState === "victory" && (
        <div className="absolute inset-0 bg-cyan-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-4 sm:p-6 text-center">
          <div className="bg-slate-900 border border-cyan-500/30 p-6 sm:p-8 rounded-3xl text-center shadow-2xl w-full max-w-md">
            <h2 className="text-4xl sm:text-5xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)] leading-tight">
              MAINFRAME COMPROMISED
            </h2>
            <p className="text-white text-base sm:text-lg mb-8">You successfully breached all corporate network layers.</p>
            <button 
              onClick={() => startCombat(1)}
              className="px-8 sm:px-10 py-3 sm:py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl sm:text-2xl rounded-full transition-transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95 w-full"
            >
              JACK IN AGAIN
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Hide scrollbar for card hand container on mobile */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}