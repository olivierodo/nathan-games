import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Player, SquareData, SquareType, GameStage, RiddleData } from './types';
import { INITIAL_BOARD, FRUIT_AVATARS, BOARD_SIZE } from './constants';
import Square from './components/Square';
import RiddleModal from './components/RiddleModal';
import { generateAllRiddles, generateAudio } from './services/geminiService';
import { Dice6, UserPlus, Play, RotateCcw, Swords, AlertTriangle, Zap, Plane, TreePine, Leaf, Flower2, Loader2, Home, Trophy, Skull, CloudDownload, Star, ChevronRight, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(GameStage.SETUP);
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [board, setBoard] = useState<SquareData[]>(INITIAL_BOARD);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(0);
  const [message, setMessage] = useState('Welcome to Fruit Escape!');
  const [activeTrap, setActiveTrap] = useState<{ type: 'MISSILE' | 'BOMB'; riddle: RiddleData; audioBuffer?: AudioBuffer } | null>(null);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [preloadStatus, setPreloadStatus] = useState('');
  const [isLoadingRiddle, setIsLoadingRiddle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Derived state
  const currentPlayer = players[currentPlayerIdx];
  const alivePlayers = players.filter(p => !p.isEliminated);
  const othersOnSameSquare = currentPlayer ? players.filter(p => 
    p.id !== currentPlayer.id && 
    p.position === currentPlayer.position && 
    p.position !== 0 && 
    !p.isEliminated
  ) : [];
  
  const moveInProgress = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = (freq: number, type: OscillatorType = 'sine', duration = 0.1) => {
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const triggerVictory = () => {
    setStage(GameStage.GAMEOVER);
    playSound(523.25, 'sine', 0.5); // C5
    setTimeout(() => playSound(659.25, 'sine', 0.5), 200); // E5
    setTimeout(() => playSound(783.99, 'sine', 0.8), 400); // G5
    
    (window as any).confetti?.({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ef4444', '#facc15', '#22c55e', '#3b82f6']
    });
  };

  const startPreloading = async () => {
    setStage(GameStage.PRELOADING);
    setPreloadProgress(10);
    setPreloadStatus('Summoning forest guardians...');

    const trapSquares = INITIAL_BOARD.filter(s => s.type === SquareType.MISSILE || s.type === SquareType.BOMB)
      .map(s => ({ id: s.id, type: s.type as 'MISSILE' | 'BOMB' }));
    
    try {
      const allRiddles = await generateAllRiddles(trapSquares);
      setPreloadProgress(80);
      setPreloadStatus('Riddles generated! Starting orchard...');

      const newBoard = INITIAL_BOARD.map(s => {
        const riddleData = allRiddles.find(r => r.squareId === s.id);
        return { 
          ...s, 
          used: false, 
          riddle: riddleData ? {
            riddle: riddleData.riddle,
            options: riddleData.options,
            answer: riddleData.answer,
            explanation: riddleData.explanation
          } : undefined 
        };
      });
      setBoard(newBoard);

      const newPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
        id: i,
        name: FRUIT_AVATARS[i].name,
        emoji: FRUIT_AVATARS[i].emoji,
        color: FRUIT_AVATARS[i].color,
        position: 0,
        isEliminated: false,
      }));
      setPlayers(newPlayers);
      setCurrentPlayerIdx(0);
      setPreloadProgress(100);

      setTimeout(() => {
        setStage(GameStage.PLAYING);
        setMessage(`${newPlayers[0].name}'s turn! Reach square 50!`);
        generateBackgroundAudio(newBoard);
      }, 800);

    } catch (err) {
      console.error("Preload error:", err);
      setStage(GameStage.SETUP);
    }
  };

  const generateBackgroundAudio = async (currentBoard: SquareData[]) => {
    const ctx = initAudio();
    const squaresWithRiddles = currentBoard.filter(s => s.riddle && !s.audioBuffer);
    
    for (const sq of squaresWithRiddles) {
      if (!sq.riddle) continue;
      try {
        const audioBuffer = await generateAudio(sq.riddle.riddle, ctx);
        if (audioBuffer) {
          setBoard(prev => prev.map(s => s.id === sq.id ? { ...s, audioBuffer } : s));
        }
      } catch (err) {
        console.warn(`Could not generate background audio for square ${sq.id}`, err);
      }
    }
  };

  const backToMenu = () => {
    setStage(GameStage.SETUP);
    setPlayers([]);
    setBoard(INITIAL_BOARD.map(s => ({ ...s, used: false })));
    setLastRoll(0);
    setMessage('Welcome to Fruit Escape!');
  };

  const findNextValidPlayer = (currentIndex: number, currentPlayers: Player[]) => {
    let next = (currentIndex + 1) % currentPlayers.length;
    let attempts = 0;
    while (currentPlayers[next].isEliminated && attempts < currentPlayers.length) {
      next = (next + 1) % currentPlayers.length;
      attempts++;
    }
    return next;
  };

  const handleSquareAction = async (playerIdx: number, pos: number) => {
    const square = board[pos];
    if (!square) return;

    if (square.type === SquareType.CHEST) {
      playSound(660, 'square', 0.3);
      const bonus = Math.floor(Math.random() * 3) + 1;
      setMessage(`Yum! +${bonus} extra steps!`);
      setTimeout(() => animateMove(playerIdx, bonus), 800);
      return;
    }

    if (square.type === SquareType.PLANE) {
      playSound(880, 'sine', 0.5);
      const dest = square.destination!;
      setMessage(`Flying to ${square.name || 'the next port'}!`);
      setTimeout(() => {
        setPlayers(prev => prev.map((p, i) => i === playerIdx ? { ...p, position: dest } : p));
        finishTurn(playerIdx, `Landed safely!`);
      }, 1200);
      return;
    }

    if ((square.type === SquareType.MISSILE || square.type === SquareType.BOMB) && !square.used) {
      if (square.riddle) {
        setActiveTrap({ 
          type: square.type as 'MISSILE' | 'BOMB', 
          riddle: square.riddle, 
          audioBuffer: square.audioBuffer 
        });
      }
      return;
    }

    finishTurn(playerIdx);
  };

  const finishTurn = (playerIdx: number, extraMsg?: string) => {
    setPlayers(currentPlayers => {
      const alive = currentPlayers.filter(p => !p.isEliminated);
      if (alive.length === 1 && currentPlayers.length > 1) {
        triggerVictory();
        return currentPlayers;
      }
      if (alive.length === 0) {
        setStage(GameStage.GAMEOVER);
        return currentPlayers;
      }

      const nextIdx = findNextValidPlayer(playerIdx, currentPlayers);
      const nextP = currentPlayers[nextIdx];
      setMessage(`${extraMsg ? extraMsg + ' ' : ''}${nextP.name}'s turn!`);
      setCurrentPlayerIdx(nextIdx);
      moveInProgress.current = false;
      return currentPlayers;
    });
  };

  const animateMove = (playerIdx: number, steps: number) => {
    if (steps <= 0) {
      handleSquareAction(playerIdx, players[playerIdx].position);
      return;
    }
    
    moveInProgress.current = true;
    let stepsTaken = 0;
    
    const moveOneStep = () => {
      if (stepsTaken < steps) {
        let reachedFinish = false;
        
        setPlayers(prev => {
          const newPlayers = [...prev];
          const p = { ...newPlayers[playerIdx] };
          
          if (p.position < BOARD_SIZE - 1) {
            p.position += 1;
            playSound(400 + p.position * 10, 'sine', 0.05);
          }
          
          if (p.position >= BOARD_SIZE - 1) {
            p.position = BOARD_SIZE - 1;
            reachedFinish = true;
          }
          
          newPlayers[playerIdx] = p;
          return newPlayers;
        });
        
        stepsTaken++;
        
        if (reachedFinish) {
          triggerVictory();
          moveInProgress.current = false;
        } else {
          setTimeout(moveOneStep, 250);
        }
      } else {
        setPlayers(finalPlayers => {
          handleSquareAction(playerIdx, finalPlayers[playerIdx].position);
          return finalPlayers;
        });
      }
    };
    
    moveOneStep();
  };

  const rollDice = () => {
    if (isRolling || moveInProgress.current || stage !== GameStage.PLAYING) return;
    setIsRolling(true);
    playSound(330, 'square', 0.1);
    const roll = Math.floor(Math.random() * 6) + 1;
    setLastRoll(roll);

    setTimeout(() => {
      setIsRolling(false);
      animateMove(currentPlayerIdx, roll);
    }, 800);
  };

  const handleRiddleSolve = (success: boolean) => {
    if (!activeTrap) return;
    const { type } = activeTrap;
    const playerIdx = currentPlayerIdx;

    setBoard(prev => prev.map((sq, i) => i === players[playerIdx].position ? { ...sq, used: true } : sq));

    if (success) {
      playSound(880, 'sine', 0.4);
      setMessage(`Success! Guardian lets you pass.`);
      setActiveTrap(null);
      setTimeout(() => finishTurn(playerIdx), 1500);
    } else {
      playSound(150, 'sawtooth', 0.6);
      if (type === 'MISSILE') {
        setMessage(`BLASTED! Back to square 0!`);
        setPlayers(prev => prev.map((p, i) => i === playerIdx ? { ...p, position: 0 } : p));
        setActiveTrap(null);
        setTimeout(() => finishTurn(playerIdx), 1500);
      } else {
        setMessage(`NOOO! ${players[playerIdx].name} was squashed...`);
        setPlayers(prev => {
          const nextPlayers = prev.map((p, i) => i === playerIdx ? { ...p, isEliminated: true } : p);
          const alive = nextPlayers.filter(p => !p.isEliminated);
          
          if (alive.length === 1 && nextPlayers.length > 1) {
            setActiveTrap(null);
            triggerVictory();
          } else if (alive.length === 0) {
            setActiveTrap(null);
            setStage(GameStage.GAMEOVER);
          } else {
             setActiveTrap(null);
             setTimeout(() => finishTurn(playerIdx), 1500);
          }
          return nextPlayers;
        });
      }
    }
  };

  const handlePunch = (targetId: number) => {
    playSound(100, 'square', 0.2);
    setPlayers(prev => {
      const nextPlayers = prev.map(p => p.id === targetId ? { ...p, position: 0 } : p);
      setMessage(`BUMP! ${prev.find(p => p.id === targetId)?.name} hit!`);
      return nextPlayers;
    });
  };

  if (stage === GameStage.SETUP) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-md" />
        <div className="relative z-10 bg-white/95 border-8 border-emerald-400 rounded-[3rem] p-10 max-w-xl w-full text-center shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <Leaf className="absolute top-4 left-4 text-emerald-200 animate-pulse" size={40} />
          <Flower2 className="absolute bottom-4 right-4 text-orange-200 animate-bounce" size={48} />
          <h1 className="text-6xl font-black text-emerald-900 mb-2 italic tracking-tighter drop-shadow-md">FRUIT ESCAPE</h1>
          <p className="text-orange-600 font-bold text-xl mb-8 uppercase tracking-[0.2em] animate-pulse italic">Run for the Orchard!</p>
          <div className="space-y-6">
            <div>
              <label className="text-stone-500 block mb-4 font-black uppercase text-sm">How many fruits are running?</label>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => setNumPlayers(Math.max(1, numPlayers - 1))} className="w-14 h-14 rounded-2xl bg-white text-emerald-600 text-3xl font-black border-4 border-emerald-400 shadow-md hover:scale-105 active:scale-95 transition-all">-</button>
                <div className="flex items-center gap-3 bg-emerald-500 px-10 py-4 rounded-3xl border-4 border-white shadow-xl">
                  <UserPlus className="text-white" />
                  <span className="text-5xl font-black text-white leading-none">{numPlayers}</span>
                </div>
                <button onClick={() => setNumPlayers(Math.min(10, numPlayers + 1))} className="w-14 h-14 rounded-2xl bg-white text-emerald-600 text-3xl font-black border-4 border-emerald-400 shadow-md hover:scale-105 active:scale-95 transition-all">+</button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 py-6">
              {FRUIT_AVATARS.slice(0, numPlayers).map(f => (
                <div key={f.name} className="flex flex-col items-center animate-bounce" style={{ animationDelay: `${Math.random()}s` }}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl ${f.color} shadow-lg ring-4 ring-white`}>{f.emoji}</div>
                </div>
              ))}
            </div>
            <button onClick={startPreloading} className="w-full bg-orange-500 hover:bg-orange-400 text-white font-black py-6 rounded-[2rem] text-3xl shadow-2xl transform active:scale-95 transition-all flex items-center justify-center gap-4 border-b-8 border-orange-700 uppercase">
              <Play fill="currentColor" size={32} /> Race Start!
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === GameStage.PRELOADING) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-md" />
        <div className="relative z-10 bg-white/95 border-8 border-emerald-400 rounded-[3rem] p-12 max-w-xl w-full text-center shadow-2xl overflow-hidden">
          <CloudDownload className="mx-auto w-24 h-24 text-emerald-500 mb-8 animate-bounce" />
          <h2 className="text-4xl font-black text-emerald-900 mb-4 italic uppercase">Preparing Orchard</h2>
          <p className="text-stone-500 font-bold mb-8 text-lg">{preloadStatus}</p>
          <div className="w-full bg-emerald-100 h-8 rounded-full border-4 border-emerald-50 overflow-hidden shadow-inner relative">
            <div className="h-full bg-emerald-500 transition-all duration-500 ease-out" style={{ width: `${preloadProgress}%` }} />
            <span className="absolute inset-0 flex items-center justify-center font-black text-emerald-900 drop-shadow-sm text-sm">{Math.round(preloadProgress)}%</span>
          </div>
        </div>
      </div>
    );
  }

  const winner = alivePlayers.length === 1 && players.length > 1 
    ? alivePlayers[0] 
    : players.find(p => p.position === BOARD_SIZE - 1);

  return (
    <div className="h-screen w-screen bg-emerald-50 overflow-hidden relative font-Fredoka select-none">
      
      {/* FULLSCREEN BOARD CONTAINER */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-emerald-50/50 to-orange-50/50">
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none" />
        
        <div className="w-full h-full max-w-[1200px] flex items-center justify-center">
          <div className="w-full h-full overflow-auto custom-scrollbar flex items-start justify-center p-2">
            <div className="grid grid-cols-10 gap-2 md:gap-4 w-full h-fit py-12 md:py-20">
              {board.map((sq) => (
                <Square key={sq.id} data={sq} players={players} isCurrentTurn={currentPlayer?.position === sq.id} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOP STATUS BAR HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-4">
        <div className="bg-white/90 backdrop-blur-md border-4 border-emerald-200 py-3 px-6 rounded-[2rem] shadow-2xl text-center flex items-center justify-center gap-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
          <p className="text-lg font-black text-emerald-900 italic tracking-tight truncate">{message}</p>
        </div>
      </div>

      {/* LEFT SIDEBAR HUD - PLAYER TRACKER */}
      <div className={`absolute top-0 left-0 h-full z-40 transition-transform duration-500 ease-in-out p-4 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-[90%]'}`}>
        <div className="bg-white/80 backdrop-blur-lg border-4 border-emerald-200 rounded-[2.5rem] w-[280px] h-full flex flex-col shadow-2xl relative">
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute top-1/2 -right-4 translate-y-[-50%] w-10 h-10 bg-emerald-400 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-500 transition-all border-4 border-white z-50 pointer-events-auto"
          >
            {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
          </button>

          <div className="p-6 pb-2 border-b-4 border-emerald-50 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase italic text-emerald-800 flex items-center gap-2">
              <TreePine size={20} className="text-emerald-500" /> Orchard Path
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {players.map((p, idx) => {
              const isActive = idx === currentPlayerIdx;
              if (isActive && !p.isEliminated) {
                return (
                  <div key={p.id} className="p-4 rounded-[1.5rem] border-4 border-yellow-400 bg-yellow-50 shadow-md scale-[1.02] transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${p.color} border-4 border-white shadow-sm animate-bounce`}>{p.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-black text-emerald-900 text-base flex items-center gap-1 truncate">{p.name} <Star className="text-yellow-500 fill-yellow-500" size={12} /></span>
                        </div>
                        <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-yellow-200">
                          <div className={`h-full transition-all duration-1000 ease-out rounded-full ${p.color}`} style={{ width: `${(p.position / 50) * 100}%` }} />
                        </div>
                        <p className="text-[10px] font-black text-emerald-700 uppercase mt-1">SQ {p.position} • RUNNING!</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={p.id} className={`p-2 px-3 rounded-xl border-2 transition-all duration-300 ${p.isEliminated ? 'opacity-30 grayscale border-stone-100 bg-stone-50' : 'border-emerald-50 bg-white/50 hover:bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${p.color} border-2 border-white shadow-sm`}>{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-emerald-800 text-xs truncate">{p.name}</span>
                        <span className="text-[9px] font-bold text-stone-500">SQ {p.position}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM-RIGHT HUD - CONTROLS */}
      <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-4 items-end">
        
        {/* Bump Action UI */}
        {othersOnSameSquare.length > 0 && !isRolling && !moveInProgress.current && (
          <div className="bg-white/90 backdrop-blur-md border-4 border-rose-200 p-4 rounded-[2rem] shadow-2xl animate-in slide-in-from-right-10 duration-500 flex flex-col items-center">
            <div className="flex items-center gap-2 text-rose-600 font-black mb-3 uppercase text-xs tracking-widest"><Swords size={18} /> Bump!</div>
            <div className="flex flex-col gap-2">
              {othersOnSameSquare.map(target => (
                <button key={target.id} onClick={() => handlePunch(target.id)} className="flex items-center gap-3 bg-rose-500 hover:bg-rose-600 px-6 py-2 rounded-2xl text-white text-xs font-black transition-all transform active:scale-90 border-b-4 border-rose-800 shadow-md">
                  {target.emoji} BUMP {target.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dice & Main Action */}
        <div className="bg-white/90 backdrop-blur-md border-4 border-emerald-200 p-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 w-[200px]">
          <div className={`transition-all duration-700 ${isRolling ? 'rotate-[720deg] scale-125' : ''}`}>
            {lastRoll === 0 ? <Dice6 size={64} className="text-stone-200" /> : (
              <div className="w-20 h-20 bg-white text-stone-900 rounded-[1.5rem] flex items-center justify-center font-black shadow-[0_10px_0_0_#e2e8f0] active:shadow-none active:translate-y-2 text-5xl border-4 border-stone-100">{lastRoll}</div>
            )}
          </div>
          <button
            disabled={isRolling || moveInProgress.current || stage === GameStage.GAMEOVER || currentPlayer?.isEliminated}
            onClick={rollDice}
            className={`w-full py-4 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all shadow-xl transform active:scale-95 border-b-8 ${
              isRolling || moveInProgress.current
                ? 'bg-stone-100 text-stone-300 border-stone-300 cursor-not-allowed' 
                : `${currentPlayer?.color || 'bg-emerald-600'} text-white border-b-emerald-900 hover:brightness-110`
            }`}
          >
            <Dice6 size={28} /> {isRolling ? '...' : 'HOP!'}
          </button>
        </div>
      </div>

      {/* OVERLAYS & MODALS */}
      {stage === GameStage.GAMEOVER && (
        <div className="absolute inset-0 z-[60] bg-emerald-950/90 flex flex-col items-center justify-center p-8 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white border-8 border-yellow-400 p-12 md:p-16 rounded-[4rem] text-center shadow-2xl max-w-2xl relative overflow-hidden mb-8">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-100 rounded-full opacity-50" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-100 rounded-full opacity-50" />
            {winner ? (
              <>
                <Trophy className="mx-auto w-24 h-24 text-yellow-500 mb-6 animate-bounce" />
                <h2 className="text-6xl md:text-8xl font-black italic text-emerald-900 mb-4 tracking-tighter drop-shadow-sm">VICTORY!</h2>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className={`w-20 h-20 rounded-full ${winner.color} border-4 border-white flex items-center justify-center text-5xl shadow-xl`}>{winner.emoji}</div>
                  <p className="text-3xl md:text-4xl text-orange-600 font-black uppercase">{winner.name} ESCAPED!</p>
                </div>
              </>
            ) : (
              <>
                <Skull className="mx-auto w-24 h-24 text-stone-500 mb-6" />
                <h2 className="text-6xl md:text-8xl font-black italic text-stone-800 mb-4 tracking-tighter drop-shadow-sm">LOST</h2>
                <p className="text-3xl text-rose-600 mb-4 font-black uppercase">ALL FRUITS SQUASHED!</p>
              </>
            )}
          </div>
          <button onClick={backToMenu} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-6 rounded-[2.5rem] text-3xl flex items-center justify-center gap-4 transform hover:scale-105 transition-all border-b-8 border-emerald-800 shadow-2xl uppercase">
            <RotateCcw size={32} /> Main Menu
          </button>
        </div>
      )}

      {activeTrap && (
        <RiddleModal 
          type={activeTrap.type} 
          riddle={activeTrap.riddle} 
          preloadedAudio={activeTrap.audioBuffer}
          onSolve={handleRiddleSolve} 
        />
      )}

      <div className="fixed bottom-6 left-6 z-40 hidden md:flex flex-row gap-4 opacity-70 hover:opacity-100 transition-opacity">
        <div className="bg-white/80 p-3 rounded-2xl flex items-center gap-2 border-2 border-amber-200">
           <Zap className="text-amber-500" size={16} /> <span className="text-[10px] font-black uppercase">Snack</span>
        </div>
        <div className="bg-white/80 p-3 rounded-2xl flex items-center gap-2 border-2 border-sky-200">
           <Plane className="text-sky-500" size={16} /> <span className="text-[10px] font-black uppercase">Port</span>
        </div>
        <div className="bg-white/80 p-3 rounded-2xl flex items-center gap-2 border-2 border-rose-200">
           <AlertTriangle className="text-rose-500" size={16} /> <span className="text-[10px] font-black uppercase">Trap</span>
        </div>
      </div>

    </div>
  );
};

export default App;