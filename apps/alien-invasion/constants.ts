import { BoardNode, TileType, Player } from './types';

export const TOTAL_STEPS = 80;
// ALIEN_MOVE_SPEED removed - uses dice now
export const BOARD_WIDTH = 800;
export const BOARD_HEIGHT = 6800; // Increased to fit all 80 steps vertically

// Generate a curvy path using Sine waves
export const generateBoard = (): BoardNode[] => {
  const nodes: BoardNode[] = [];
  const amplitude = 300; // How wide the curve is
  const frequency = 0.15; // How tight the curves are
  const verticalSpacing = 80; // Distance between steps
  const centerX = BOARD_WIDTH / 2;

  for (let i = 0; i <= TOTAL_STEPS; i++) {
    // 0 is at the Top (low Y), 80 is at the Bottom (high Y)
    const y = 150 + (i * verticalSpacing); 
    const x = centerX + Math.sin(i * frequency) * amplitude;

    let type = TileType.NORMAL;
    if (i === 0) type = TileType.START;
    else if (i === TOTAL_STEPS) type = TileType.FINISH;
    else {
      // Randomly assign special tiles
      const rand = Math.random();
      // Ensure special tiles don't appear too early
      if (i > 5) {
        if (rand < 0.1) type = TileType.MUD; // 10% chance
        else if (rand < 0.18) type = TileType.NICE_ALIEN; // 8% chance
        else if (rand < 0.21) type = TileType.SHOES; // 3% chance
      }
    }

    nodes.push({ id: i, x, y, type });
  }
  return nodes;
};

const PLAYER_TEMPLATES = [
  { name: 'P1', color: 'bg-neon-blue' },
  { name: 'P2', color: 'bg-neon-pink' },
  { name: 'P3', color: 'bg-neon-green' },
  { name: 'P4', color: 'bg-neon-yellow' },
];

export const createPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: PLAYER_TEMPLATES[i].name,
    color: PLAYER_TEMPLATES[i].color,
    position: 0,
    isStuck: 0,
    hasShoes: false,
    shoeJumpUsed: false,
    skipNextTurn: false,
    finished: false
  }));
};