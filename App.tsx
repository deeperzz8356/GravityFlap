import React, { useState, useEffect, useCallback } from 'react';
import { GameState, SkinConfig, DIFFICULTIES, THEMES, ThemeType, LeaderboardEntry } from './types';
import GameCanvas from './components/GameCanvas';
import { generateGameOverCommentary } from './services/geminiService';
import { soundService } from './services/soundService';
import { Play, RotateCcw, AlertCircle, Gauge, Layers, Trophy } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [triggerFlip, setTriggerFlip] = useState(0);
  const [difficultyKey, setDifficultyKey] = useState<string>('NORMAL');
  const [themeKey, setThemeKey] = useState<ThemeType>('NEON_GRID');

  // AI Features State
  const [commentary, setCommentary] = useState<string>("");
  const [skin, setSkin] = useState<SkinConfig>({
    name: "Neon Blue",
    primaryColor: "#00f0ff",
    secondaryColor: "#ffffff",
    glowColor: "#00f0ff",
    trailColor: "rgba(0, 240, 255, 0.5)"
  });

  // Mock Leaderboard Data
  const [leaderboard] = useState<LeaderboardEntry[]>([
    { name: "StarAce", score: 2500, date: "2024-03-10" },
    { name: "GravityX", score: 1850, date: "2024-03-12" },
    { name: "VoidWalker", score: 1200, date: "2024-03-11" },
    { name: "NebulaDrifter", score: 950, date: "2024-03-13" },
    { name: "CosmicRay", score: 800, date: "2024-03-09" },
  ]);

  // Load High Score
  useEffect(() => {
    const saved = localStorage.getItem('gravityFlapHighScore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Save High Score
  useEffect(() => {
    localStorage.setItem('gravityFlapHighScore', highScore.toString());
  }, [highScore]);

  const handleStart = async () => {
    // Resume Audio Context and Start BGM
    await soundService.resume();
    soundService.playBGM();

    setScore(0);
    setGameState(GameState.PLAYING);
    setCommentary("");
  };

  const handleGameOver = useCallback(async () => {
    setGameState(GameState.GAME_OVER);
    soundService.stopBGM();
    if (score > highScore) {
      setHighScore(score);
    }
    const comment = await generateGameOverCommentary(score);
    setCommentary(comment);
  }, [score, highScore]);

  const syncGameState = (newState: GameState) => {
    if (newState === GameState.GAME_OVER && gameState !== GameState.GAME_OVER) {
      handleGameOver();
    } else {
      setGameState(newState);
    }
  };

  // Unified pointer handler for Mouse and Touch to prevent delays or ghost clicks
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState === GameState.PLAYING) {
      e.preventDefault(); // Critical: prevents zooming, scrolling, and selection on mobile
      setTriggerFlip(prev => prev + 1);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        if (gameState === GameState.PLAYING) {
          setTriggerFlip(prev => prev + 1);
        } else if (e.code === 'Space') {
          if (gameState === GameState.MENU) handleStart();
          if (gameState === GameState.GAME_OVER) handleStart();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);



  return (
    <div
      className="relative w-full h-full min-h-screen bg-gray-900 overflow-hidden select-none touch-none"
      onPointerDown={gameState === GameState.PLAYING ? handlePointerDown : undefined}
    >
      {/* Game Layer */}
      <GameCanvas
        gameState={gameState}
        setGameState={syncGameState}
        onScoreUpdate={setScore}
        skin={skin}
        triggerGravityFlip={triggerFlip}
        physics={DIFFICULTIES[difficultyKey]}
        theme={themeKey}
      />

      {/* HUD - Playing */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-0 left-0 w-full p-4 md:p-8 flex justify-between items-start pointer-events-none z-10">
          <div className="flex flex-col">
            <span className="text-5xl md:text-6xl font-display font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
              {score}
            </span>
            <span className="text-xs md:text-sm font-sans text-gray-400 uppercase tracking-widest mt-1">Distance</span>
          </div>
          <div className="text-right">
            <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Gravity</div>
            <div className="text-xl md:text-2xl font-bold text-white animate-pulse">ACTIVE</div>
            <div className="text-[10px] md:text-xs text-blue-400 mt-1 md:mt-2 uppercase tracking-widest">{DIFFICULTIES[difficultyKey].label}</div>
          </div>
        </div>
      )}

      {/* Main Menu */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70 backdrop-blur-sm px-4">
          <div className="flex flex-col items-center max-w-md w-full overflow-y-auto max-h-[100dvh] py-8 no-scrollbar">
            <div className="mb-4 md:mb-6 text-center shrink-0">
              <h1 className="text-5xl md:text-8xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                GRAVITY<br />FLAP
              </h1>
              <p className="text-blue-400 font-mono tracking-widest text-xs md:text-sm">TAP TO INVERT • DODGE</p>
              <div className="mt-2 text-yellow-400 font-bold tracking-wider text-sm">HIGH SCORE: {highScore}</div>
            </div>

            {/* Difficulty Selector */}
            <div className="w-full mb-4 md:mb-6 shrink-0">
              <div className="flex items-center gap-2 mb-2 text-gray-300 justify-center">
                <Gauge size={14} className="md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Difficulty Level</span>
              </div>
              <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                {Object.keys(DIFFICULTIES).map((key) => (
                  <button
                    key={key}
                    onClick={() => setDifficultyKey(key)}
                    className={`flex-1 py-2 md:py-3 text-[10px] md:text-sm font-bold uppercase tracking-wide rounded transition-all active:scale-95 ${difficultyKey === key
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                  >
                    {DIFFICULTIES[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="w-full mb-6 md:mb-8 shrink-0">
              <div className="flex items-center gap-2 mb-2 text-gray-300 justify-center">
                <Layers size={14} className="md:w-4 md:h-4" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">World Theme</span>
              </div>
              <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                {Object.values(THEMES).map((themeObj) => (
                  <button
                    key={themeObj.value}
                    onClick={() => setThemeKey(themeObj.value)}
                    className={`flex-1 py-2 md:py-3 text-[10px] md:text-sm font-bold uppercase tracking-wide rounded transition-all active:scale-95 ${themeKey === themeObj.value
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                  >
                    {themeObj.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="group relative px-6 md:px-8 py-3 md:py-4 bg-white text-black font-bold text-lg md:text-xl uppercase tracking-wider overflow-hidden transition-all hover:scale-105 active:scale-95 mb-6 md:mb-10 w-full shrink-0 rounded shadow-xl"
            >
              <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 mix-blend-difference"></div>
              <span className="relative flex items-center justify-center gap-2">
                <Play size={20} className="md:w-6 md:h-6" fill="currentColor" /> Start Flight
              </span>
            </button>

            {/* Leaderboard */}
            <div className="w-full bg-gray-800/80 p-4 md:p-6 border border-gray-700 rounded-lg backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2 mb-3 md:mb-4 text-gray-300">
                <Trophy size={16} className="text-yellow-400 md:w-[18px] md:h-[18px]" />
                <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Global Leaderboard</h3>
              </div>

              <div className="flex flex-col gap-2">
                {leaderboard.map((entry, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] md:text-xs text-gray-400 border-b border-gray-700/50 pb-1 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold w-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>#{i + 1}</span>
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-mono text-white">{entry.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-red-900/40 backdrop-blur-md px-4">
          <div className="flex flex-col items-center max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-2 drop-shadow-lg">TERMINATED</h2>

            <div className="bg-black/50 p-4 md:p-6 rounded-xl border border-white/10 w-full mb-6 md:mb-8 backdrop-blur-xl shadow-2xl">
              <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-4">
                <div className="text-left">
                  <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Score</div>
                  <div className="text-3xl md:text-4xl font-bold text-white">{score}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest">Best</div>
                  <div className="text-xl md:text-2xl font-bold text-yellow-400">{highScore}</div>
                </div>
              </div>

              {/* AI Roast Section */}
              <div className="bg-gray-800/50 p-3 md:p-4 rounded text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 min-w-[20px]"><AlertCircle size={18} className="text-blue-400 md:w-5 md:h-5" /></div>
                  <div>
                    <p className="text-[10px] md:text-xs font-bold text-blue-400 mb-1 uppercase">AI Analysis</p>
                    <p className="text-xs md:text-sm text-gray-200 leading-relaxed italic">
                      {commentary || "Analyzing flight telemetry..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStart}
              className="px-6 md:px-8 py-3 bg-white text-black font-bold text-base md:text-lg uppercase tracking-wider hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 rounded-full shadow-lg shadow-white/20"
            >
              <RotateCcw size={18} className="md:w-5 md:h-5" /> Retry Mission
            </button>

            <button
              onClick={() => setGameState(GameState.MENU)}
              className="mt-6 text-xs md:text-sm text-gray-400 hover:text-white underline underline-offset-4 decoration-gray-600 transition-colors p-2"
            >
              Return to Hangar
            </button>
          </div>
        </div>
      )}

      {/* Mobile Controls Hint */}
      {gameState === GameState.PLAYING && (
        <div className="absolute bottom-10 w-full text-center pointer-events-none opacity-50 animate-pulse">
          <span className="text-white/50 text-[10px] md:text-sm uppercase tracking-[0.2em] bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
            Tap Screen to Invert
          </span>
        </div>
      )}
    </div>
  );
}