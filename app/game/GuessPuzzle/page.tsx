// file: app/game/GuessPuzzle/page.tsx

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface WordObj {
  word: string;
  hint: string;
}

// 350 Words meticulously scaled into 10 difficulty tiers (35 words per tier)
const WORDS_BY_TIER: WordObj[][] = [
  // Tier 1 (Levels 1-10): Very Easy (3-4 letters)
  [
    { word: "CUP", hint: "Drinking vessel" }, { word: "BED", hint: "Sleep furniture" },
    { word: "KEY", hint: "Unlocks doors" }, { word: "SOAP", hint: "Used to wash hands" },
    { word: "MILK", hint: "Cereal drink" }, { word: "DOOR", hint: "Room entrance" },
    { word: "SHOE", hint: "Footwear" }, { word: "FORK", hint: "Eating tool" },
    { word: "COMB", hint: "Hair tool" }, { word: "WORK", hint: "Earn a living here" },
    { word: "DESK", hint: "Work table" }, { word: "TIME", hint: "Clock reading" },
    { word: "WASH", hint: "Clean up" }, { word: "BOWL", hint: "Soup dish" },
    { word: "MUG", hint: "Coffee cup" }, { word: "CAR", hint: "Drive it on roads" },
    { word: "CAT", hint: "Feline pet" }, { word: "DOG", hint: "Canine pet" },
    { word: "HAT", hint: "Headwear" }, { word: "BAG", hint: "Carry items in this" },
    { word: "BOX", hint: "Cardboard container" }, { word: "FAN", hint: "Cooling device" },
    { word: "MAP", hint: "Navigation tool" }, { word: "MAT", hint: "Floor cover" },
    { word: "POT", hint: "Cooking vessel" }, { word: "RUG", hint: "Small carpet" },
    { word: "SUN", hint: "Daytime star" }, { word: "TUB", hint: "Bathe in it" },
    { word: "BOOK", hint: "Read its pages" }, { word: "LAMP", hint: "Light source" },
    { word: "COAT", hint: "Winter wear" }, { word: "RING", hint: "Finger jewelry" },
    { word: "SINK", hint: "Wash dishes here" }, { word: "TAPE", hint: "Sticky roll" },
    { word: "VASE", hint: "Holds flowers" }
  ],
  // Tier 2 (Levels 11-20): Easy (4-5 letters)
  [
    { word: "ALARM", hint: "Wake up sound" }, { word: "PHONE", hint: "Communication device" },
    { word: "SLEEP", hint: "Night rest" }, { word: "WATER", hint: "Essential H2O" },
    { word: "TOWEL", hint: "Dry off with this" }, { word: "MONEY", hint: "Used to pay expenses" },
    { word: "CLOCK", hint: "Tells time" }, { word: "TRAIN", hint: "Locomotive transport" },
    { word: "SHIRT", hint: "Torso clothing" }, { word: "CHAIR", hint: "Sit on it" },
    { word: "TABLE", hint: "Eat at it" }, { word: "BRUSH", hint: "Teeth tool" },
    { word: "SPOON", hint: "Eat soup with this" }, { word: "KNIFE", hint: "Cut food with this" },
    { word: "PLATE", hint: "Flat dining dish" }, { word: "GLASS", hint: "Drink water from this" },
    { word: "RADIO", hint: "Listen to music" }, { word: "PLANT", hint: "Green indoor decor" },
    { word: "FLOOR", hint: "Walk on it inside" }, { word: "STAIR", hint: "Step up" },
    { word: "PORCH", hint: "Front of house" }, { word: "DRIVE", hint: "Operate a car" },
    { word: "SPEND", hint: "Use money" }, { word: "CLEAN", hint: "Make tidy" },
    { word: "SWEEP", hint: "Broom action" }, { word: "DUST", hint: "Wipe surfaces" },
    { word: "TRASH", hint: "Garbage bin contents" }, { word: "BILL", hint: "Amount owed" },
    { word: "RENT", hint: "Monthly payment" }, { word: "LEASE", hint: "Rental contract" },
    { word: "PAINT", hint: "Wall color" }, { word: "GRASS", hint: "Lawn greenery" },
    { word: "YARD", hint: "House exterior space" }, { word: "BREAD", hint: "Sliced loaf" },
    { word: "FRUIT", hint: "Healthy natural snack" }
  ],
  // Tier 3 (Levels 21-30): Easy-Medium (5-6 letters)
  [
    { word: "COFFEE", hint: "Morning energy brew" }, { word: "MIRROR", hint: "See your reflection" },
    { word: "DISHES", hint: "Wash these after eating" }, { word: "WALLET", hint: "Holds cash and cards" },
    { word: "SUBWAY", hint: "Underground transit" }, { word: "TICKET", hint: "Entry pass" },
    { word: "BUDGET", hint: "Money management plan" }, { word: "PENCIL", hint: "Writing stick" },
    { word: "WINDOW", hint: "Look outside through it" }, { word: "JACKET", hint: "Light coat" },
    { word: "MORNING", hint: "Early AM hours" }, { word: "EVENING", hint: "Late PM hours" },
    { word: "CHEESE", hint: "Dairy slice" }, { word: "BUTTER", hint: "Bread spread" },
    { word: "YOGURT", hint: "Dairy snack" }, { word: "CARROT", hint: "Orange vegetable" },
    { word: "TOMATO", hint: "Red fruit/veg" }, { word: "POTATO", hint: "Starchy spud" },
    { word: "ONION", hint: "Cries when cut" }, { word: "GARLIC", hint: "Pungent bulb" },
    { word: "PEPPER", hint: "Salt's partner" }, { word: "SALT", hint: "Basic seasoning" },
    { word: "SUGAR", hint: "Sweet additive" }, { word: "SPICE", hint: "Flavor powder" },
    { word: "HERB", hint: "Plant seasoning" }, { word: "FLOUR", hint: "Baking dust" },
    { word: "WHEAT", hint: "Bread grain" }, { word: "GRAIN", hint: "Cereal base" },
    { word: "RICE", hint: "White grains" }, { word: "PASTA", hint: "Italian noodles" },
    { word: "NOODLE", hint: "Ramen base" }, { word: "SAUCE", hint: "Liquid topping" },
    { word: "SYRUP", hint: "Pancake topping" }, { word: "JUICE", hint: "Fruit drink" },
    { word: "DRINK", hint: "Beverage" }
  ],
  // Tier 4 (Levels 31-40): Medium (6-7 letters)
  [
    { word: "TRAFFIC", hint: "Cars stuck on the road" }, { word: "GARBAGE", hint: "Trash bags" },
    { word: "LAUNDRY", hint: "Washing clothes chore" }, { word: "ROUTINE", hint: "Daily habit schedule" },
    { word: "COOKING", hint: "Preparing a meal" }, { word: "RUNNING", hint: "Jogging exercise" },
    { word: "COMMUTE", hint: "Travel to workplace" }, { word: "WEEKEND", hint: "Saturday and Sunday" },
    { word: "WORKOUT", hint: "Gym exercise" }, { word: "MEETING", hint: "Work gathering" },
    { word: "SAVINGS", hint: "Bank account reserve" }, { word: "WEATHER", hint: "Rain or shine" },
    { word: "GROCERY", hint: "Food shopping store" }, { word: "INVOICE", hint: "Business bill" },
    { word: "TOILET", hint: "Bathroom fixture" }, { word: "SHOWER", hint: "Wash body here" },
    { word: "BLANKET", hint: "Warm bed cover" }, { word: "PILLOW", hint: "Head rest for sleep" },
    { word: "CARPET", hint: "Floor fabric cover" }, { word: "DRAWER", hint: "Desk slider" },
    { word: "CLOSET", hint: "Hang clothes here" }, { word: "FREEZER", hint: "Ice box" },
    { word: "GARAGE", hint: "Car room" }, { word: "GARDEN", hint: "Grow flowers here" },
    { word: "OFFICE", hint: "Work room" }, { word: "BALCONY", hint: "High porch" },
    { word: "CEILING", hint: "Room top" }, { word: "HALLWAY", hint: "Corridor" },
    { word: "CURTAIN", hint: "Window drape" }, { word: "SHAMPOO", hint: "Hair soap" },
    { word: "TOASTER", hint: "Make toast with this" }, { word: "BLENDER", hint: "Smoothie maker" },
    { word: "COUNTER", hint: "Kitchen surface" }, { word: "CABINET", hint: "Kitchen storage" },
    { word: "RECIPE", hint: "Cooking instructions" }
  ],
  // Tier 5 (Levels 41-50): Medium (7-8 letters)
  [
    { word: "APPLIANCE", hint: "Home machine" }, { word: "FURNITURE", hint: "Couches & chairs" },
    { word: "UTILITIES", hint: "Power & water bills" }, { word: "INSURANCE", hint: "Risk cover policy" },
    { word: "MORTGAGE", hint: "Home loan" }, { word: "MECHANIC", hint: "Fixes cars" },
    { word: "PASSWORD", hint: "Secret login word" }, { word: "KEYBOARD", hint: "Type on it" },
    { word: "MONITOR", hint: "Computer screen" }, { word: "LAPTOP", hint: "Portable PC" },
    { word: "DESKTOP", hint: "Tower PC" }, { word: "BROWSER", hint: "Web surfer" },
    { word: "WEBSITE", hint: "URL destination" }, { word: "DOWNLOAD", hint: "Save from net" },
    { word: "UPGRADE", hint: "Make better" }, { word: "INSTALL", hint: "Setup an app" },
    { word: "DELETE", hint: "Remove a file" }, { word: "UPDATE", hint: "New software patch" },
    { word: "BATTERY", hint: "Power cell" }, { word: "KITCHEN", hint: "Cooking room" },
    { word: "ROASTING", hint: "Oven cooking method" }, { word: "GRILLING", hint: "BBQ method" },
    { word: "DRIVING", hint: "Car steering action" }, { word: "PARKING", hint: "Stop car here" },
    { word: "STEERING", hint: "Turn the wheel" }, { word: "BICYCLE", hint: "Two-wheeled transport" },
    { word: "SCOOTER", hint: "Push ride" }, { word: "TRANSIT", hint: "Public transport" },
    { word: "HIGHWAY", hint: "Fast road" }, { word: "FREEWAY", hint: "No toll road" },
    { word: "AIRPORT", hint: "Fly from here" }, { word: "STATION", hint: "Train stop" },
    { word: "HARBOR", hint: "Boat dock" }, { word: "SEAPORT", hint: "Ship cargo dock" },
    { word: "VEHICLE", hint: "Transport machine" }
  ],
  // Tier 6 (Levels 51-60): Medium-Hard (8-10 letters)
  [
    { word: "DEADLINE", hint: "Due date" }, { word: "PHARMACY", hint: "Drug store" },
    { word: "CALENDAR", hint: "Date tracker" }, { word: "EXPENSES", hint: "Money spent" },
    { word: "LANDLORD", hint: "Rent collector" }, { word: "RECYCLING", hint: "Plastic & paper bin" },
    { word: "NUTRITION", hint: "Healthy eating science" }, { word: "RETIREMENT", hint: "End of working years" },
    { word: "INVESTMENT", hint: "Stock buying" }, { word: "INTERVIEW", hint: "Job meeting" },
    { word: "OVERTIME", hint: "Extra work hours" }, { word: "PARENTING", hint: "Raising kids" },
    { word: "OBLIGATION", hint: "Must-do duty" }, { word: "DEDUCTIBLE", hint: "Insurance copay" },
    { word: "MAINTENANCE", hint: "Upkeep of items" }, { word: "APPOINTMENT", hint: "Doctor visit slot" },
    { word: "TEMPERATURE", hint: "Hot or cold metric" }, { word: "METABOLISM", hint: "Calorie burning rate" },
    { word: "SOFTWARE", hint: "PC programs" }, { word: "HARDWARE", hint: "PC parts" },
    { word: "NETWORKING", hint: "Connecting PCs/People" }, { word: "BLUETOOTH", hint: "Wireless sync tech" },
    { word: "WIRELESS", hint: "No cables needed" }, { word: "ETHERNET", hint: "Net cable" },
    { word: "ROUTER", hint: "Wifi box" }, { word: "SERVER", hint: "Data host" },
    { word: "DATABASE", hint: "Data storage" }, { word: "FIREWALL", hint: "Net security shield" },
    { word: "SECURITY", hint: "System protection" }, { word: "ANTIVIRUS", hint: "Malware killer" },
    { word: "MALWARE", hint: "Bad code" }, { word: "SPYWARE", hint: "Snooping code" },
    { word: "PHISHING", hint: "Email scam" }, { word: "HACKING", hint: "Cyber breach" },
    { word: "ENCRYPTION", hint: "Data scramble" }
  ],
  // Tier 7 (Levels 61-70): Hard (9-11 letters)
  [
    { word: "CHOLESTEROL", hint: "Heart health metric" }, { word: "NEIGHBORHOOD", hint: "Local living area" },
    { word: "RELATIONSHIP", hint: "Partner connection" }, { word: "MULTITASKING", hint: "Doing two things at once" },
    { word: "ORGANIZATION", hint: "Tidying up system" }, { word: "PRODUCTIVITY", hint: "Getting things done" },
    { word: "INDEPENDENCE", hint: "Self reliance" }, { word: "SATISFACTION", hint: "Feeling of contentment" },
    { word: "PERSEVERANCE", hint: "Not giving up" }, { word: "AUTHENTICITY", hint: "Being genuine" },
    { word: "DEPRECIATION", hint: "Value loss over time" }, { word: "VULNERABILITY", hint: "Emotional openness" },
    { word: "COMPROMISING", hint: "Meeting in the middle" }, { word: "VOLUNTEERING", hint: "Free charity work" },
    { word: "RESPONSIBILITY", hint: "Duty to handle" }, { word: "PRIORITIZATION", hint: "Ranking tasks" },
    { word: "ACCOMPLISHMENT", hint: "A completed achievement" }, { word: "ADMINISTRATION", hint: "Office management" },
    { word: "INFRASTRUCTURE", hint: "City systems & roads" }, { word: "ACCOUNTABILITY", hint: "Taking blame/credit" },
    { word: "PROCEDURES", hint: "Step by step guides" }, { word: "GUIDELINES", hint: "Rule book" },
    { word: "REGULATION", hint: "Gov rules" }, { word: "COMPLIANCE", hint: "Following rules" },
    { word: "MANAGEMENT", hint: "Bossing & organizing" }, { word: "LEADERSHIP", hint: "Guiding a team" },
    { word: "STRATEGY", hint: "Long-term game plan" }, { word: "MARKETING", hint: "Ad making & sales" },
    { word: "ACCOUNTING", hint: "Money tracking" }, { word: "INVENTORY", hint: "Stock count" },
    { word: "LOGISTICS", hint: "Shipping planning" }, { word: "OPERATIONS", hint: "Daily business tasks" },
    { word: "PRODUCTION", hint: "Manufacturing goods" }, { word: "EFFICIENCY", hint: "No wasted effort" },
    { word: "PROFITABILITY", hint: "Making money metric" }
  ],
  // Tier 8 (Levels 71-80): Harder (10-12 letters)
  [
    { word: "SUSTAINABILITY", hint: "Eco friendly practice" }, { word: "PROCRASTINATE", hint: "Delaying tasks" },
    { word: "INTERDEPENDENCE", hint: "Mutual reliance" }, { word: "UNPREDICTABILITY", hint: "Randomness in life" },
    { word: "NEGOTIATION", hint: "Deal making talks" }, { word: "PRESENTATION", hint: "Slideshow pitch" },
    { word: "COLLABORATION", hint: "Teamwork effort" }, { word: "DEVELOPMENT", hint: "Building things" },
    { word: "PROGRAMMING", hint: "Writing software code" }, { word: "ENGINEERING", hint: "Designing systems" },
    { word: "ARCHITECTURE", hint: "Building design" }, { word: "CONTRACTOR", hint: "Hired builder" },
    { word: "CONSULTANT", hint: "Hired expert advice" }, { word: "SPECIALIST", hint: "Niche expert" },
    { word: "SUPERVISOR", hint: "Overseer of work" }, { word: "COORDINATOR", hint: "Task manager" },
    { word: "FACILITATOR", hint: "Meeting guide" }, { word: "INSTRUCTOR", hint: "Teacher" },
    { word: "RESEARCHER", hint: "Study maker" }, { word: "TECHNICIAN", hint: "Tech worker" },
    { word: "THERAPIST", hint: "Mental health pro" }, { word: "COUNSELOR", hint: "Advisor" },
    { word: "PSYCHOLOGY", hint: "Mind study" }, { word: "PHILOSOPHY", hint: "Thought study" },
    { word: "SOCIOLOGY", hint: "Society study" }, { word: "ECONOMICS", hint: "Money study" },
    { word: "STATISTICS", hint: "Data math" }, { word: "MATHEMATICS", hint: "Numbers study" },
    { word: "LITERATURE", hint: "Book study" }, { word: "GEOGRAPHY", hint: "Map study" },
    { word: "ASTRONOMY", hint: "Star study" }, { word: "BIOLOGY", hint: "Life study" },
    { word: "CHEMISTRY", hint: "Chemical study" }, { word: "PHYSICS", hint: "Force study" },
    { word: "GEOLOGY", hint: "Rock study" }
  ],
  // Tier 9 (Levels 81-90): Very Hard (11-14 letters)
  [
    { word: "CONSCIOUSNESS", hint: "Awareness of self" }, { word: "SUBCONSCIOUS", hint: "Deep underlying mind" },
    { word: "MINDFULNESS", hint: "Being present in moment" }, { word: "MEDITATION", hint: "Zen focus practice" },
    { word: "CONTEMPLATION", hint: "Deep thought" }, { word: "INTROSPECTION", hint: "Self reflection" },
    { word: "CONSIDERATION", hint: "Thoughtful care" }, { word: "DELIBERATION", hint: "Careful discussion" },
    { word: "SPECULATION", hint: "Guessing the future" }, { word: "ASSUMPTION", hint: "Taking for granted" },
    { word: "PRESUMPTION", hint: "Pre-judging a situation" }, { word: "HYPOTHESIS", hint: "Educated guess" },
    { word: "CONJECTURE", hint: "Unproven theory" }, { word: "POSTULATION", hint: "Stating as fact" },
    { word: "SUPPOSITION", hint: "A belief or assumption" }, { word: "DEDUCTION", hint: "Logical conclusion" },
    { word: "CONCLUSION", hint: "Final thought or end" }, { word: "IMPLICATION", hint: "Hinted meaning" },
    { word: "CONSEQUENCE", hint: "Result of an action" }, { word: "RAMIFICATION", hint: "Complex result" },
    { word: "REPERCUSSION", hint: "Negative fallout" }, { word: "SIGNIFICANCE", hint: "Meaningful importance" },
    { word: "IMPORTANCE", hint: "High value or weight" }, { word: "RELEVANCE", hint: "Being pertinent" },
    { word: "PERTINENCE", hint: "Applicability" }, { word: "APPLICABILITY", hint: "Usefulness" },
    { word: "CONNECTION", hint: "Link between things" }, { word: "ASSOCIATION", hint: "Group link" },
    { word: "CORRELATION", hint: "Statistical link" }, { word: "INTERACTION", hint: "Two-way action" },
    { word: "INTEGRATION", hint: "Combining into one" }, { word: "COMBINATION", hint: "Mixing elements" },
    { word: "AMALGAMATION", hint: "Blending together" }, { word: "INCORPORATION", hint: "Including elements" },
    { word: "ASSIMILATION", hint: "Absorbing information" }
  ],
  // Tier 10 (Levels 91-100): Expert (12+ letters)
  [
    { word: "CHARACTERISTIC", hint: "Defining trait" }, { word: "DISTINGUISHING", hint: "Telling apart" },
    { word: "IDENTIFICATION", hint: "Naming or labeling" }, { word: "CLASSIFICATION", hint: "Grouping systematically" },
    { word: "CATEGORIZATION", hint: "Sorting into buckets" }, { word: "DIFFERENTIATION", hint: "Making distinct" },
    { word: "DISCRIMINATION", hint: "Recognizing difference" }, { word: "INVESTIGATION", hint: "Deep search for truth" },
    { word: "EXAMINATION", hint: "Close look or test" }, { word: "EXPLORATION", hint: "Discovering new areas" },
    { word: "OBSERVATION", hint: "Watching closely" }, { word: "INSPECTION", hint: "Checking quality" },
    { word: "SURVEILLANCE", hint: "Spying or monitoring" }, { word: "MONITORING", hint: "Keeping track of systems" },
    { word: "OVERSIGHT", hint: "Supervisory failure/watch" }, { word: "SUPERVISION", hint: "Overseeing work" },
    { word: "IMPLEMENTATION", hint: "Putting into action" }, { word: "EXECUTION", hint: "Carrying out a plan" },
    { word: "PERFORMANCE", hint: "Doing the job well" }, { word: "ACHIEVEMENT", hint: "Winning a goal" },
    { word: "ATTAINMENT", hint: "Reaching a status" }, { word: "FULFILLMENT", hint: "Satisfying a need" },
    { word: "REALIZATION", hint: "Making real or knowing" }, { word: "ACTUALIZATION", hint: "Becoming real" },
    { word: "MATERIALIZATION", hint: "Appearing physically" }, { word: "MANIFESTATION", hint: "Showing clearly" },
    { word: "REPRESENTATION", hint: "Standing for something" }, { word: "ILLUSTRATION", hint: "Drawing or Example" },
    { word: "DEMONSTRATION", hint: "Showing how it works" }, { word: "EXHIBITION", hint: "Displaying publicly" },
    { word: "INTRODUCTIONS", hint: "Meeting people first time" }, { word: "COMPREHENSION", hint: "Deep understanding" },
    { word: "UNDERSTANDING", hint: "Grasping a concept" }, { word: "APPRECIATION", hint: "Valuing highly" },
    { word: "ACKNOWLEDGMENT", hint: "Recognizing a fact" }
  ]
];

