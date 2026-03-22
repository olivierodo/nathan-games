import { Direction, TileType } from './types';

export const GRID_SIZE = 10;
export const TICK_RATE = 1500;
export const SPAWN_ZONE = [
  { x: 4, y: 4 }, { x: 4, y: 5 },
  { x: 5, y: 4 }, { x: 5, y: 5 }
];
export const PORTAL_LOCATIONS = [
  { x: 0, y: 0 }, { x: 0, y: 9 },
  { x: 9, y: 0 }, { x: 9, y: 9 }
];

export const TILE_CONNECTIONS: Record<TileType, Direction[]> = {
  'Straight': ['N', 'S'],
  'L': ['N', 'E'],
  'T': ['W', 'N', 'E'],
  'DeadEnd': ['N'],
  'Empty': [],
  'Spawn': ['N', 'E', 'S', 'W'],
  'Portal': ['N', 'E', 'S', 'W']
};

export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  'N': { dx: 0, dy: -1 },
  'E': { dx: 1, dy: 0 },
  'S': { dx: 0, dy: 1 },
  'W': { dx: -1, dy: 0 }
};

export const ROTATION_MAP: Record<Direction, Direction> = {
  'N': 'E',
  'E': 'S',
  'S': 'W',
  'W': 'N'
};

export function getRotatedConnections(type: TileType, rotation: number): Direction[] {
  let connections = [...TILE_CONNECTIONS[type]];
  const rotations = (rotation / 90) % 4;
  for (let i = 0; i < rotations; i++) {
    connections = connections.map(d => ROTATION_MAP[d]);
  }
  return connections;
}
