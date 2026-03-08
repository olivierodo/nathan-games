import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Player, TileType, BoardNode, TriviaData } from './types';
import { TOTAL_STEPS, generateBoard, createPlayers, BOARD_HEIGHT } from './constants';
import { fetchSpaceTriviaBatch } from './services/geminiService';
import { AlienIcon, MudIcon, ShoeIcon, TriviaIcon } from './components/Icons';
import { Dice } from './components/Dice';
import { playSound } from './utils/sound';
import { Rocket, UserPlus, ShieldAlert, Dice5, Users, Timer, ZoomIn, ZoomOut, Zap, User, RotateCcw, Trophy, Skull } from 'lucide-react';

// Pre-generate board
const BOARD_NODES = generateBoard();
// Count Nice Alien tiles for initial fetch
const NICE_ALIEN_COUNT = BOARD_NODES.filter(n => n.type === TileType.NICE_ALIEN).length;

const App: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showShoeOption, setShowShoeOption] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    players: createPlayers(2), // Default 2 runners
    badAlienPosition: 0,
    badAlienStunned: 0,
    alienHeadStart: 2, 
    isAlienTurn: false,
    gameMode: 'COOP',
    currentPlayerIndex: 0,
    turnCount: 0,
    gameStatus: 'LOBBY',
    diceRoll: null,
    messageLog: [], 
    triviaQuestion: null,
    triviaBank: [],
    pendingMovement: null,
    selectedBoostTarget: null,
    selectedPlayerCount: 2, // Default total players
  });

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Update players list in Lobby when Mode or Count changes
  useEffect(() => {
    if (gameState.gameStatus === 'LOBBY') {
        let runnerCount = gameState.selectedPlayerCount;
        if (gameState.gameMode === 'VERSUS') {
            // In Versus, one player is the Alien, so runners = total - 1
            runnerCount = Math.max(1, gameState.selectedPlayerCount - 1);
        }
        
        // Only update if count mismatch to avoid loops (though createPlayers returns new ref always)
        if (gameState.players.length !== runnerCount) {
             setGameState(prev => ({
                 ...prev,
                 players: createPlayers(runnerCount)
             }));
        }
    }
  }, [gameState.selectedPlayerCount, gameState.gameMode, gameState.gameStatus]);

  // Auto-scroll logic
  useEffect(() => {
    if (gameState.gameStatus === 'PLAYING' && scrollContainerRef.current) {
        let targetPos = currentPlayer ? currentPlayer.position : 0;
        if (gameState.isAlienTurn) {
            targetPos = gameState.badAlienPosition;
        }

        const activeNodeIndex = Math.max(0, Math.min(TOTAL_STEPS, targetPos));
        const activeNode = BOARD_NODES[activeNodeIndex];
        
        if (activeNode) {
             scrollContainerRef.current.scrollTo({
                top: (activeNode.y * zoom) - window.innerHeight / 2,
                behavior: 'smooth'
             });
        }
    }
  }, [gameState.currentPlayerIndex, gameState.gameStatus, currentPlayer?.position, gameState.badAlienPosition, gameState.isAlienTurn, zoom]);


  // Automated Alien Turn Logic (Only for COOP mode)
  useEffect(() => {
    if (gameState.gameStatus === 'PLAYING' && gameState.isAlienTurn && gameState.gameMode === 'COOP') {
        const performAlienAction = async () => {
            await new Promise(r => setTimeout(r, 1200));

            const { turnCount, alienHeadStart, badAlienStunned } = gameState;

            if (turnCount < alienHeadStart) {
                await new Promise(r => setTimeout(r, 1000));
                endAlienTurn(false);
                return;
            }

            if (badAlienStunned > 0) {
                await new Promise(r => setTimeout(r, 1500));
                endAlienTurn(true, badAlienStunned - 1);
                return;
            }

            const roll = Math.floor(Math.random() * 6) + 1;
            executeAlienTurn(roll);
        };

        performAlienAction();
    }
  }, [gameState.isAlienTurn, gameState.gameMode]);

  const executeAlienTurn = async (roll: number) => {
      setGameState(prev => ({ ...prev, diceRoll: roll }));
      playSound('dice');
      
      await new Promise(r => setTimeout(r, 1500));

      const currentPos = gameState.badAlienPosition;
      const newPos = currentPos + roll;
      setGameState(prev => ({ ...prev, badAlienPosition: newPos }));
      playSound('alien');

      const caught = gameState.players.some(p => !p.finished && p.position <= newPos);
      if (caught) {
          playSound('lose');
          setGameState(prev => ({ ...prev, gameStatus: 'LOST' }));
          return;
      }

      await new Promise(r => setTimeout(r, 1000));
      endAlienTurn(false);
  };


  const endAlienTurn = (wasStunned: boolean, newStunVal: number = 0) => {
      const nextPlayers = [...gameState.players];
      
      if (nextPlayers[0].skipNextTurn) {
          nextPlayers[0].skipNextTurn = false;
          
          setGameState(prev => ({
              ...prev,
              isAlienTurn: false,
              diceRoll: null,
              badAlienStunned: wasStunned ? newStunVal : prev.badAlienStunned,
              turnCount: prev.turnCount + 1,
              players: nextPlayers,
              currentPlayerIndex: 0 
          }));

          setTimeout(() => {
             const nextIdx = 1 % nextPlayers.length;
             if (nextIdx === 0) {
                 setGameState(prev => ({ ...prev, isAlienTurn: true }));
             } else {
                 setGameState(prev => ({ ...prev, currentPlayerIndex: nextIdx }));
             }
          }, 2000);

      } else {
          setGameState(prev => ({
              ...prev,
              isAlienTurn: false,
              diceRoll: null,
              badAlienStunned: wasStunned ? newStunVal : prev.badAlienStunned,
              turnCount: prev.turnCount + 1,
              currentPlayerIndex: 0
          }));
      }
  };

  const addLog = (msg: string) => {
    setGameState(prev => ({
      ...prev,
      messageLog: [msg, ...prev.messageLog].slice(0, 5)
    }));
  };

  const checkWinLoss = (players: Player[], alienPos: number, currentTurnCount: number, headStart: number): 'WON' | 'LOST' | 'PLAYING' => {
    if (currentTurnCount < headStart) return 'PLAYING';

    const caught = players.some(p => !p.finished && p.position <= alienPos);
    if (caught) return 'LOST';

    const allFinished = players.every(p => p.finished);
    if (allFinished) return 'WON';

    return 'PLAYING';
  };

  const handleNextTurn = useCallback((currentPlayers: Player[]) => {
    const nextIndex = (gameState.currentPlayerIndex + 1) % currentPlayers.length;
    
    if (nextIndex === 0) {
        setGameState(prev => ({
            ...prev,
            players: currentPlayers,
            isAlienTurn: true,
            diceRoll: null,
            selectedBoostTarget: null
        }));
        return;
    }
    
    if (currentPlayers[nextIndex].skipNextTurn) {
        const p = [...currentPlayers];
        p[nextIndex].skipNextTurn = false;
        
        setGameState(prev => ({
            ...prev,
            players: p,
            currentPlayerIndex: nextIndex,
            diceRoll: null
        }));
        
        setTimeout(() => {
            const nextNextIndex = (nextIndex + 1) % p.length;
            if (nextNextIndex === 0) {
                setGameState(prev => ({ ...prev, isAlienTurn: true }));
            } else {
                setGameState(prev => ({ ...prev, currentPlayerIndex: nextNextIndex }));
            }
        }, 1500);
        return; 
    }

    setGameState(prev => ({
      ...prev,
      players: currentPlayers,
      currentPlayerIndex: nextIndex,
      diceRoll: null,
      selectedBoostTarget: null
    }));
  }, [gameState.currentPlayerIndex]);

  const handleRollDice = () => {
    if (gameState.gameStatus !== 'PLAYING') return;
    
    if (gameState.isAlienTurn) {
        if (gameState.gameMode === 'VERSUS') {
            // Case 1: Waiting (Head Start)
            if (gameState.turnCount < gameState.alienHeadStart) {
                 playSound('move');
                 endAlienTurn(false);
                 return;
            }
            
            // Case 2: Stunned
            if (gameState.badAlienStunned > 0) {
                 playSound('move'); // Sound indicating pass
                 endAlienTurn(true, gameState.badAlienStunned - 1);
                 return;
            }

            const roll = Math.floor(Math.random() * 6) + 1;
            executeAlienTurn(roll);
        }
        return;
    }
    
    if (currentPlayer.isStuck > 0) {
      const updatedPlayer = { ...currentPlayer, isStuck: currentPlayer.isStuck - 1 };
      const newPlayers = [...gameState.players];
      newPlayers[gameState.currentPlayerIndex] = updatedPlayer;
      
      setGameState(prev => ({ ...prev, players: newPlayers }));
      // Small delay to show update before turn passes
      setTimeout(() => handleNextTurn(newPlayers), 500);
      return;
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    setGameState(prev => ({ ...prev, diceRoll: roll }));
    playSound('dice');

    if (currentPlayer.finished) {
      handleFinishedPlayerRoll(roll);
    } else {
      // Logic change: Check hasShoes instead of shoeJumpUsed
      if (currentPlayer.hasShoes) {
        setShowShoeOption(true);
      } else {
        setTimeout(() => handleNormalMovement(roll), 1000);
      }
    }
  };

  const handleShoeDecision = (useJump: boolean) => {
    setShowShoeOption(false);
    if (gameState.diceRoll === null) return;

    if (useJump) {
      playSound('jump');
      // If jump is used, we consume the shoes (second param true)
      handleNormalMovement(gameState.diceRoll + 5, true);
    } else {
      // If not used, we keep the shoes
      handleNormalMovement(gameState.diceRoll, false);
    }
  };

  const handleNormalMovement = (steps: number, consumeShoe: boolean = false) => {
    const updatedPlayers = [...gameState.players];
    const player = updatedPlayers[gameState.currentPlayerIndex];
    
    // Shoes are now consumed if the player used the Jump ability
    if (consumeShoe) {
      player.hasShoes = false;
      player.shoeJumpUsed = false; // Reset just in case, though unused if hasShoes is false
    }

    const newPos = Math.min(TOTAL_STEPS, player.position + steps);
    const targetNode = BOARD_NODES.find(n => n.id === newPos);
    
    player.position = newPos;
    playSound('move');
    
    if (newPos === TOTAL_STEPS) {
      player.finished = true;
      playSound('win');
      
      // If finishing with shoes, transfer to last player
      if (player.hasShoes) {
        player.hasShoes = false;
        player.shoeJumpUsed = false; 
        const activePlayers = updatedPlayers.filter(p => !p.finished && p.id !== player.id);
        if (activePlayers.length > 0) {
            const worstPlayer = activePlayers.reduce((prev, curr) => (prev.position < curr.position ? prev : curr));
            const worstIndex = updatedPlayers.findIndex(p => p.id === worstPlayer.id);
            updatedPlayers[worstIndex].hasShoes = true;
            updatedPlayers[worstIndex].shoeJumpUsed = false;
        }
      }
      
      const winCheck = checkWinLoss(updatedPlayers, gameState.badAlienPosition, gameState.turnCount, gameState.alienHeadStart);
      setGameState(prev => ({ ...prev, players: updatedPlayers, gameStatus: winCheck === 'PLAYING' ? 'PLAYING' : winCheck }));
      if (winCheck === 'PLAYING') setTimeout(() => handleNextTurn(updatedPlayers), 1500);
      return;
    }

    // Check MUD (Stuck if no shoes)
    if (targetNode?.type === TileType.MUD && !player.hasShoes) {
      player.isStuck = 2;
      setGameState(prev => ({ ...prev, players: updatedPlayers }));
      setTimeout(() => handleNextTurn(updatedPlayers), 2000);
    } 
    else if (targetNode?.type === TileType.NICE_ALIEN) {
      // Fetch from Bank
      let question: TriviaData;
      let newBank = [...gameState.triviaBank];
      
      if (newBank.length > 0) {
          question = newBank[0];
          newBank = newBank.slice(1);
      } else {
          // Fallback if bank is empty
          question = {
              question: "Which planet is the closest to the Sun?",
              options: ["Mercury", "Venus", "Earth", "Mars"],
              correctAnswer: "Mercury"
          };
      }

      setGameState(prev => ({ 
          ...prev, 
          players: updatedPlayers, 
          gameStatus: 'TRIVIA',
          triviaQuestion: question,
          triviaBank: newBank
      }));
    } 
    else if (targetNode?.type === TileType.SHOES) {
      player.hasShoes = true;
      player.shoeJumpUsed = false;
      setGameState(prev => ({ ...prev, players: updatedPlayers }));
      setTimeout(() => handleNextTurn(updatedPlayers), 1500);
    } 
    else {
      setGameState(prev => ({ ...prev, players: updatedPlayers }));
      setTimeout(() => handleNextTurn(updatedPlayers), 1000);
    }
  };

  const handleFinishedPlayerRoll = (roll: number) => {
    if (roll === 4) {
      // Waiting
    } 
    else if (roll === 6) {
      setGameState(prev => ({ ...prev, badAlienStunned: 1 }));
      setTimeout(() => handleNextTurn(gameState.players), 1500);
    } 
    else {
      setTimeout(() => handleNextTurn(gameState.players), 1000);
    }
  };

  const handleBoostFriend = (targetPlayerId: number) => {
    const boostAmount = 5; 
    
    const updatedPlayers = [...gameState.players];
    updatedPlayers[targetPlayerId].position = Math.min(TOTAL_STEPS, updatedPlayers[targetPlayerId].position + boostAmount);
    
    if (updatedPlayers[targetPlayerId].position === TOTAL_STEPS) {
        updatedPlayers[targetPlayerId].finished = true;
    }
    
    playSound('jump');
    setGameState(prev => ({ ...prev, players: updatedPlayers, selectedBoostTarget: null }));
    handleNextTurn(updatedPlayers);
  };

  const handleRescue = (targetPlayerId: number) => {
    if (gameState.diceRoll !== null) return;
    
    const updatedPlayers = [...gameState.players];
    updatedPlayers[targetPlayerId].isStuck = 0;
    updatedPlayers[gameState.currentPlayerIndex].skipNextTurn = true;
    
    setGameState(prev => ({ ...prev, players: updatedPlayers }));
    setTimeout(() => handleNextTurn(updatedPlayers), 1500);
  };

  const handleTriviaAnswer = (answer: string) => {
    if (!gameState.triviaQuestion) return;

    const isCorrect = answer === gameState.triviaQuestion.correctAnswer;
    const updatedPlayers = [...gameState.players];

    if (isCorrect) {
       playSound('win');
    } else {
       playSound('lose');
       updatedPlayers[gameState.currentPlayerIndex].position = Math.max(0, updatedPlayers[gameState.currentPlayerIndex].position - 5);
    }

    setGameState(prev => ({ 
      ...prev, 
      gameStatus: 'PLAYING', 
      players: updatedPlayers, 
      triviaQuestion: null 
    }));
    
    setTimeout(() => handleNextTurn(updatedPlayers), 1500);
  };

  const selectPlayerCount = (count: number) => {
    // This updates the selection state. The useEffect will handle the players array update.
    setGameState(prev => ({
        ...prev,
        selectedPlayerCount: count
    }));
  };

  const adjustAlienHeadStart = (delta: number) => {
    setGameState(prev => ({
      ...prev,
      alienHeadStart: Math.max(0, Math.min(10, prev.alienHeadStart + delta))
    }));
  };

  const startGame = () => {
    // Finalize players based on current selection
    let runnerCount = gameState.selectedPlayerCount;
    if (gameState.gameMode === 'VERSUS') {
        runnerCount = Math.max(1, gameState.selectedPlayerCount - 1);
    }

    setGameState(prev => ({
      ...prev,
      players: createPlayers(runnerCount),
      badAlienPosition: 0,
      badAlienStunned: 0,
      currentPlayerIndex: 0,
      turnCount: 0,
      isAlienTurn: false,
      gameStatus: 'PLAYING',
      diceRoll: null,
      messageLog: [],
      triviaQuestion: null
    }));
    
    // Fetch Trivia Batch
    fetchSpaceTriviaBatch(NICE_ALIEN_COUNT).then(questions => {
        setGameState(prev => ({ ...prev, triviaBank: questions }));
    });

    playSound('move'); 
  };
  
  const resetToLobby = () => {
    setGameState(prev => ({
      ...prev,
      players: createPlayers(prev.selectedPlayerCount), // Reset, useEffect will correct size if needed
      badAlienPosition: 0,
      badAlienStunned: 0,
      currentPlayerIndex: 0,
      turnCount: 0,
      isAlienTurn: false,
      gameStatus: 'LOBBY',
      diceRoll: null,
      messageLog: [],
      triviaQuestion: null,
      triviaBank: []
    }));
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(0.3, Math.min(1.5, prev + delta)));
  };

  // Render Logic
  return (
    <div className="relative w-full h-screen bg-space-900 overflow-hidden flex flex-col md:flex-row">
      
      {/* LEFT PANEL: Game Status & Controls */}
      <div className="w-full md:w-80 bg-space-800 border-r border-space-700 flex flex-col z-20 shadow-2xl">
        <div className="p-4 border-b border-space-700">
          <h1 className="text-3xl font-display text-neon-blue font-bold tracking-wider mb-2">ALIEN INVASION</h1>
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Round: {gameState.turnCount + 1}</span>
            <span>Mode: {gameState.gameMode === 'COOP' ? 'Co-op' : 'Versus'}</span>
          </div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {gameState.gameStatus === 'LOBBY' && (
            <div className="space-y-4 mb-6">
                <div className="p-4 bg-space-900/50 rounded-lg border border-space-600">
                  <h3 className="text-neon-pink font-bold mb-3 flex items-center gap-2">
                    <Users size={18} /> SELECT TOTAL PLAYERS
                  </h3>
                  <div className="flex gap-2 mb-2">
                    {[2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => selectPlayerCount(num)}
                        className={`flex-1 py-2 rounded font-bold transition-all ${gameState.selectedPlayerCount === num ? 'bg-neon-blue text-black' : 'bg-space-700 text-gray-400 hover:bg-space-600'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                      {gameState.gameMode === 'VERSUS' 
                        ? `${gameState.selectedPlayerCount - 1} Astronauts vs 1 Player Alien`
                        : `${gameState.selectedPlayerCount} Astronauts vs AI Alien`
                      }
                  </p>
                </div>

                <div className="p-4 bg-space-900/50 rounded-lg border border-space-600">
                  <h3 className="text-green-500 font-bold mb-3 flex items-center gap-2">
                    <User size={18} /> WHO PLAYS THE ALIEN?
                  </h3>
                  <div className="flex gap-2">
                      <button 
                         onClick={() => setGameState(prev => ({ ...prev, gameMode: 'COOP' }))}
                         className={`flex-1 py-2 rounded font-bold border transition-all ${gameState.gameMode === 'COOP' ? 'bg-green-500 text-black border-green-500' : 'bg-transparent text-gray-400 border-gray-600'}`}
                      >
                          Computer (AI)
                      </button>
                      <button 
                         onClick={() => setGameState(prev => ({ ...prev, gameMode: 'VERSUS' }))}
                         className={`flex-1 py-2 rounded font-bold border transition-all ${gameState.gameMode === 'VERSUS' ? 'bg-red-500 text-black border-red-500' : 'bg-transparent text-gray-400 border-gray-600'}`}
                      >
                          Player (Versus)
                      </button>
                  </div>
                </div>
                
                <div className="p-4 bg-space-900/50 rounded-lg border border-space-600">
                  <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2">
                    <Timer size={18} /> ALIEN DELAY (ROUNDS)
                  </h3>
                  <div className="flex items-center justify-between bg-space-800 rounded p-2">
                    <button onClick={() => adjustAlienHeadStart(-1)} className="w-8 h-8 flex items-center justify-center bg-space-700 hover:bg-space-600 rounded text-white font-bold">-</button>
                    <span className="text-xl font-display text-white">{gameState.alienHeadStart}</span>
                    <button onClick={() => adjustAlienHeadStart(1)} className="w-8 h-8 flex items-center justify-center bg-space-700 hover:bg-space-600 rounded text-white font-bold">+</button>
                  </div>
                </div>
            </div>
          )}

          {/* Alien Status Card */}
          {gameState.gameStatus !== 'LOBBY' && (
             <div className={`p-3 rounded-lg border transition-all duration-300 mb-2 shadow-[0_0_10px_rgba(239,68,68,0.1)] 
                 ${gameState.isAlienTurn ? 'border-red-500 bg-red-900/40 ring-2 ring-red-500 scale-105' : 'border-red-900/50 bg-red-950/20'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlienIcon className="w-5 h-5" />
                        <span className={`font-bold ${gameState.isAlienTurn ? 'text-white' : 'text-red-500'}`}>Bad Alien</span>
                        {gameState.gameMode === 'VERSUS' && <span className="text-[10px] bg-red-500 text-black px-1 rounded font-bold">PLAYER</span>}
                    </div>
                    <span className="text-xs font-mono font-bold text-red-400">
                        {gameState.turnCount >= gameState.alienHeadStart 
                            ? `Step ${gameState.badAlienPosition}` 
                            : `Waiting (${gameState.alienHeadStart - gameState.turnCount})`
                        }
                    </span>
                </div>
                {gameState.turnCount >= gameState.alienHeadStart && (
                   <div className="w-full bg-space-900 h-1.5 rounded-full mt-2 overflow-hidden">
                       <div 
                         className="h-full bg-red-600 transition-all duration-500"
                         style={{ width: `${(gameState.badAlienPosition / TOTAL_STEPS) * 100}%` }}
                       />
                   </div>
                )}
             </div>
          )}

          {/* Players */}
          {gameState.players.map((p, idx) => (
            <div key={p.id} className={`p-3 rounded-lg border ${p.finished ? 'border-neon-green bg-green-900/20' : 'border-space-700 bg-space-900/50'} ${gameState.currentPlayerIndex === idx && !gameState.isAlienTurn && gameState.gameStatus !== 'LOBBY' ? 'ring-2 ring-neon-blue' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${p.color}`}>
                     <span className="text-sm">🧑‍🚀</span>
                  </div>
                  <span className={`font-bold ${gameState.currentPlayerIndex === idx && !gameState.isAlienTurn && gameState.gameStatus !== 'LOBBY' ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                  {p.hasShoes && <ShoeIcon className={`w-4 h-4 ${p.shoeJumpUsed ? 'opacity-40 grayscale' : ''}`} />}
                  {p.isStuck > 0 && <MudIcon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-mono text-neon-blue">Step {p.position}</span>
              </div>
              
              {/* Context Actions */}
              {gameState.gameStatus === 'PLAYING' && 
               gameState.currentPlayerIndex !== idx && 
               !gameState.isAlienTurn &&
               !p.finished &&
               !currentPlayer.finished &&
               gameState.diceRoll === null &&
               p.isStuck > 0 && (
                <button 
                  onClick={() => handleRescue(p.id)}
                  className="w-full mt-1 text-xs bg-amber-600 hover:bg-amber-500 text-white py-1 rounded flex items-center justify-center gap-1 transition-colors"
                >
                  <UserPlus size={12} /> Rescue (Skip Turn)
                </button>
              )}

              {/* Boost Button */}
              {gameState.diceRoll === 4 && currentPlayer.finished && !p.finished && (
                  <button 
                    onClick={() => handleBoostFriend(p.id)}
                    className="w-full mt-1 text-xs bg-neon-green hover:bg-green-400 text-black font-bold py-1 rounded flex items-center justify-center gap-1"
                  >
                    <Rocket size={12} /> Boost (+5)
                  </button>
              )}
            </div>
          ))}
        </div>

        {/* Active Turn Controls */}
        <div className="p-4 bg-space-700 border-t border-space-600">
          {gameState.gameStatus === 'LOBBY' && (
            <button onClick={startGame} className="w-full bg-neon-blue text-space-900 font-bold py-3 rounded shadow-lg hover:bg-white transition-all">
              START MISSION
            </button>
          )}

          {gameState.gameStatus === 'PLAYING' && (
            <div className="text-center">
               <div className={`mb-2 font-display text-lg ${gameState.isAlienTurn ? 'text-red-500 animate-pulse' : 'text-neon-blue'}`}>
                  {gameState.isAlienTurn 
                      ? (gameState.diceRoll ? `Alien rolled ${gameState.diceRoll}!` : (gameState.gameMode === 'VERSUS' ? "Alien Player's Turn" : "Alien is thinking..."))
                      : (gameState.diceRoll === null ? `It's ${currentPlayer?.name || ''}'s turn` : `${currentPlayer?.name || ''} rolled ${gameState.diceRoll}`)
                  }
               </div>

               {/* Dice Visual */}
               {gameState.diceRoll !== null && (
                   <div className="flex justify-center mb-4">
                       <Dice 
                         value={gameState.diceRoll} 
                         color={gameState.isAlienTurn ? 'bg-red-500 border-red-700' : 'bg-white'} 
                         dotColor={gameState.isAlienTurn ? 'bg-black' : 'bg-black'}
                       />
                   </div>
               )}
               
               {/* Controls */}
               {gameState.diceRoll === null && (
                   <>
                       {/* Regular Player Turn */}
                       {!gameState.isAlienTurn && (
                         <button 
                           onClick={handleRollDice} 
                           disabled={false}
                           className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 
                               ${currentPlayer?.isStuck > 0 
                                   ? 'bg-amber-700 hover:bg-amber-600 text-white' 
                                   : 'bg-gradient-to-r from-neon-pink to-purple-600 hover:brightness-110'
                               }`}
                         >
                            {currentPlayer?.isStuck > 0 ? (
                                <>
                                    <MudIcon className="w-6 h-6" />
                                    STUCK! SKIP TURN ({currentPlayer.isStuck})
                                </>
                            ) : (
                                <>
                                    <Dice5 size={24} /> ROLL DICE
                                </>
                            )}
                         </button>
                       )}

                       {/* Alien Player Turn (Versus) */}
                       {gameState.isAlienTurn && gameState.gameMode === 'VERSUS' && (
                            <button 
                                onClick={handleRollDice} 
                                // Enabled so player can click to pass/skip
                                className={`w-full flex items-center justify-center gap-2 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-white
                                    ${(gameState.turnCount < gameState.alienHeadStart || gameState.badAlienStunned > 0) 
                                        ? 'bg-gray-600 hover:bg-gray-500' 
                                        : 'bg-red-600 hover:bg-red-500'}`
                                }
                            >
                                <AlienIcon className="w-6 h-6 text-white drop-shadow-none" />
                                {gameState.turnCount < gameState.alienHeadStart 
                                    ? `WAITING (${gameState.alienHeadStart - gameState.turnCount}) - PASS TURN` 
                                    : (gameState.badAlienStunned > 0 ? `STUNNED (${gameState.badAlienStunned}) - SKIP TURN` : "ALIEN ROLL")
                                }
                            </button>
                       )}
                   </>
               )}

               {/* Super Shoe Option UI */}
               {showShoeOption && !gameState.isAlienTurn && (
                   <div className="mt-2 animate-in zoom-in duration-200">
                       <p className="text-yellow-400 text-sm font-bold mb-2 flex items-center justify-center gap-1">
                           <Zap size={14} /> Super Shoes Active!
                       </p>
                       <div className="flex gap-2">
                           <button 
                               onClick={() => handleShoeDecision(true)}
                               className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded text-sm"
                           >
                               Jump +5 (Consumes Shoes)
                           </button>
                           <button 
                               onClick={() => handleShoeDecision(false)}
                               className="flex-1 bg-space-600 hover:bg-space-500 text-white font-bold py-2 rounded text-sm"
                           >
                               Move {gameState.diceRoll} (Keep Shoes)
                           </button>
                       </div>
                   </div>
               )}
            </div>
          )}
          
          {(gameState.gameStatus === 'WON' || gameState.gameStatus === 'LOST') && (
              <div className="text-center">
                  <h2 className={`text-2xl font-bold mb-4 ${gameState.gameStatus === 'WON' ? 'text-neon-green' : 'text-red-500'}`}>
                      {gameState.gameStatus === 'WON' ? 'TEAM VICTORY!' : 'GAME OVER!'}
                  </h2>
                  <button onClick={() => setGameState(prev => ({ ...prev, gameStatus: 'LOBBY' }))} className="bg-white text-space-900 px-6 py-2 rounded font-bold">Main Menu</button>
              </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Game Board */}
      <div className="flex-1 relative h-full overflow-hidden bg-space-900">
        
        {/* Zoom Controls */}
        <div className="absolute top-4 left-4 z-30 flex gap-2">
            <button 
                onClick={() => adjustZoom(0.1)} 
                className="bg-space-800/80 hover:bg-space-700 text-white p-2 rounded-full border border-space-600 backdrop-blur-sm transition-colors"
                title="Zoom In"
            >
                <ZoomIn size={20} />
            </button>
            <button 
                onClick={() => adjustZoom(-0.1)} 
                className="bg-space-800/80 hover:bg-space-700 text-white p-2 rounded-full border border-space-600 backdrop-blur-sm transition-colors"
                title="Zoom Out"
            >
                <ZoomOut size={20} />
            </button>
            <div className="bg-space-800/80 text-xs text-gray-400 px-2 py-1 rounded border border-space-600 flex items-center backdrop-blur-sm">
                {Math.round(zoom * 100)}%
            </div>
        </div>

        {/* Alien Warning Overlay */}
        {gameState.gameStatus === 'PLAYING' && gameState.turnCount < gameState.alienHeadStart && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                 <div className="bg-red-900/40 border border-red-500 text-red-200 px-4 py-2 rounded-lg backdrop-blur-sm text-sm font-bold flex items-center gap-2 shadow-lg">
                     <ShieldAlert size={16} /> Alien arrives in {gameState.alienHeadStart - gameState.turnCount} rounds
                 </div>
             </div>
        )}

        {/* Scrollable Board Area */}
        <div ref={scrollContainerRef} className="w-full h-full overflow-y-auto overflow-x-hidden relative custom-scrollbar bg-space-900">
            {/* Height scales with zoom to maintain scrollable area properly */}
            <div className="relative w-full transition-all duration-300 origin-top-center" 
                 style={{ 
                     height: `${BOARD_HEIGHT * zoom}px` 
                 }}>
                
                {/* Scaled Content Container */}
                <div 
                    className="absolute top-0 left-0 w-full origin-top transition-transform duration-300 ease-out"
                    style={{ 
                        height: `${BOARD_HEIGHT}px`,
                        transform: `scale(${zoom})` 
                    }}
                >
                    {/* SVG Path Line */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                        <defs>
                            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#00f3ff" />
                                <stop offset="50%" stopColor="#ff00ff" />
                                <stop offset="100%" stopColor="#00f3ff" />
                            </linearGradient>
                        </defs>
                        <path 
                            d={`M ${BOARD_NODES.map(n => `${n.x},${n.y}`).join(' L ')}`}
                            fill="none"
                            stroke="url(#pathGradient)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-40"
                        />
                    </svg>

                    {/* Nodes */}
                    {BOARD_NODES.map((node) => (
                        <div 
                            key={node.id}
                            className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300
                                ${node.type === TileType.MUD ? 'bg-amber-900/80 border-amber-600' : 
                                  node.type === TileType.NICE_ALIEN ? 'bg-purple-900/80 border-purple-500 shadow-[0_0_10px_#a855f7]' :
                                  node.type === TileType.SHOES ? 'bg-yellow-900/80 border-yellow-400 shadow-[0_0_10px_#facc15]' :
                                  node.type === TileType.START ? 'bg-green-500 border-green-300' :
                                  node.type === TileType.FINISH ? 'bg-white border-neon-blue shadow-[0_0_20px_white]' :
                                  'bg-space-800 border-space-600 text-gray-500'
                                }
                            `}
                            style={{ left: node.x, top: node.y, zIndex: 1 }}
                        >
                            {node.type === TileType.MUD && <MudIcon className="w-6 h-6" />}
                            {node.type === TileType.NICE_ALIEN && <TriviaIcon className="w-6 h-6" />}
                            {node.type === TileType.SHOES && <ShoeIcon className="w-6 h-6" />}
                            {node.type === TileType.START && "START"}
                            {node.type === TileType.FINISH && "END"}
                            {node.type === TileType.NORMAL && node.id}
                        </div>
                    ))}

                    {/* Bad Alien Token */}
                    {(() => {
                        const alienNodeIndex = Math.min(TOTAL_STEPS, gameState.badAlienPosition);
                        const alienNode = BOARD_NODES[alienNodeIndex];
                        if(!alienNode || gameState.turnCount < gameState.alienHeadStart) return null;
                        
                        return (
                            <div 
                                className={`absolute w-16 h-16 -ml-8 -mt-8 z-10 transition-all duration-1000 ease-in-out ${gameState.isAlienTurn ? 'scale-125 z-40 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : ''}`}
                                style={{ left: alienNode.x, top: alienNode.y }}
                            >
                                <div className="relative w-full h-full animate-float">
                                    <AlienIcon className="w-full h-full" />
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 bg-red-500 blur-md opacity-50"></div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Player Tokens */}
                    {gameState.players.map((p, i) => {
                        const node = BOARD_NODES[p.position];
                        if (!node) return null;
                        
                        // Offset slightly if multiple players on same tile
                        const offsetX = (i % 2 === 0 ? -10 : 10) * (gameState.players.filter(pl => pl.position === p.position && pl.id !== p.id).length > 0 ? 1 : 0);
                        const offsetY = (i > 1 ? -10 : 10) * (gameState.players.filter(pl => pl.position === p.position && pl.id !== p.id).length > 0 ? 1 : 0);

                        return (
                            <div 
                                key={p.id}
                                className={`absolute w-10 h-10 -ml-5 -mt-5 z-20 transition-all duration-500 ease-out flex items-center justify-center rounded-full shadow-lg border-2 border-white
                                    ${p.color} ${gameState.currentPlayerIndex === i && !gameState.isAlienTurn && gameState.gameStatus === 'PLAYING' ? 'scale-125 ring-4 ring-white/50 z-30' : ''}
                                `}
                                style={{ left: node.x + offsetX, top: node.y + offsetY }}
                            >
                                <span className="text-xl leading-none pt-0.5">🧑‍🚀</span>
                                {p.hasShoes && <ShoeIcon className="absolute -top-3 -right-3 w-5 h-5" />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* Trivia Modal */}
      {gameState.gameStatus === 'TRIVIA' && gameState.triviaQuestion && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-space-800 border-2 border-purple-500 p-8 rounded-2xl max-w-lg w-full shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-in zoom-in duration-300">
            <div className="flex justify-center mb-6">
               <TriviaIcon className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-display text-center mb-6 text-white">{gameState.triviaQuestion.question}</h2>
            <div className="grid grid-cols-1 gap-3">
              {gameState.triviaQuestion.options.map((opt, i) => (
                <button 
                  key={i}
                  onClick={() => handleTriviaAnswer(opt)}
                  className="bg-space-700 hover:bg-purple-600 text-left p-4 rounded-xl border border-space-600 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Win/Loss Screen */}
      {(gameState.gameStatus === 'WON' || gameState.gameStatus === 'LOST') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
           <div className={`flex flex-col items-center p-12 rounded-3xl border-4 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-2xl w-full text-center
                ${gameState.gameStatus === 'WON' ? 'border-neon-green bg-gradient-to-b from-green-900/50 to-black' : 'border-red-600 bg-gradient-to-b from-red-900/50 to-black'}`}>
               
               {gameState.gameStatus === 'WON' ? (
                   <div className="animate-bounce mb-6">
                       <Trophy size={80} className="text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
                   </div>
               ) : (
                   <div className="animate-pulse mb-6">
                       <Skull size={80} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                   </div>
               )}

               <h1 className={`text-6xl font-display font-black mb-4 tracking-wider
                   ${gameState.gameStatus === 'WON' ? 'text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-yellow-400' : 'text-red-500'}`}>
                   {gameState.gameStatus === 'WON' ? 'VICTORY!' : 'DEFEAT'}
               </h1>
               
               <p className="text-2xl text-gray-300 mb-10 font-bold max-w-lg">
                   {gameState.gameStatus === 'WON' 
                     ? "Mission Accomplished! All astronauts have safely escaped the alien threat." 
                     : "Mission Failed. The alien caught up to the crew. Better luck next time!"}
               </p>

               <button 
                  onClick={resetToLobby}
                  className="group relative px-8 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 transition-transform duration-200 flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.4)]"
               >
                   <RotateCcw className="group-hover:rotate-180 transition-transform duration-500" />
                   PLAY AGAIN
               </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;