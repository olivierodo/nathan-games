import { Direction, TileData, TileType } from '../types';
import { GRID_SIZE, DIRECTION_VECTORS, getRotatedConnections } from '../constants';

interface Node {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export function findPath(
  start: { x: number; y: number },
  targets: { x: number; y: number }[],
  grid: TileData[][]
): { x: number; y: number }[] | null {
  if (targets.length === 0) return null;

  let bestPath: { x: number; y: number }[] | null = null;

  for (const target of targets) {
    const path = aStar(start, target, grid, targets);
    if (path && (!bestPath || path.length < bestPath.length)) {
      bestPath = path;
    }
  }

  return bestPath;
}

function aStar(
  start: { x: number; y: number },
  target: { x: number; y: number },
  grid: TileData[][],
  activePortals: { x: number; y: number }[]
): { x: number; y: number }[] | null {
  const openList: Node[] = [];
  const closedList: Set<string> = new Set();

  openList.push({
    x: start.x,
    y: start.y,
    g: 0,
    h: manhattan(start, target),
    f: 0,
    parent: null
  });

  while (openList.length > 0) {
    openList.sort((a, b) => a.f - b.f);
    const current = openList.shift()!;
    const key = `${current.x},${current.y}`;

    if (current.x === target.x && current.y === target.y) {
      const path: { x: number; y: number }[] = [];
      let temp: Node | null = current;
      while (temp) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    closedList.add(key);

    const neighbors = getValidNeighbors(current.x, current.y, grid, activePortals);
    for (const neighbor of neighbors) {
      if (closedList.has(`${neighbor.x},${neighbor.y}`)) continue;

      const g = current.g + 1;
      const h = manhattan(neighbor, target);
      const f = g + h;

      const existing = openList.find(n => n.x === neighbor.x && n.y === neighbor.y);
      if (existing && g >= existing.g) continue;

      if (!existing) {
        openList.push({ ...neighbor, g, h, f, parent: current });
      } else {
        existing.g = g;
        existing.f = f;
        existing.parent = current;
      }
    }
  }

  return null;
}

function manhattan(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function getValidNeighbors(x: number, y: number, grid: TileData[][], activePortals: { x: number; y: number }[]) {
  const neighbors: { x: number; y: number }[] = [];
  const currentTile = grid[y][x];
  
  const isActivePortal = (px: number, py: number) => 
    activePortals.some(p => p.x === px && p.y === py);

  if (!currentTile.isOccupied && currentTile.tileType !== 'Spawn' && !isActivePortal(x, y)) return [];

  const currentConnections = getRotatedConnections(currentTile.tileType, currentTile.rotation);

  for (const dir of currentConnections) {
    const vec = DIRECTION_VECTORS[dir];
    const nx = x + vec.dx;
    const ny = y + vec.dy;

    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      const neighborTile = grid[ny][nx];
      const isNeighborActivePortal = isActivePortal(nx, ny);

      if (neighborTile.isOccupied || neighborTile.tileType === 'Spawn' || isNeighborActivePortal) {
        // Check if neighbor has a matching connection back
        const neighborConnections = getRotatedConnections(neighborTile.tileType, neighborTile.rotation);
        const oppositeDir = getOpposite(dir);
        if (neighborConnections.includes(oppositeDir)) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
  }

  return neighbors;
}

export function isPhysicallyTrapped(
  pos: { x: number; y: number },
  grid: TileData[][],
  activePortals: { x: number; y: number }[]
): boolean {
  const currentTile = grid[pos.y][pos.x];
  
  const isActivePortal = (px: number, py: number) => 
    activePortals.some(p => p.x === px && p.y === py);

  // Condition 1: All connected neighbors are isOccupied == false
  // (Note: Spawn tiles are always considered occupied for Silas)
  const currentConnections = getRotatedConnections(currentTile.tileType, currentTile.rotation);
  const hasOccupiedNeighbor = currentConnections.some(dir => {
    const vec = DIRECTION_VECTORS[dir];
    const nx = pos.x + vec.dx;
    const ny = pos.y + vec.dy;
    if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
      const neighbor = grid[ny][nx];
      return neighbor.isOccupied || neighbor.tileType === 'Spawn' || isActivePortal(nx, ny);
    }
    return false;
  });

  if (!hasOccupiedNeighbor && currentTile.tileType !== 'Spawn' && !isActivePortal(pos.x, pos.y)) return true;

  // Condition 2: Dead End tile with no further pathing possible to any grid edge
  if (currentTile.tileType === 'DeadEnd') {
    const validNeighbors = getValidNeighbors(pos.x, pos.y, grid, activePortals);
    if (validNeighbors.length === 0) return true;
  }

  return false;
}

function getOpposite(dir: Direction): Direction {
  switch (dir) {
    case 'N': return 'S';
    case 'E': return 'W';
    case 'S': return 'N';
    case 'W': return 'E';
  }
}
