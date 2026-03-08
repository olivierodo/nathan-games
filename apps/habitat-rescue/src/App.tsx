import React, { useEffect, useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import { generateGrid } from './constants';
import { Grid } from './components/Grid';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Dice5, Shield, Droplets, HeartPulse, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from './utils/audio';
import { generateIntroSpeech } from './services/gemini';

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const {
    gameState,
    player,
    wolves,
    moles,
    layer,
    handleMove,
    handleEnterBurrow,
    handleQuizAnswer,
    currentQuestion,
    message,
    handleUseItem,
    setPlayer,
    grid,
    quizzesSolved,
    turn,
    isRaining,
    handleRainAck
  } = useGameLogic();

  const startGame = async () => {
      sounds.init();
      setHasStarted(true);
      
      setIsLoadingTTS(true);
      try {
          // 1. Try to fetch pre-generated file
          let response = await fetch('/intro.wav');
          
          // 2. If not found, check Cache API
          if (!response.ok) {
              const cache = await caches.open('game-assets');
              response = await cache.match('/intro-speech') || response;
          }

          // 3. If still not found, generate it
          if (!response.ok) {
              console.log("Generating intro speech...");
              const audioBuffer = await generateIntroSpeech();
              if (audioBuffer) {
                  // Cache it
                  const cache = await caches.open('game-assets');
                  const newResponse = new Response(audioBuffer, { headers: { 'Content-Type': 'audio/wav' } });
                  await cache.put('/intro-speech', newResponse.clone());
                  
                  sounds.playBuffer(audioBuffer);
              }
          } else {
              // Play from file or cache
              const buffer = await response.arrayBuffer();
              sounds.playBuffer(buffer);
          }
      } catch (e) {
          console.error("Failed to load/generate intro audio", e);
      }
      setIsLoadingTTS(false);
  };

  // Keyboard controls
  useEffect(() => {
    if (!hasStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || isRaining) return;
      
      switch (e.key) {
        case 'ArrowUp': handleMove(0, -1); break;
        case 'ArrowDown': handleMove(0, 1); break;
        case 'ArrowLeft': handleMove(-1, 0); break;
        case 'ArrowRight': handleMove(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleMove, hasStarted, isRaining]);

  // Check for tile effects (Water Source, Checkpoint)
  useEffect(() => {
    if (!hasStarted) return;
    const currentTile = grid.find(t => t.x === player.position.x && t.y === player.position.y);
    if (currentTile) {
        if (currentTile.type === 'water-source' && layer === 'surface') {
            // Logic for water source? GDD says "Rolling dice here gives +2 extra". 
            // We can handle that in the roll logic or just give a passive boost?
            // "Rolling the dice here gives +2 extra water." -> Implies active choice.
        }
        if (currentTile.type === 'checkpoint' && !player.items.includes('freeze-block')) {
             setPlayer(prev => ({ ...prev, items: [...prev.items, 'freeze-block'] }));
        }
    }
  }, [player.position, grid, layer, setPlayer, hasStarted]);

  // Heartbeat Logic (Check closest mole)
  let minMoleDistance = Infinity;
  moles.forEach(m => {
      const d = Math.sqrt(Math.pow(m.position.x - player.position.x, 2) + Math.pow(m.position.y - player.position.y, 2));
      if (d < minMoleDistance) minMoleDistance = d;
  });

  const showHeartbeat = layer === 'underground' && minMoleDistance <= 3;
  const heartbeatSpeed = minMoleDistance <= 1 ? 0.3 : minMoleDistance <= 2 ? 0.6 : 1;

  if (!hasStarted) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-white font-pixel p-4">
              <h1 className="text-4xl md:text-6xl text-yellow-400 mb-8 text-center leading-tight" style={{ textShadow: '4px 4px 0 #000' }}>
                  HABITAT<br/>RESCUE
              </h1>
              <button 
                  onClick={startGame}
                  className="bg-white text-black px-8 py-4 text-xl border-4 border-b-8 border-r-8 border-gray-400 active:border-b-4 active:border-r-4 active:translate-y-1 transition-all flex items-center gap-4 hover:bg-gray-100"
              >
                  <Play size={24} fill="black" /> START GAME
              </button>
              <p className="mt-8 text-xs text-stone-500">CLICK TO ENABLE SOUND</p>
          </div>
      );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-700 font-pixel ${layer === 'surface' ? 'bg-[#86efac] text-black' : 'bg-[#4c1d95] text-white'}`}>
      
      {/* Header / HUD */}
      <div className="w-full max-w-2xl flex flex-col md:flex-row justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-black">
        <div className="mb-4 md:mb-0">
            <h1 className="text-xl font-bold tracking-tighter uppercase">Habitat Rescue</h1>
            <p className="text-[10px] uppercase">{layer === 'surface' ? 'SURFACE LAYER' : 'UNDERGROUND LAYER'}</p>
        </div>
        
        <div className="flex gap-6 items-center">
            <div className="flex items-center gap-2">
                <Droplets className={player.water < 2 ? 'text-red-500 animate-pulse' : 'text-blue-500'} />
                <div className="flex flex-col w-32">
                    <div className="flex justify-between text-[10px] uppercase mb-1 font-bold">
                        <span>Water</span>
                        <span>{player.water.toFixed(1)}/{player.maxWater}</span>
                    </div>
                    <div className="w-full h-4 bg-gray-300 border-2 border-black relative">
                        <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(player.water / player.maxWater) * 100}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                        />
                    </div>
                </div>
            </div>
            {player.items.includes('freeze-block') && (
                <div className="flex items-center gap-2 text-blue-600">
                    <Shield size={20} />
                    <span className="text-[10px] font-bold">ICE</span>
                </div>
            )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="relative p-2 bg-black rounded-sm shadow-[10px_10px_0_0_rgba(0,0,0,0.5)]">
        <Grid grid={grid} player={player} wolves={wolves} moles={moles} layer={layer} />
        
        {/* Heartbeat Overlay */}
        {showHeartbeat && (
            <motion.div 
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.2, 1.5] }}
                transition={{ duration: heartbeatSpeed, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-full h-full bg-red-500/20 mix-blend-overlay" />
            </motion.div>
        )}
      </div>

      {/* Controls / Actions */}
      <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
        {player.items.includes('freeze-block') ? (
             <button 
                onClick={handleUseItem}
                className="col-span-2 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white p-4 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={gameState !== 'playing' || isRaining}
            >
                <Shield size={16} /> FREEZE BLOCK
            </button>
        ) : (
            <div className="col-span-2 flex items-center justify-center p-4 border-4 border-black border-dashed text-black/50 text-xs bg-white/50">
                FIND CHECKPOINT FOR ITEM
            </div>
        )}

        {/* Burrow Toggle (Contextual) */}
        {grid.find(t => t.x === player.position.x && t.y === player.position.y)?.type === 'burrow' && (
             <button 
             onClick={handleEnterBurrow}
             className="col-span-2 bg-[#92400e] hover:bg-[#78350f] text-white p-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all animate-bounce disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={gameState !== 'playing' || isRaining}
         >
             {layer === 'surface' ? 'ENTER BURROW' : 'EXIT BURROW'}
         </button>
        )}
      </div>

      {/* Message Log */}
      <div className="mt-6 min-h-[3rem] w-full max-w-2xl bg-white border-4 border-black p-2 text-center text-xs md:text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center text-black">
        {message}
      </div>

       {/* Quiz Modal */}
       <AnimatePresence>
        {isRaining && (
             <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/90 p-4 font-pixel"
         >
             <div className="bg-blue-100 border-4 border-blue-800 p-8 max-w-md w-full shadow-[12px_12px_0_0_rgba(0,0,0,0.5)] text-center text-blue-900">
                 <div className="flex justify-center mb-4">
                     <Droplets size={48} className="text-blue-600 animate-bounce" />
                 </div>
                 <h2 className="text-2xl font-bold mb-4">HEAVY RAIN!</h2>
                 <p className="text-sm mb-6 leading-relaxed">A STORM HAS ARRIVED.<br/>WATER REFILLED!</p>
                 <button 
                     onClick={handleRainAck}
                     className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                 >
                     CONTINUE
                 </button>
             </div>
         </motion.div>
        )}

        {gameState === 'quiz' && currentQuestion && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-pixel"
            >
                <div className="bg-[#fef3c7] border-4 border-black p-6 max-w-lg w-full shadow-[12px_12px_0_0_rgba(255,255,255,0.2)] text-black relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-4 py-2 border-4 border-black font-bold animate-pulse">
                        MOLE ENCOUNTER!
                    </div>
                    
                    <p className="text-sm md:text-base mb-8 mt-4 leading-relaxed border-2 border-black/10 p-4 bg-white">
                        {currentQuestion.text}
                    </p>
                    <div className="grid gap-4">
                        {currentQuestion.options.map((option: string, index: number) => (
                            <button
                                key={index}
                                onClick={() => handleQuizAnswer(index)}
                                className="p-4 text-left bg-white hover:bg-gray-100 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all text-xs md:text-sm"
                            >
                                {index + 1}. {option}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over / Win Screens */}
      <AnimatePresence>
        {(gameState === 'game-over' || gameState === 'won') && (
             <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 font-pixel"
         >
             <div className="text-center max-w-md w-full bg-white p-8 border-4 border-black shadow-[12px_12px_0_0_#444]">
                 <h1 className={`text-3xl md:text-4xl font-black mb-6 ${gameState === 'won' ? 'text-green-600' : 'text-red-600'}`}>
                     {gameState === 'won' ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
                 </h1>
                 
                 {gameState === 'won' && (
                    <div className="mb-6 space-y-4 bg-gray-100 p-4 border-2 border-black">
                        <div className="text-sm mb-4 text-black">
                            RANK: <span className="text-blue-600 font-bold">{player.water >= 20 ? 'S' : player.water >= 6 ? 'A' : 'B'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-600">
                            <div className="bg-white p-2 border border-black">
                                <div className="uppercase opacity-50">Rounds</div>
                                <div className="text-lg text-black">{turn}</div>
                            </div>
                            <div className="bg-white p-2 border border-black">
                                <div className="uppercase opacity-50">Water</div>
                                <div className="text-lg text-blue-600">{player.water.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>
                 )}

                 <p className="text-sm text-black mb-8">{message}</p>
                 <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-black text-white px-8 py-4 text-xl hover:bg-gray-800 border-4 border-gray-500 transition-transform uppercase tracking-widest"
                 >
                    RETRY
                 </button>
             </div>
         </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Controls Hint */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <div className="grid grid-cols-3 gap-2">
            <div />
            <button onClick={() => handleMove(0, -1)} className="p-4 bg-white border-2 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-x-px active:translate-y-px"><ArrowUp color="black" /></button>
            <div />
            <button onClick={() => handleMove(-1, 0)} className="p-4 bg-white border-2 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-x-px active:translate-y-px"><ArrowLeft color="black" /></button>
            <button onClick={() => handleMove(0, 1)} className="p-4 bg-white border-2 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-x-px active:translate-y-px"><ArrowDown color="black" /></button>
            <button onClick={() => handleMove(1, 0)} className="p-4 bg-white border-2 border-black shadow-[2px_2px_0_0_black] active:shadow-none active:translate-x-px active:translate-y-px"><ArrowRight color="black" /></button>
        </div>
      </div>

    </div>
  );
}
