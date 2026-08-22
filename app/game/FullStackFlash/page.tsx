// file: app/game/FullStackFlash/page.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// --- 100 Full-Stack Questions Database ---
const FULL_QUESTION_BANK = [
  // React
  { question: "What does calling setState in React do?", options: ["Immediately updates the state", "Schedules a state update", "Mutates the DOM directly", "Replaces the component"], correct: 1 },
  { question: "Which hook is used for side effects in functional components?", options: ["useState", "useReducer", "useEffect", "useMemo"], correct: 2 },
  { question: "What happens if you pass an empty array [] to useEffect?", options: ["Runs on every render", "Runs only on initial mount", "Never runs", "Throws an error"], correct: 1 },
  { question: "How can you optimize a heavy calculation in a React component?", options: ["useEffect", "useContext", "useMemo", "useRef"], correct: 2 },
  { question: "Which hook provides a mutable ref object whose .current property is initialized to the passed argument?", options: ["useRef", "useState", "useMutable", "useDOM"], correct: 0 },
  { question: "What is the primary purpose of React Context?", options: ["To style components", "To manage local state", "To avoid prop drilling", "To fetch data"], correct: 2 },
  { question: "What is React Fiber?", options: ["A new styling engine", "A reconciliation engine", "A routing library", "A state management tool"], correct: 1 },
  { question: "In React, what are Error Boundaries?", options: ["Components that catch JS errors in their child component tree", "Try-catch blocks in useEffect", "Console warnings", "Linters"], correct: 0 },
  { question: "Which hook is used to access Context values?", options: ["useContext", "useProvider", "useConsumer", "useStore"], correct: 0 },
  { question: "What is a Higher-Order Component (HOC)?", options: ["A component that renders other components", "A function that takes a component and returns a new component", "A component at the root of the app", "A built-in React hook"], correct: 1 },
  { question: "Why is it important to use keys in React lists?", options: ["To encrypt data", "To uniquely identify elements for efficient re-rendering", "To style list items", "To fetch data faster"], correct: 1 },
  { question: "What is StrictMode in React?", options: ["A tool for highlighting potential problems", "A production performance booster", "A CSS framework", "A router setting"], correct: 0 },
  { question: "Which method is used to render a React element into the DOM in React 18?", options: ["ReactDOM.render", "createRoot", "renderDOM", "mount"], correct: 1 },
  { question: "What does the useReducer hook return?", options: ["State and a dispatch function", "State and a setter function", "A ref object", "A context value"], correct: 0 },
  { question: "Can functional components have lifecycle methods?", options: ["Yes, exactly like class components", "No, they use hooks instead", "Only in React 15", "Only when using Redux"], correct: 1 },
  { question: "What is a portal in React?", options: ["A way to render children into a DOM node outside the parent hierarchy", "A routing library", "A state management tool", "An animation library"], correct: 0 },
  { question: "What does React.memo do?", options: ["Memoizes the result of a function", "Memoizes a component to prevent unnecessary re-renders", "Creates a reference to a DOM node", "Manages state"], correct: 1 },
  { question: "What is the Virtual DOM?", options: ["A direct copy of the actual DOM", "A lightweight JavaScript representation of the DOM", "A CSS engine", "A backend server"], correct: 1 },
  { question: "Which hook allows you to defer updating a part of the UI?", options: ["useDeferredValue", "useTransition", "useMemo", "useRef"], correct: 0 },
  { question: "What does useTransition do?", options: ["Handles CSS transitions", "Marks state updates as non-urgent", "Fetches data asynchronously", "Animates component mounting"], correct: 1 },
  
  // Next.js
  { question: "In Next.js App Router, components are by default...", options: ["Client Components", "Server Components", "Static Components", "Dynamic Components"], correct: 1 },
  { question: "Which file is used to define a route segment's UI in the App Router?", options: ["route.js", "layout.js", "page.js", "index.js"], correct: 2 },
  { question: "How do you make a component a Client Component in Next.js?", options: ["use client directive", "export client", "import client", "Client=true"], correct: 0 },
  { question: "What is the purpose of layout.js in Next.js?", options: ["To define global CSS", "To wrap pages and preserve state across navigation", "To fetch server data only", "To define API routes"], correct: 1 },
  { question: "How do you define an API route in the Next.js App Router?", options: ["api.js", "server.js", "route.js", "endpoint.js"], correct: 2 },
  { question: "Which Next.js component is used for optimized image rendering?", options: ["<Picture>", "<Img>", "<Image>", "<OptimizedImage>"], correct: 2 },
  { question: "What does ISR stand for in Next.js?", options: ["Incremental Static Regeneration", "Internal Server Routing", "Initial State Rendering", "Incremental Server Rendering"], correct: 0 },
  { question: "How do you access URL parameters in a Next.js Server Component?", options: ["useParams hook", "Through the params prop", "window.location", "useRouter"], correct: 1 },
  { question: "Which hook is used for programmatic navigation in Client Components?", options: ["useNavigation", "useRouter", "usePathname", "useRedirect"], correct: 1 },
  { question: "What file is used to handle 404 errors in the App Router?", options: ["404.js", "error.js", "not-found.js", "missing.js"], correct: 2 },
  { question: "What is the purpose of loading.js?", options: ["To show an instant loading state using Suspense", "To preload images", "To delay routing", "To fetch data"], correct: 0 },
  { question: "How do you force a route to be dynamically rendered?", options: ["export const dynamic = 'force-dynamic'", "export const ssr = true", "useDynamic()", "export dynamic()"], correct: 0 },
  { question: "What is Server Action in Next.js?", options: ["A backend process", "An asynchronous function executed on the server from the client", "A database query", "A routing method"], correct: 1 },
  { question: "Which file handles unexpected runtime errors in Next.js?", options: ["catch.js", "error.js", "fail.js", "exception.js"], correct: 1 },
  { question: "How can you intercept requests globally in Next.js?", options: ["middleware.js", "interceptor.js", "global.js", "layout.js"], correct: 0 },
  { question: "What component optimizes external links?", options: ["<A>", "<Link>", "<Nav>", "<Anchor>"], correct: 1 },
  { question: "Next.js is built on top of which bundler by default in newer versions?", options: ["Webpack", "Turbopack", "Rollup", "Parcel"], correct: 1 },
  { question: "What is generating static HTML at build time called?", options: ["SSR", "CSR", "SSG", "ISR"], correct: 2 },
  { question: "Which function generates static paths for dynamic routes?", options: ["generatePaths", "generateStaticParams", "getStaticPaths", "makeParams"], correct: 1 },
  { question: "How do you define SEO metadata in the App Router?", options: ["Using a <Head> tag", "Exporting a metadata object", "In next.config.js", "In _document.js"], correct: 1 },

  // Node.js & Backend
  { question: "Which engine powers Node.js?", options: ["SpiderMonkey", "V8", "Chakra", "JavaScriptCore"], correct: 1 },
  { question: "Node.js is primarily...", options: ["Single-threaded", "Multi-threaded", "Thread-per-request", "No-threaded"], correct: 0 },
  { question: "What handles asynchronous operations in Node.js?", options: ["The Event Loop", "The Thread Pool", "The Call Stack", "The Heap"], correct: 0 },
  { question: "Which built-in module is used to work with file systems?", options: ["path", "os", "fs", "file"], correct: 2 },
  { question: "What does npm stand for?", options: ["Node Package Manager", "New Project Module", "Node Project Maker", "Network Package Manager"], correct: 0 },
  { question: "Which HTTP status code signifies 'Not Found'?", options: ["200", "400", "404", "500"], correct: 2 },
  { question: "What is Express.js?", options: ["A database", "A Node.js web application framework", "A frontend library", "A CSS framework"], correct: 1 },
  { question: "What is middleware in Express?", options: ["Functions that have access to req and res objects", "The database layer", "The frontend view", "The deployment server"], correct: 0 },
  { question: "Which command installs a package as a development dependency?", options: ["npm i pkg -d", "npm i pkg --save-dev", "npm install pkg --dev", "npm add pkg -D"], correct: 1 },
  { question: "What is the purpose of package-lock.json?", options: ["To store code", "To lock down specific dependency versions", "To write scripts", "To define the entry point"], correct: 1 },
  { question: "Which Node.js object holds environment variables?", options: ["process.env", "window.env", "global.env", "node.env"], correct: 0 },
  { question: "What is CORS?", options: ["Cross-Origin Resource Sharing", "Central Object Rendering System", "Cross-Origin Routing System", "Control Object Request System"], correct: 0 },
  { question: "Which phase of the event loop executes setImmediate()?", options: ["Timers", "Pending", "Check", "Poll"], correct: 2 },
  { question: "What is the default port for HTTP?", options: ["80", "443", "8080", "3000"], correct: 0 },
  { question: "Which method is used to hash passwords safely?", options: ["Base64", "MD5", "bcrypt", "bcrypt/scrypt/argon2"], correct: 3 },
  { question: "What is JWT?", options: ["Java Web Toolkit", "JSON Web Token", "JavaScript Web Technology", "JSON Window Tag"], correct: 1 },
  { question: "How do you handle unhandled promise rejections in Node?", options: ["process.on('unhandledRejection')", "window.catch()", "try-catch everywhere", "Node handles it automatically"], correct: 0 },
  { question: "What is a stream in Node.js?", options: ["A video player", "An array of objects", "An abstract interface for working with streaming data", "A database table"], correct: 2 },
  { question: "Which module creates a web server?", options: ["http", "web", "server", "url"], correct: 0 },
  { question: "What does 'REST' stand for?", options: ["Representational State Transfer", "Request State Token", "Realtime Server Technology", "Routing Express Server Transfer"], correct: 0 },

  // Databases (MongoDB, SQL, Supabase)
  { question: "MongoDB is an example of a...", options: ["Relational Database", "NoSQL Document Database", "Graph Database", "Key-Value Store"], correct: 1 },
  { question: "In MongoDB, tables are called...", options: ["Rows", "Documents", "Collections", "Schemas"], correct: 2 },
  { question: "Which MongoDB operator is used to sort results?", options: ["$order", "$sort", "$arrange", "$align"], correct: 1 },
  { question: "Supabase is an open-source alternative to...", options: ["AWS", "Heroku", "Firebase", "MongoDB"], correct: 2 },
  { question: "Supabase is built on top of which database?", options: ["MySQL", "SQLite", "MongoDB", "PostgreSQL"], correct: 3 },
  { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Logic", "Standard Query Language", "Server Query Language"], correct: 0 },
  { question: "Which SQL clause filters records?", options: ["ORDER BY", "GROUP BY", "WHERE", "HAVING"], correct: 2 },
  { question: "What is a Primary Key?", options: ["A random number", "A unique identifier for a record", "A foreign identifier", "An encryption key"], correct: 1 },
  { question: "Which MongoDB operator adds to an array only if unique?", options: ["$push", "$set", "$addToSet", "$insert"], correct: 2 },
  { question: "What is an ORM?", options: ["Object-Relational Mapping", "Online Request Manager", "Origin Resource Maker", "Object-Routing Middleware"], correct: 0 },
  { question: "Which of these is a popular Node.js ORM?", options: ["Mongoose", "Prisma", "Both", "Neither"], correct: 2 },
  { question: "In SQL, what links two tables together?", options: ["Primary Key", "Foreign Key", "Index", "Join Key"], correct: 1 },
  { question: "Supabase provides which real-time feature out of the box?", options: ["WebSockets for Postgres changes", "Server-Sent Events only", "Long Polling only", "GraphQL subscriptions"], correct: 0 },
  { question: "What is Row Level Security (RLS) in Postgres/Supabase?", options: ["Encrypting rows", "Restricting data access per user", "Deleting rows safely", "Backing up rows"], correct: 1 },
  { question: "In MongoDB, what is the default ID field called?", options: ["id", "_id", "uuid", "key"], correct: 1 },
  { question: "Which SQL command adds new data?", options: ["ADD", "CREATE", "INSERT", "MAKE"], correct: 2 },
  { question: "Which MongoDB method finds a single document?", options: ["find()", "getOne()", "findOne()", "search()"], correct: 2 },
  { question: "What is database normalization?", options: ["Encrypting data", "Organizing data to reduce redundancy", "Backing up data", "Speeding up queries with indexes"], correct: 1 },
  { question: "What is a database index used for?", options: ["To encrypt data", "To speed up data retrieval", "To define foreign keys", "To backup data"], correct: 1 },
  { question: "ACID properties in DBs stand for...", options: ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Control, Integrity, Data", "Auto, Catch, Index, Delete", "Array, Collection, Item, Document"], correct: 0 },

  // JavaScript / TypeScript / Web Fundamentals
  { question: "What is a Closure in JavaScript?", options: ["A closed browser window", "A function bundled with its lexical environment", "A syntax error", "A loop termination"], correct: 1 },
  { question: "What does 'typeof null' return in JavaScript?", options: ["'null'", "'undefined'", "'object'", "'number'"], correct: 2 },
  { question: "Which keyword defines a constant in JavaScript?", options: ["var", "let", "const", "static"], correct: 2 },
  { question: "What is the DOM?", options: ["Document Object Model", "Data Object Maker", "Document Origin Map", "Digital Object Matrix"], correct: 0 },
  { question: "In TypeScript, how do you define a custom type?", options: ["interface or type", "class only", "struct", "def"], correct: 0 },
  { question: "What does the 'any' type do in TypeScript?", options: ["Throws an error", "Bypasses type checking", "Restricts to strings only", "Forces strict typing"], correct: 1 },
  { question: "What is the spread operator in JS?", options: ["&&", "...", "+++", "==="], correct: 1 },
  { question: "What does JSON stand for?", options: ["JavaScript Object Notation", "Java Syntax Object Name", "JavaScript Output Node", "Java Standard Output"], correct: 0 },
  { question: "Which method converts a JS object to a JSON string?", options: ["JSON.parse()", "JSON.stringify()", "JSON.toString()", "Object.toJSON()"], correct: 1 },
  { question: "What is Event Bubbling?", options: ["Events triggering from parent to child", "Events triggering from child up to parents", "Events canceling each other", "A CSS animation"], correct: 1 },
  { question: "Which array method creates a new array with results of a function?", options: ["forEach()", "filter()", "map()", "reduce()"], correct: 2 },
  { question: "What is a Promise in JavaScript?", options: ["An object representing eventual completion or failure of an async operation", "A guaranteed return statement", "A synchronous loop", "A syntax rule"], correct: 0 },
  { question: "What is the difference between == and ===?", options: ["None", "=== checks value and type, == checks only value", "== is for strings, === is for numbers", "=== is a typo"], correct: 1 },
  { question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System", "Colorful Style Sheets"], correct: 0 },
  { question: "What does Tailwind CSS use primarily?", options: ["Inline styles", "Utility classes", "CSS Modules", "Sass"], correct: 1 },
  { question: "Which HTML tag is used to include an external JS file?", options: ["<js>", "<script>", "<link>", "<code>"], correct: 1 },
  { question: "What is 'Hoisting' in JavaScript?", options: ["Moving elements to the top of the screen", "Moving variable/function declarations to the top of their scope", "A CSS property", "A Node.js package"], correct: 1 },
  { question: "In TypeScript, what is a Generic?", options: ["A generic brand function", "A way to create reusable components that work with multiple types", "A standard string", "An 'any' type alternative"], correct: 1 },
  { question: "What is 'localStorage'?", options: ["Server-side storage", "Temporary session storage", "Persistent client-side browser storage", "A database"], correct: 2 },
  { question: "What is an IIFE?", options: ["Immediately Invoked Function Expression", "Internal Instance For Execution", "Integer Item Format Error", "Inline Interface For Elements"], correct: 0 }
];

const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION_MS = 100; // 100 ticks of 100ms = 10.0 seconds
const POINTS_PER_CORRECT = 100;

type GameState = 'start' | 'playing' | 'game-over';

export default function FullStackFlash() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>('start');
  const [sessionQuestions, setSessionQuestions] = useState<typeof FULL_QUESTION_BANK>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  
  // Timer state (100 = 10s, 0 = 0s)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION_MS);
  
  // Interaction state
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Initialize and handle hydration
  useEffect(() => {
    setIsClient(true);
    generateSession();
  }, []);

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

  const generateSession = useCallback(() => {
    // Fisher-Yates shuffle
    const shuffled = [...FULL_QUESTION_BANK];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSessionQuestions(shuffled.slice(0, QUESTIONS_PER_ROUND));
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, isPaused]);

  // Handle Timeout
  useEffect(() => {
    if (timeLeft <= 0 && gameState === 'playing' && !isPaused) {
      handleTimeout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameState, isPaused]);

  const handleTimeout = () => {
    setIsPaused(true);
    setSelectedAnswer(-1); // -1 indicates timeout (no selection)
    setTimeout(() => {
      advanceQuestion();
    }, 1500);
  };

  const handleAnswer = (index: number) => {
    if (isPaused || gameState !== 'playing') return;

    setIsPaused(true);
    setSelectedAnswer(index);

    if (index === sessionQuestions[currentIndex].correct) {
      setScore((prev) => prev + POINTS_PER_CORRECT);
    }

    setTimeout(() => {
      advanceQuestion();
    }, 1500);
  };

  const advanceQuestion = () => {
    if (currentIndex < QUESTIONS_PER_ROUND - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(TIME_PER_QUESTION_MS);
      setSelectedAnswer(null);
      setIsPaused(false);
    } else {
      setGameState('game-over');
    }
  };

  const startGame = () => {
    generateSession();
    setGameState('playing');
    setCurrentIndex(0);
    setScore(0);
    setTimeLeft(TIME_PER_QUESTION_MS);
    setSelectedAnswer(null);
    setIsPaused(false);
  };

  // --- Dynamic Styling ---
  const currentQ = sessionQuestions[currentIndex];
  
  const getTimerColor = () => {
    if (timeLeft > 50) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]';
    if (timeLeft > 20) return 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]';
    return 'bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.8)]';
  };

  const getButtonClass = (index: number) => {
    const base = "w-full p-3 sm:p-4 rounded-xl border-2 text-left font-semibold transition-all duration-200 transform active:scale-95 flex items-center";
    
    // Default state
    if (!isPaused) {
      return `${base} bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] text-slate-200`;
    }

    // Answer revealed state
    if (index === currentQ?.correct) {
      return `${base} bg-emerald-600/20 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] z-10`;
    }
    
    if (index === selectedAnswer) {
      return `${base} bg-rose-600/20 border-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]`;
    }
    
    return `${base} bg-slate-950 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed`;
  };

  const getEvaluation = () => {
    const maxScore = QUESTIONS_PER_ROUND * POINTS_PER_CORRECT;
    if (score === maxScore) return "10x Developer (Perfect Score!)";
    if (score >= maxScore * 0.8) return "Senior Full-Stack Engineer";
    if (score >= maxScore * 0.5) return "Mid-Level Developer";
    return "Junior Developer (Keep learning!)";
  };

  if (!isClient || sessionQuestions.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={`h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 overflow-hidden select-none font-sans p-2 sm:p-4 transition-all ${isFullscreen ? 'rounded-none' : ''}`}
    >
      <div className="w-full max-w-md md:max-w-2xl flex flex-col h-full justify-center">
        
        {/* Navigation & Fullscreen */}
        <div className="w-full mb-4 sm:mb-6 shrink-0 flex justify-between items-center px-2">
          <Link 
            href="/game" 
            className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-cyan-400 transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            BACK TO ARCADE
          </Link>
          
          <button 
            onClick={toggleFullScreen}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-500 text-slate-400 p-2 rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            )}
          </button>
        </div>

        {/* --- START SCREEN --- */}
        {gameState === 'start' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 p-2">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 md:p-12 rounded-3xl shadow-2xl text-center w-full relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-3 sm:mb-4 tracking-tight drop-shadow-md">
                Full-Stack Flash
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm md:text-base mb-6 sm:mb-8 leading-relaxed">
                Test your modern web development knowledge. <br className="hidden md:block" />
                10 seconds per question. 10 questions per run. Quick reflexes.
              </p>
              
              <button 
                onClick={startGame}
                className="w-full py-3 sm:py-4 px-6 sm:px-8 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-lg sm:text-xl rounded-xl transition-all duration-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] active:scale-95"
              >
                START QUIZ
              </button>
            </div>
          </div>
        )}

        {/* --- PLAYING SCREEN --- */}
        {gameState === 'playing' && (
          <div className="flex-1 flex flex-col w-full min-h-0 py-2 px-2">
            {/* Header Stats */}
            <div className="flex justify-between items-end mb-3 sm:mb-4 shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Progress</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-white">
                  Q {currentIndex + 1} <span className="text-slate-500 text-xs sm:text-sm md:text-base font-medium">/ {QUESTIONS_PER_ROUND}</span>
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Score</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">{score}</span>
              </div>
            </div>

            {/* Progress Bar (Timer) */}
            <div className="w-full h-1.5 sm:h-2 bg-slate-800 rounded-full overflow-hidden mb-4 sm:mb-6 shrink-0 shadow-inner">
              <div 
                className={`h-full transition-all duration-100 ease-linear ${getTimerColor()}`}
                style={{ width: `${Math.max(0, timeLeft)}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 md:p-8 shadow-2xl overflow-y-auto custom-scrollbar">
              <h2 className="text-base sm:text-lg md:text-2xl font-bold text-slate-100 mb-6 leading-snug md:leading-relaxed">
                {currentQ.question}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mt-auto">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    disabled={isPaused}
                    className={getButtonClass(index)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <span className="flex items-center justify-center shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-slate-950 border border-slate-700 text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-xs sm:text-sm md:text-base leading-tight text-left">
                        {option}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Status indicator during pause */}
            <div className="h-6 mt-3 sm:mt-4 shrink-0 flex justify-center items-center">
              {isPaused && (
                <span className={`text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase animate-pulse ${selectedAnswer === currentQ.correct ? 'text-emerald-400' : selectedAnswer === -1 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {selectedAnswer === currentQ.correct ? 'CORRECT (+100)' : selectedAnswer === -1 ? 'TIME OUT' : 'INCORRECT'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* --- GAME OVER SCREEN --- */}
        {gameState === 'game-over' && (
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 p-2">
            <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 md:p-12 rounded-3xl shadow-2xl text-center w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-purple-500" />
              
              <h2 className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Final Score</h2>
              <div className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-4 sm:mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {score}
              </div>
              
              <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-950 border border-slate-700 rounded-lg mb-6 sm:mb-8">
                <span className="text-cyan-400 font-bold text-xs sm:text-sm md:text-base">
                  Rank: {getEvaluation()}
                </span>
              </div>
              
              <button 
                onClick={startGame}
                className="w-full py-3 sm:py-4 px-6 sm:px-8 bg-slate-100 hover:bg-white text-slate-900 font-black text-lg sm:text-xl rounded-xl transition-all duration-200 shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] active:scale-95"
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}