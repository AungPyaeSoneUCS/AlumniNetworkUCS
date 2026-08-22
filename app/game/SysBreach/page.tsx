// file: app/game/SysBreach/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";

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
    notify(`BREACHING FLOOR ${floorNum}...`);
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
    setEnemy(generateEnemyIntent({ ...newEnemy, block: 0 }, floor)); // Reset enemy block too (Standard roguelike rules)
    
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
      // In a full game, here is where you'd pick a new card as a reward.
      // For this arcade version, we auto-advance to the next combat.
      setTimeout(() => startCombat(floor + 1, true), 1500);
    }
  };

  // --- Render Helpers ---

  const getCardStyle = (type: CardType) => {
    switch (type) {
      case "attack": return "border-rose-500 shadow-rose-500/20";
      case "skill": return "border-cyan-500 shadow-cyan-500/20";
      case "power": return "border-violet-500 shadow-violet-500/20";
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
    <div className={`flex flex-col items-center justify-between min-h-screen bg-slate-950 font-mono p-4 select-none touch-manipulation transition-transform ${shake ? 'translate-x-1 translate-y-1' : ''}`}>
      
      {/* HEADER / HUD */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest drop-shadow-md">
            SYS_BREACH
          </h1>
          <p className="text-xs text-slate-500 tracking-widest">NETWORK LAYER: 0{floor}</p>
        </div>
        
        {/* Event Log */}
        <div className="hidden sm:block flex-1 max-w-md mx-8">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center shadow-inner">
            <span className="text-xs text-cyan-400 animate-pulse font-bold">{message}</span>
          </div>
        </div>
      </div>

      {/* Mobile Event Log */}
      <div className="sm:hidden w-full mb-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-center shadow-inner">
          <span className="text-xs text-cyan-400 font-bold">{message}</span>
        </div>
      </div>

      {/* COMBAT ARENA */}
      {gameState === "playing" && enemy && (
        <div className="flex-1 w-full max-w-4xl flex flex-col justify-center items-center gap-8 relative">
          
          {/* Enemy Area */}
          <div className="flex flex-col items-center">
            {/* Enemy Intent */}
            <div className="mb-2 bg-slate-900 border border-slate-700 px-4 py-1 rounded-full flex items-center gap-2 shadow-lg">
              {enemy.intent === "attack" && <span className="text-rose-500 text-sm font-bold">⚔️ {enemy.intentValue} DMG</span>}
              {enemy.intent === "defend" && <span className="text-cyan-500 text-sm font-bold">🛡️ {enemy.intentValue} BLK</span>}
            </div>

            <div className="text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(244,63,94,0.6)] mb-4 animate-bounce">
              {enemy.sprite}
            </div>
            
            <div className="text-center">
              <h2 className="text-rose-400 font-bold tracking-widest mb-1">{enemy.name}</h2>
              <div className="flex items-center gap-2">
                {enemy.block > 0 && (
                  <div className="text-cyan-400 font-bold text-sm bg-slate-800 px-2 rounded">
                    🛡️ {enemy.block}
                  </div>
                )}
                <div className="w-48 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-300" 
                    style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12">{enemy.hp}/{enemy.maxHp}</span>
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="w-full border-t border-dashed border-slate-800 relative">
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-2 text-slate-700 text-xs">CONNECTION PROTOCOL</span>
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center w-full max-w-md">
            
            <div className="flex justify-between w-full mb-2">
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold">ENERGY:</span>
                <div className="flex gap-1">
                  {[...Array(player.maxEnergy)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${i < player.energy ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-800'}`} />
                  ))}
                </div>
              </div>
              <button 
                onClick={endTurn}
                className="px-4 py-1 border border-amber-500/50 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs rounded transition-all active:scale-95"
              >
                END TURN ⏩
              </button>
            </div>

            <div className="w-full text-center">
              <div className="flex items-center gap-2 w-full justify-center">
                {player.block > 0 && (
                  <div className="text-cyan-400 font-bold text-sm bg-slate-800 px-2 rounded">
                    🛡️ {player.block}
                  </div>
                )}
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-left">{player.hp}/{player.maxHp}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* DECK & HAND AREA */}
      {gameState === "playing" && (
        <div className="w-full max-w-5xl mt-6 relative pb-4">
          
          {/* Deck Counters */}
          <div className="absolute left-0 bottom-full mb-2 text-xs font-bold text-slate-500 flex flex-col">
            <span>DECK: {deck.length}</span>
          </div>
          <div className="absolute right-0 bottom-full mb-2 text-xs font-bold text-slate-500 flex flex-col text-right">
            <span>TRASH: {discard.length}</span>
          </div>

          {/* Cards in Hand */}
          <div className="flex justify-center flex-wrap gap-2 sm:gap-4 px-2">
            {hand.map((card, index) => {
              const isPlayable = player.energy >= card.cost;
              return (
                <button
                  key={card.id}
                  onClick={() => playCard(index)}
                  disabled={!isPlayable}
                  className={`group relative flex flex-col w-28 sm:w-36 aspect-[2.5/3.5] bg-slate-900 border-2 rounded-xl overflow-hidden transition-all duration-200 ${getCardStyle(card.type)} ${isPlayable ? 'hover:-translate-y-4 hover:shadow-xl cursor-pointer' : 'opacity-50 cursor-not-allowed grayscale'}`}
                >
                  <div className={`w-full text-center py-1 text-[10px] sm:text-xs font-bold tracking-widest ${getCardHeaderColor(card.type)}`}>
                    {card.type.toUpperCase()}
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center justify-center p-2 relative">
                    {/* Energy Cost Bubble */}
                    <div className="absolute top-1 left-1 w-5 h-5 bg-slate-950 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 font-bold text-xs shadow-md">
                      {card.cost}
                    </div>
                    
                    <h3 className="text-white font-black text-xs sm:text-sm text-center mb-2 leading-tight">
                      {card.name.replace("_", " ")}
                    </h3>
                    
                    <p className="text-slate-400 text-[9px] sm:text-[10px] text-center leading-tight">
                      {card.desc}
                    </p>
                  </div>

                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* OVERLAYS */}
      {gameState === "start" && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-20 p-6">
          <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-widest drop-shadow-lg mb-4 text-center">
            SYS_BREACH
          </h2>
          <p className="text-slate-400 max-w-md text-center mb-8">
            Deploy combat algorithms to break through corporate ICE. Manage your energy, generate block, and survive 5 layers of network security.
          </p>
          <button 
            onClick={() => startCombat(1)}
            className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-2xl rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] active:scale-95"
          >
            INITIATE HACK
          </button>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6">
          <h2 className="text-5xl font-black text-rose-500 mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)]">
            CONNECTION SEVERED
          </h2>
          <p className="text-white text-lg mb-8">Your trace was detected on Floor 0{floor}.</p>
          <button 
            onClick={() => startCombat(1)}
            className="px-10 py-4 bg-white hover:bg-slate-200 text-rose-900 font-black text-xl rounded-xl transition-all shadow-xl active:scale-95"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}

      {gameState === "victory" && (
        <div className="absolute inset-0 bg-cyan-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20 p-6 text-center">
          <h2 className="text-5xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            MAINFRAME COMPROMISED
          </h2>
          <p className="text-white text-lg mb-8">You successfully breached all corporate network layers.</p>
          <button 
            onClick={() => startCombat(1)}
            className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xl rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95"
          >
            JACK IN AGAIN
          </button>
        </div>
      )}

    </div>
  );
}