import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GRID_SIZE, TICK_RATE, SPAWN_ZONE, PORTAL_LOCATIONS, 
  getRotatedConnections, DIRECTION_VECTORS 
} from './constants';
import { GameState, TileData, TileType, Portal } from './types';
import { findPath, isPhysicallyTrapped } from './utils/pathfinding';
import Tile from './components/Tile';
import Survivor from './components/Survivor';
import { 
  TurnIndicator, GameOverOverlay, Hand, Controls 
} from './components/GameUI';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_DECK_COUNT = 120;
const TILE_TYPES: TileType[] = ['Straight', 'L', 'T', 'DeadEnd'];

const createInitialGrid = (): TileData[][] => {
  const grid: TileData[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const isSpawn = SPAWN_ZONE.some(p => p.x === x && p.y === y);
      const isPortal = PORTAL_LOCATIONS.some(p => p.x === x && p.y === y);
      row.push({
        isOccupied: isSpawn,
        tileType: isSpawn ? 'Spawn' : (isPortal ? 'Portal' : 'Empty'),
        rotation: 0,
        connectionPoints: []
      });
    }
    grid.push(row);
  }
  return grid;
};

const createInitialPortals = (): Portal[] => {
  return PORTAL_LOCATIONS.map(p => ({
    ...p,
    isActive: false,
    lastToggled: 0
  }));
};

