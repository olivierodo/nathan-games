export type Direction = 'N' | 'E' | 'S' | 'W';

export type TileType = 'Straight' | 'L' | 'T' | 'DeadEnd' | 'Empty' | 'Spawn' | 'Portal';

export interface TileData {
  isOccupied: boolean;
  tileType: TileType;
  rotation: number; // 0, 90, 180, 270
  connectionPoints: Direction[];
}

export interface Portal {
  x: number;
  y: number;
  isActive: boolean;
  lastToggled: number;
}

export interface GameState {
  grid: TileData[][];
  silasPos: { x: number; y: number };
  silasRotation: number;
  deckCount: number;
  hand: (TileType | null)[];
  portals: Portal[];
  isRoaring: boolean;
  isSilasFrozen: boolean;
  lastRoarTime: number;
  stuckTicks: number;
  gameStatus: 'playing' | 'dino-win' | 'human-win-escape' | 'human-win-out-of-resources';
  turn: 'player' | 'ai';
  aiAction: { x: number, y: number, type: 'rotate' } | null;
  cooldowns: {
    rotate: Record<string, number>; // key: "x,y"
    timeWarp: Record<string, number>; // key: "index"
  };
}
