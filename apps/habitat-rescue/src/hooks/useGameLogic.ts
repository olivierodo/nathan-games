import { useState, useEffect, useCallback } from 'react';
import { Entity, GameState, Layer, Player, Position, Tile, Question } from '../types';
import { GRID_COLS, GRID_ROWS, STARTING_WATER, MAX_WATER, QUESTIONS, generateGrid } from '../constants';
import { sounds } from '../utils/audio';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [layer, setLayer] = useState<Layer>('surface');
  const [turn, setTurn] = useState(0);
  
  // We need the grid to check for tile types
  const [grid] = useState<Tile[]>(generateGrid());

  const [player, setPlayer] = useState<Player>({
    id: 'player',
    type: 'player',
    position: { x: 0, y: 0 },
    layer: 'surface',
    water: STARTING_WATER,
    maxWater: MAX_WATER,
    items: []
  });

  const [wolves, setWolves] = useState<Entity[]>([
    { id: 'wolf1', type: 'wolf', position: { x: 8, y: 8 }, layer: 'surface' },
    { id: 'wolf2', type: 'wolf', position: { x: 15, y: 5 }, layer: 'surface' },
    { id: 'wolf3', type: 'wolf', position: { x: 5, y: 15 }, layer: 'surface' },
    { id: 'wolf4', type: 'wolf', position: { x: 20, y: 20 }, layer: 'surface' }, // Guarding goal
    { id: 'wolf5', type: 'wolf', position: { x: 22, y: 22 }, layer: 'surface' }  // Guarding goal
  ]);

  const [moles, setMoles] = useState<Entity[]>([
    { id: 'mole1', type: 'mole', position: { x: 5, y: 5 }, layer: 'underground' },
    { id: 'mole2', type: 'mole', position: { x: 20, y: 20 }, layer: 'underground' }
  ]);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [quizQueue, setQuizQueue] = useState<Question[]>([]);
  const [message, setMessage] = useState<string>('Reach the habitat!');

  const [quizzesSolved, setQuizzesSolved] = useState(0);
  
  // Rain Logic
  const [isRaining, setIsRaining] = useState(false);
  const [nextRainTurn, setNextRainTurn] = useState(Math.floor(Math.random() * 6) + 5); // Random between 5-10

  // Helper to check bounds
  const isValidMove = (pos: Position) => {
    return pos.x >= 0 && pos.x < GRID_COLS && pos.y >= 0 && pos.y < GRID_ROWS;
  };

  // Move Wolves
  const moveWolves = useCallback((playerPosition: Position) => {
    setWolves(prevWolves => prevWolves.map(wolf => {
      if (wolf.isFrozen && (wolf.frozenTurns || 0) > 0) {
        return { ...wolf, frozenTurns: (wolf.frozenTurns || 0) - 1, isFrozen: (wolf.frozenTurns || 0) - 1 > 0 };
      }

      // Aggressive Logic
      const distToPlayer = Math.sqrt(Math.pow(wolf.position.x - playerPosition.x, 2) + Math.pow(wolf.position.y - playerPosition.y, 2));
      const goalPos = { x: GRID_COLS - 1, y: GRID_ROWS - 1 };
      const playerDistToGoal = Math.sqrt(Math.pow(playerPosition.x - goalPos.x, 2) + Math.pow(playerPosition.y - goalPos.y, 2));
      
      let target = null;

      // 1. If player is close (within 6 tiles), CHASE!
      // 2. If player is near the goal (within 10 tiles), ALL wolves swarm the player to protect it.
      if (distToPlayer < 6 || playerDistToGoal < 10) {
          target = playerPosition;
      } 
      // 3. Guardians (wolf4, wolf5) should patrol near the goal if they aren't chasing
      else if ((wolf.id === 'wolf4' || wolf.id === 'wolf5')) {
          const distToGoal = Math.sqrt(Math.pow(wolf.position.x - goalPos.x, 2) + Math.pow(wolf.position.y - goalPos.y, 2));
          if (distToGoal > 5) {
              target = goalPos; // Return to post
          }
      }

      if (target) {
          const dx = target.x - wolf.position.x;
          const dy = target.y - wolf.position.y;
          let moveX = 0; 
          let moveY = 0;
          
          // Simple pathfinding towards target
          if (Math.abs(dx) > Math.abs(dy)) {
              moveX = dx > 0 ? 1 : -1;
          } else {
              moveY = dy > 0 ? 1 : -1;
          }
          
          const newPos = { x: wolf.position.x + moveX, y: wolf.position.y + moveY };
          return isValidMove(newPos) ? { ...wolf, position: newPos } : wolf;
      }

      // Simple random movement logic (Patrol/Wander)
      const moves = [
        { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
      ];
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const newPos = { x: wolf.position.x + randomMove.x, y: wolf.position.y + randomMove.y };

      return isValidMove(newPos) ? { ...wolf, position: newPos } : wolf;
    }));
  }, []);

  // Move Moles (Chase player if underground, otherwise random)
  const moveMoles = useCallback((playerPosition: Position, playerLayer: Layer) => {
    setMoles(prevMoles => prevMoles.map(mole => {
      if (mole.isFrozen && (mole.frozenTurns || 0) > 0) {
        return { ...mole, frozenTurns: (mole.frozenTurns || 0) - 1, isFrozen: (mole.frozenTurns || 0) - 1 > 0 };
      }

      if (playerLayer === 'underground') {
        // Chase logic
        const dx = playerPosition.x - mole.position.x;
        const dy = playerPosition.y - mole.position.y;
        
        let moveX = 0;
        let moveY = 0;

        if (Math.abs(dx) > Math.abs(dy)) {
          moveX = dx > 0 ? 1 : -1;
        } else {
          moveY = dy > 0 ? 1 : -1;
        }

        const newPos = { x: mole.position.x + moveX, y: mole.position.y + moveY };
        return isValidMove(newPos) ? { ...mole, position: newPos } : mole;
      } else {
        // Random movement if player is on surface
        const moves = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }];
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        const newPos = { x: mole.position.x + randomMove.x, y: mole.position.y + randomMove.y };
        return isValidMove(newPos) ? { ...mole, position: newPos } : mole;
      }
    }));
  }, []);

  // Check Collisions
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Wolf Collision
    if (layer === 'surface') {
      const hitWolf = wolves.some(w => w.position.x === player.position.x && w.position.y === player.position.y);
      if (hitWolf) {
        setGameState('game-over');
        setMessage('You were caught by a Wolf!');
        sounds.playLose();
      }
    }

    // Mole Collision
    if (layer === 'underground') {
      const hitMole = moles.find(m => m.position.x === player.position.x && m.position.y === player.position.y && !m.isFrozen);
      if (hitMole) {
        // Trigger Quiz
        setGameState('quiz');
        sounds.playQuizAlert();
        const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        setQuizQueue(selected);
        setCurrentQuestion(selected[0]);
      }
    }

    // Win Condition
    if (player.position.x === GRID_COLS - 1 && player.position.y === GRID_ROWS - 1 && layer === 'surface') {
      setGameState('won');
      setMessage('You reached the Habitat!');
      sounds.playWin();
    }

  }, [player.position, wolves, moles, layer, gameState]);

  const handleMove = (dx: number, dy: number) => {
    if (gameState !== 'playing') return;

    const newPos = { x: player.position.x + dx, y: player.position.y + dy };
    if (!isValidMove(newPos)) return;

    const moveCost = layer === 'surface' ? 1 : 0.5;
    
    if (player.water < moveCost) {
      setMessage("Too thirsty to move... waiting for rain.");
      endTurn();
      return;
    }

    setPlayer(prev => ({
      ...prev,
      position: newPos,
      water: Math.max(0, prev.water - moveCost)
    }));

    sounds.playMove();
    endTurn();
  };

  const handleUseItem = () => {
    if (player.items.includes('freeze-block')) {
        // Logic to freeze nearby enemies
        setWolves(prev => prev.map(w => {
            const dist = Math.sqrt(Math.pow(w.position.x - player.position.x, 2) + Math.pow(w.position.y - player.position.y, 2));
            if (dist <= 3) return { ...w, isFrozen: true, frozenTurns: 2 };
            return w;
        }));
        setMoles(prev => prev.map(m => {
             const dist = Math.sqrt(Math.pow(m.position.x - player.position.x, 2) + Math.pow(m.position.y - player.position.y, 2));
             if (dist <= 3) return { ...m, isFrozen: true, frozenTurns: 2 };
             return m;
        }));
        setPlayer(prev => ({ ...prev, items: prev.items.filter(i => i !== 'freeze-block') }));
        setMessage("Used Freeze Block! Nearby enemies frozen.");
        sounds.playItemUse();
    }
  };

  const handleEnterBurrow = () => {
    if (gameState !== 'playing') return;
    setLayer(prev => prev === 'surface' ? 'underground' : 'surface');
    sounds.playBurrow();
  };

  const endTurn = () => {
    moveWolves(player.position);
    moveMoles(player.position, layer);
    
    const nextTurn = turn + 1;
    setTurn(nextTurn);

    // Rain Mechanic
    if (nextTurn >= nextRainTurn) {
        setIsRaining(true);
        setPlayer(prev => ({ ...prev, water: prev.maxWater }));
        setMessage("Rain is pouring! Water refilled.");
        sounds.playRain();
        // Schedule next rain
        setNextRainTurn(nextTurn + Math.floor(Math.random() * 6) + 5);
    }
  };

  const handleRainAck = () => {
      setIsRaining(false);
      setMessage("The rain has stopped. You can move.");
  };

  const handleQuizAnswer = (answerIndex: number) => {
    if (currentQuestion && answerIndex === currentQuestion.correctAnswer) {
      const remaining = quizQueue.slice(1);
      if (remaining.length > 0) {
        setQuizQueue(remaining);
        setCurrentQuestion(remaining[0]);
        setMessage(`Correct! ${remaining.length} more to escape...`);
      } else {
        setGameState('playing');
        setPlayer(prev => ({ ...prev, water: Math.min(prev.maxWater, prev.water + 5) }));
        setMoles(prev => prev.map(m => ({ ...m, isFrozen: true, frozenTurns: 3 })));
        setQuizzesSolved(prev => prev + 1);
        setMessage("Escaped! Moles stunned and water gained.");
        sounds.playCorrect();
        setCurrentQuestion(null);
        setQuizQueue([]);
      }
    } else {
      setGameState('game-over');
      setMessage("Wrong answer! The Mole got you.");
      sounds.playWrong();
      sounds.playLose();
      setCurrentQuestion(null);
      setQuizQueue([]);
    }
  };

  return {
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
    turn,
    handleUseItem,
    setPlayer,
    grid,
    quizzesSolved,
    isRaining,
    handleRainAck
  };
};