// Sound Manager
const playSound = (type: 'place' | 'rotate' | 'move' | 'portal' | 'roar' | 'win' | 'lose') => {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;
  
  const ctx = new AudioContextClass();
  const now = ctx.currentTime;

  const createNoiseBuffer = () => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  switch (type) {
    case 'place': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    }
    case 'rotate': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
    case 'move': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    }
    case 'portal': {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.5);
      osc2.frequency.setValueAtTime(220, now);
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
      break;
    }
    case 'roar': {
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 1.5);
      break;
    }
    case 'win': {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.2, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.4);
      });
      break;
    }
    case 'lose': {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(100, now);
      o.frequency.linearRampToValueAtTime(40, now + 1.5);
      g.gain.setValueAtTime(0.3, now);
      g.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(now);
      o.stop(now + 1.5);
      break;
    }
  }
};

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const spawnPoint = SPAWN_ZONE[Math.floor(Math.random() * SPAWN_ZONE.length)];
    return {
      grid: createInitialGrid(),
      silasPos: spawnPoint,
      silasRotation: 0,
      deckCount: INITIAL_DECK_COUNT,
      hand: [
        TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
        TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
        TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]
      ],
      portals: createInitialPortals(),
      isRoaring: false,
      isSilasFrozen: false,
      lastRoarTime: 0,
      stuckTicks: 0,
      gameStatus: 'playing',
      turn: 'player',
      aiAction: null,
      cooldowns: {
        rotate: {},
        timeWarp: {}
      }
    };
  });

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [shakeTile, setShakeTile] = useState<{ x: number, y: number } | null>(null);

  // Jungle Ambience
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(50, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    return () => {
      try {
        osc.stop();
        ctx.close();
      } catch (e) {}
    };
  }, []);

  // AI Turn Logic
  useEffect(() => {
    if (state.gameStatus !== 'playing' || state.turn !== 'ai') return;

    const aiTimer = setTimeout(() => {
      setState(prev => {
        const activePortals = prev.portals.filter(p => p.isActive);
        
        // 1. Silas Movement (BEFORE AI action)
        // This ensures Silas gets to use the path the player just built/rotated
        let nextPos = prev.silasPos;
        let nextRotation = prev.silasRotation;
        let nextStatus = prev.gameStatus;
        let nextStuckTicks = prev.stuckTicks;

        if (!prev.isSilasFrozen) {
          const initialPath = findPath(prev.silasPos, activePortals, prev.grid);
          if (initialPath && initialPath.length > 1) {
            playSound('move');
            const nextStep = initialPath[1];
            const dx = nextStep.x - prev.silasPos.x;
            const dy = nextStep.y - prev.silasPos.y;
            if (dx === 1) nextRotation = 90;
            else if (dx === -1) nextRotation = 270;
            else if (dy === 1) nextRotation = 180;
            else if (dy === -1) nextRotation = 0;

            nextPos = nextStep;
            nextStuckTicks = 0;

            if (prev.portals.some(p => p.isActive && p.x === nextPos.x && p.y === nextPos.y)) {
              nextStatus = 'human-win-escape';
            }
          }
        }

        if (nextStatus !== 'playing') {
          if (nextStatus.includes('human-win')) playSound('win');
          if (nextStatus === 'dino-win') playSound('lose');
          return {
            ...prev,
            silasPos: nextPos,
            silasRotation: nextRotation,
            gameStatus: nextStatus,
            isSilasFrozen: false,
            turn: 'player'
          };
        }

        // 2. AI Action (using Silas's potentially new position)
        const newGrid = [...prev.grid];
        const pathAfterMove = findPath(nextPos, activePortals, newGrid);
        
        let targetTile: { x: number, y: number } | null = null;
        if (pathAfterMove && pathAfterMove.length > 2) {
          // Pick a tile on the path that isn't the current or next step
          targetTile = pathAfterMove[Math.floor(Math.random() * (pathAfterMove.length - 2)) + 1];
        } else {
          // If no path, pick a random occupied tile
          const occupiedTiles: { x: number, y: number }[] = [];
          newGrid.forEach((row, y) => row.forEach((tile, x) => {
            if (tile.isOccupied && tile.tileType !== 'Spawn' && tile.tileType !== 'Portal') {
              occupiedTiles.push({ x, y });
            }
          }));
          if (occupiedTiles.length > 0) {
            targetTile = occupiedTiles[Math.floor(Math.random() * occupiedTiles.length)];
          }
        }

        if (targetTile) {
          playSound('rotate');
          newGrid[targetTile.y] = [...newGrid[targetTile.y]];
          newGrid[targetTile.y][targetTile.x] = {
            ...newGrid[targetTile.y][targetTile.x],
            rotation: (newGrid[targetTile.y][targetTile.x].rotation + 90) % 360
          };
        }

        // 3. Post-AI Check (Silas might be trapped now)
        const isTrapped = isPhysicallyTrapped(nextPos, newGrid, activePortals);
        if (!prev.isSilasFrozen) {
          const currentTile = newGrid[nextPos.y][nextPos.x];
          if (currentTile.tileType === 'DeadEnd' && nextStuckTicks >= 1) {
            nextRotation = (nextRotation + 180) % 360;
          }
          if (isTrapped) nextStuckTicks++;
          else nextStuckTicks = 0;
        }

        // Check Win/Loss
        if (nextStuckTicks >= 3) {
          nextStatus = 'dino-win';
        } else if (prev.deckCount === 0 && nextStatus === 'playing' && nextStuckTicks < 3) {
          nextStatus = 'human-win-out-of-resources';
        }

        return {
          ...prev,
          grid: newGrid,
          silasPos: nextPos,
          silasRotation: nextRotation,
          stuckTicks: nextStuckTicks,
          gameStatus: nextStatus,
          isSilasFrozen: false,
          turn: 'player',
          aiAction: targetTile ? { ...targetTile, type: 'rotate' } : null
        };
      });
    }, 1000); // AI thinks for 1s

    return () => clearTimeout(aiTimer);
  }, [state.turn, state.gameStatus]);

  // Cooldowns & Effects Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        const nextRotateCooldowns = { ...prev.cooldowns.rotate };
        const nextTimeWarpCooldowns = { ...prev.cooldowns.timeWarp };

        Object.keys(nextRotateCooldowns).forEach(key => {
          if (nextRotateCooldowns[key] <= now) delete nextRotateCooldowns[key];
        });
        Object.keys(nextTimeWarpCooldowns).forEach(key => {
          if (nextTimeWarpCooldowns[key] <= now) delete nextTimeWarpCooldowns[key];
        });

        return {
          ...prev,
          isRoaring: now - prev.lastRoarTime < 1000,
          cooldowns: {
            rotate: nextRotateCooldowns,
            timeWarp: nextTimeWarpCooldowns
          }
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handlePlace = (x: number, y: number) => {
    if (selectedCardIndex === null || state.gameStatus !== 'playing' || state.turn !== 'player') return;
    const cardType = state.hand[selectedCardIndex];
    if (!cardType) return;

    const currentTile = state.grid[y][x];
    
    // Check if adjacent to an occupied tile
    const isAdjacentToOccupied = Object.values(DIRECTION_VECTORS).some(vector => {
      const nx = x + vector.dx;
      const ny = y + vector.dy;
      return (
        nx >= 0 && nx < GRID_SIZE && 
        ny >= 0 && ny < GRID_SIZE && 
        state.grid[ny][nx].isOccupied
      );
    });

    if (currentTile.isOccupied || currentTile.tileType === 'Portal' || currentTile.tileType === 'Spawn' || !isAdjacentToOccupied) {
      setShakeTile({ x, y });
      setTimeout(() => setShakeTile(null), 500);
      return;
    }

    setState(prev => {
      playSound('place');
      const newGrid = [...prev.grid];
      newGrid[y] = [...newGrid[y]];
      newGrid[y][x] = {
        ...newGrid[y][x],
        isOccupied: true,
        tileType: cardType,
        rotation: 0
      };

      const newHand = [...prev.hand];
      newHand[selectedCardIndex] = null;
      
      setTimeout(() => {
        setState(p => {
          const h = [...p.hand];
          h[selectedCardIndex] = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
          return { ...p, hand: h };
        });
      }, 500);

      return {
        ...prev,
        grid: newGrid,
        deckCount: prev.deckCount - 1,
        hand: newHand,
        turn: 'ai',
        aiAction: null
      };
    });
    setSelectedCardIndex(null);
  };

  const handleRotate = (x: number, y: number) => {
    if (state.gameStatus !== 'playing' || state.turn !== 'player') return;

    setState(prev => {
      playSound('rotate');
      const newGrid = [...prev.grid];
      newGrid[y] = [...newGrid[y]];
      newGrid[y][x] = {
        ...newGrid[y][x],
        rotation: (newGrid[y][x].rotation + 90) % 360
      };

      return {
        ...prev,
        grid: newGrid,
        turn: 'ai',
        aiAction: null
      };
    });
  };

  const handleTogglePortal = (x: number, y: number) => {
    const index = PORTAL_LOCATIONS.findIndex(p => p.x === x && p.y === y);
    if (state.gameStatus !== 'playing' || state.turn !== 'player') return;

    setState(prev => {
      playSound('portal');
      const newPortals = prev.portals.map((p, i) => ({
        ...p,
        isActive: i === index ? !p.isActive : false, // Only one active at a time
        lastToggled: i === index ? Date.now() : p.lastToggled
      }));

      return {
        ...prev,
        portals: newPortals,
        turn: 'ai',
        aiAction: null
      };
    });
  };

  const handleRoar = () => {
    if (state.gameStatus !== 'playing' || state.turn !== 'player') return;

    playSound('roar');
    setState(prev => ({
      ...prev,
      isRoaring: true,
      isSilasFrozen: true,
      lastRoarTime: Date.now(),
      turn: 'ai',
      aiAction: null
    }));
  };

  const handleRestart = () => {
    const spawnPoint = SPAWN_ZONE[Math.floor(Math.random() * SPAWN_ZONE.length)];
    setState({
      grid: createInitialGrid(),
      silasPos: spawnPoint,
      silasRotation: 0,
      deckCount: INITIAL_DECK_COUNT,
      hand: [
        TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
        TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
        TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)]
      ],
      portals: createInitialPortals(),
      isRoaring: false,
      isSilasFrozen: false,
      lastRoarTime: 0,
      stuckTicks: 0,
      gameStatus: 'playing',
      turn: 'player',
      aiAction: null,
      cooldowns: {
        rotate: {},
        timeWarp: {}
      }
    });
    setSelectedCardIndex(null);
  };

  return (
    <div className="min-h-screen w-screen bg-black flex flex-col items-center justify-start p-4 overflow-hidden gap-4">
      {/* Background Effects */}
      <div className="fixed top-4 left-4 font-mono text-neon-blue opacity-20 pointer-events-none z-0">
        <div className="text-2xl font-bold">DINO ESCAPE</div>
        <div>STATUS: {state.isSilasFrozen ? 'FROZEN' : 'TRACKING'}</div>
        <div>TARGET: SURVIVOR</div>
      </div>

      {/* Header: Title and Turn */}
      <div className="flex flex-col items-center z-10">
        <h1 className="text-5xl font-black text-neon-blue tracking-[0.4em] uppercase mb-4 drop-shadow-[0_0_20px_rgba(0,243,255,0.6)]">
          Dino Escape
        </h1>
        <TurnIndicator turn={state.turn} />
      </div>

      <GameOverOverlay gameStatus={state.gameStatus} onRestart={handleRestart} />

      {/* Roar Overlay */}
      <AnimatePresence>
        {state.isRoaring && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.8, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="text-[200px] grayscale opacity-50">🦖</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Game Area: Hand | Map | Controls */}
      <div className="flex flex-row items-center justify-center gap-12 w-full max-w-7xl flex-1">
        {/* Left: Hand */}
        <div className="z-10">
          <Hand 
            hand={state.hand} 
            selectedCardIndex={selectedCardIndex} 
            onSelectCard={setSelectedCardIndex} 
            deckCount={state.deckCount} 
          />
        </div>

        {/* Center: Map */}
        <div className="relative w-full max-w-[min(70vh,700px)] aspect-square jungle-grid rounded-lg overflow-hidden shadow-[0_0_50px_rgba(74,222,128,0.1)]">
          <div className="grid grid-cols-10 grid-rows-10 w-full h-full">
            {state.grid.map((row, y) => 
              row.map((tile, x) => {
                const portalIndex = PORTAL_LOCATIONS.findIndex(p => p.x === x && p.y === y);
                const isPortal = portalIndex !== -1;
                const isSpawn = SPAWN_ZONE.some(p => p.x === x && p.y === y);
                const rotateCooldown = state.cooldowns.rotate[`${x},${y}`] ? state.cooldowns.rotate[`${x},${y}`] - Date.now() : 0;
                const portalCooldown = isPortal ? (state.cooldowns.timeWarp[portalIndex] ? state.cooldowns.timeWarp[portalIndex] - Date.now() : 0) : 0;
                const isAIAction = state.aiAction?.x === x && state.aiAction?.y === y;

                return (
                  <div key={`${x}-${y}`} className={`relative ${shakeTile?.x === x && shakeTile?.y === y ? 'shake' : ''}`}>
                    <Tile 
                      x={x} y={y}
                      data={tile}
                      isPortal={isPortal}
                      isActivePortal={isPortal ? state.portals[portalIndex].isActive : false}
                      isSpawnZone={isSpawn}
                      canPlace={
                        !tile.isOccupied && 
                        tile.tileType !== 'Portal' && 
                        tile.tileType !== 'Spawn' &&
                        Object.values(DIRECTION_VECTORS).some(v => {
                          const nx = x + v.dx;
                          const ny = y + v.dy;
                          return nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && state.grid[ny][nx].isOccupied;
                        })
                      }
                      onPlace={handlePlace}
                      onRotate={handleRotate}
                      onTogglePortal={handleTogglePortal}
                      cooldownRotate={rotateCooldown}
                      cooldownPortal={portalCooldown}
                    />
                    {isAIAction && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 1.5 }}
                        animate={{ opacity: [0, 1, 0], scale: [1.5, 1, 1.2] }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 border-4 border-neon-pink z-50 pointer-events-none"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Survivor */}
          <Survivor 
            x={state.silasPos.x} 
            y={state.silasPos.y} 
            rotation={state.silasRotation}
            isFrozen={state.isSilasFrozen}
            isStuck={state.stuckTicks > 0}
          />
        </div>

        {/* Right: Controls */}
        <div className="z-10">
          <Controls 
            onRoar={handleRoar} 
            onRestart={handleRestart} 
            roarCooldown={state.lastRoarTime === 0 ? 0 : Math.max(0, 10000 - (Date.now() - state.lastRoarTime))} 
          />
        </div>
      </div>
    </div>
  );
}