const MAX_MISTAKES = 6;

type GameState = "playing" | "win" | "gameover" | "completed";

// Generates a unique 100-word run from the 350-word pool
const generateSessionWords = (): WordObj[] => {
  const session: WordObj[] = [];
  // For each of the 10 tiers, pick exactly 10 random words
  for (let i = 0; i < 10; i++) {
    const tierWords = [...WORDS_BY_TIER[i]];
    // Shuffle the tier
    for (let j = tierWords.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [tierWords[j], tierWords[k]] = [tierWords[k], tierWords[j]];
    }
    // Take the first 10
    session.push(...tierWords.slice(0, 10));
  }
  return session;
};

export default function DailyLifeHacker() {
  const [isClient, setIsClient] = useState(false);
  const [sessionWords, setSessionWords] = useState<WordObj[]>([]);
  const [level, setLevel] = useState(1);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [score, setScore] = useState(0);

  // Initialize session words on client to prevent Next.js hydration mismatch
  useEffect(() => {
    setSessionWords(generateSessionWords());
    setIsClient(true);
  }, []);

  // Derive current word from level
  const currentWordObj = useMemo(() => {
    if (sessionWords.length === 0) return { word: "LOADING", hint: "Please wait..." };
    const index = Math.min(level - 1, sessionWords.length - 1);
    return sessionWords[index];
  }, [level, sessionWords]);

  const resetBoard = useCallback(() => {
    setGuessedLetters(new Set());
    setMistakes(0);
    setGameState("playing");
  }, []);

  const handleNextLevel = useCallback(() => {
    if (level < 100) {
      setLevel((prev) => prev + 1);
      resetBoard();
    } else {
      setGameState("completed");
    }
  }, [level, resetBoard]);

  const handleGuess = useCallback(
    (letter: string) => {
      if (gameState !== "playing" || guessedLetters.has(letter) || !isClient) return;

      const newGuessed = new Set(guessedLetters);
      newGuessed.add(letter);
      setGuessedLetters(newGuessed);

      if (!currentWordObj.word.includes(letter)) {
        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);
        if (newMistakes >= MAX_MISTAKES) {
          setGameState("gameover");
        }
      } else {
        // Check for win condition
        const isWon = currentWordObj.word
          .split("")
          .every((char) => newGuessed.has(char));
        
        if (isWon) {
          setGameState("win");
          // Give more points for harder levels
          setScore((prev) => prev + (100 * Math.ceil(level / 10)));
        }
      }
    },
    [gameState, guessedLetters, currentWordObj, mistakes, level, isClient]
  );

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const letter = e.key.toUpperCase();
      
      if (/^[A-Z]$/.test(letter)) {
        handleGuess(letter);
      } else if (e.code === "Enter" || e.code === "Space") {
        if (gameState === "win") {
          e.preventDefault();
          handleNextLevel();
        } else if (gameState === "gameover") {
          e.preventDefault();
          resetBoard(); // Retry same level
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGuess, gameState, handleNextLevel, resetBoard]);

  // Restart the entire simulation with a fresh random pool
  const restartSimulation = () => {
    setLevel(1);
    setScore(0);
    setSessionWords(generateSessionWords());
    resetBoard();
  };

  // Generate masked word view
  const maskedWord = currentWordObj.word
    .split("")
    .map((char) => (guessedLetters.has(char) ? char : "_"))
    .join(" ");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Prevent SSR flash
  if (!isClient) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 font-mono p-4 select-none">
      <div className="w-full flex flex-col items-center max-w-[500px]">
        
        {/* Back to Menu Navigation (Reference to main menu as seen in image_bcf36e.png) */}
        <div className="w-full mb-6">
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

        {/* Terminal Header */}
        <div className="w-full flex justify-between items-end mb-4 px-2">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
              LIFE_HACKER v4.0
            </h1>
            <p className="text-slate-500 text-xs mt-1">SIMULATING DAILY EXISTENCE</p>
          </div>
          <div className="text-right">
            <span className="text-emerald-400 text-sm font-bold block mb-1">
              PTS: {score}
            </span>
            <span className="text-cyan-400 text-xs font-bold px-2 py-1 bg-cyan-950/50 border border-cyan-800 rounded">
              LVL {level}/100
            </span>
          </div>
        </div>

        {/* Terminal Container */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-4 ring-slate-800 bg-slate-900 p-6 flex flex-col items-center">
          
          {/* Security Status (Hangman Lives) */}
          <div className="w-full flex justify-between items-center mb-6 text-xs text-slate-400 border-b border-slate-800 pb-3">
            <span>
              STRESS_LEVEL: <strong className="text-rose-500">{mistakes}/{MAX_MISTAKES}</strong>
            </span>
            <span className="text-emerald-500 animate-pulse">● ROUTINE_STABLE</span>
          </div>

          {/* Hint Box */}
          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-4 mb-6 text-center shadow-inner">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Current Challenge:
            </p>
            <p className="text-cyan-300 text-sm md:text-base">{currentWordObj.hint}</p>
          </div>

          {/* Word Display */}
          <div className="text-2xl md:text-3xl tracking-widest text-emerald-400 font-bold mb-8 text-center drop-shadow-[0_0_8px_rgba(16,185,129,0.6)] flex flex-wrap justify-center gap-y-3">
            {maskedWord}
          </div>

          {/* Virtual Keyboard Grid */}
          <div className="grid grid-cols-7 gap-1.5 w-full mb-2">
            {alphabet.map((letter) => {
              const isGuessed = guessedLetters.has(letter);
              return (
                <button
                  key={letter}
                  onClick={() => handleGuess(letter)}
                  disabled={isGuessed || gameState !== "playing"}
                  className={`py-2.5 rounded text-sm font-bold transition-all ${
                    isGuessed
                      ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800"
                      : "bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-slate-700 active:scale-95 shadow-sm"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          {/* Overlays for Win / Game Over / Completion */}
          {gameState !== "playing" && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6 text-center">
              {gameState === "win" && (
                <>
                  <h2 className="text-3xl font-black text-emerald-400 mb-2 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                    SUCCESS!
                  </h2>
                  <p className="text-slate-300 text-sm mb-6">
                    You navigated this daily challenge.
                  </p>
                  <button
                    onClick={handleNextLevel}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                  >
                    {level === 100 ? "FINISH GAME" : "NEXT LEVEL"}
                  </button>
                </>
              )}

              {gameState === "gameover" && (
                <>
                  <h2 className="text-3xl font-black text-rose-500 mb-2 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">
                    OVERWHELMED
                  </h2>
                  <p className="text-slate-300 text-sm mb-2">The challenge was:</p>
                  <p className="text-emerald-400 font-bold text-xl mb-6">
                    {currentWordObj.word}
                  </p>
                  <button
                    onClick={resetBoard}
                    className="px-8 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-base rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(225,29,72,0.5)]"
                  >
                    RETRY LEVEL
                  </button>
                </>
              )}

              {gameState === "completed" && (
                <>
                  <h2 className="text-3xl font-black text-cyan-400 mb-2 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                    LIFE MASTERED
                  </h2>
                  <p className="text-slate-300 text-sm mb-2">
                    You survived all 100 levels of daily existence.
                  </p>
                  <p className="text-emerald-400 font-bold text-lg mb-6">
                    Final Score: {score}
                  </p>
                  <button
                    onClick={restartSimulation}
                    className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                  >
                    RESTART SIMULATION
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}