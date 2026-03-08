export type Position = {
  x: number;
  y: number;
};

export type EntityType = 'player' | 'wolf' | 'mole';

export type TerrainType = 'grass' | 'water-source' | 'burrow' | 'goal' | 'checkpoint';

export type GameState = 'playing' | 'game-over' | 'won' | 'quiz';

export type Layer = 'surface' | 'underground';

export interface Entity {
  id: string;
  type: EntityType;
  position: Position;
  layer: Layer;
  isFrozen?: boolean;
  frozenTurns?: number;
}

export interface Player extends Entity {
  water: number;
  maxWater: number;
  items: string[]; // 'freeze-block'
}

export interface Tile {
  x: number;
  y: number;
  type: TerrainType;
  layer: Layer;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index
  difficulty: 'easy' | 'medium' | 'hard';
}
