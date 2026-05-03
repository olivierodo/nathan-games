export type BuildingId = 'apartment' | 'office' | 'skyscraper';

export type HazardType = 'debris' | 'wire' | 'spike';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlatformData extends Rect {}

export interface HazardData {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  // For falling debris: phase offset for the cycle
  phase?: number;
}

export interface NpcData {
  id: string;
  x: number;
  y: number;
  emoji: string;
}

export interface FloorData {
  id: string;
  buildingId: BuildingId;
  floorIndex: 0 | 1 | 2;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  exit: { x: number; y: number; width: number; height: number };
  platforms: PlatformData[];
  hazards: HazardData[];
  npcs: NpcData[];
  waterRiseSeconds: number;
}

export interface BuildingData {
  id: BuildingId;
  name: string;
  emoji: string;
  themeClass: string;
  floors: FloorData[];
}

export type GameStatus =
  | 'title'
  | 'playing'
  | 'floor-clear'
  | 'building-clear'
  | 'win'
  | 'lose';

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
}

export interface RunStats {
  buildingIndex: number;
  floorIndex: number;
  rescuedNpcs: Set<string>;
  startedAt: number;
}

export interface BestTimeRecord {
  [floorId: string]: number; // ms
}

export interface PersistedProgress {
  unlockedBuildingIndex: number;
  unlockedFloorIndex: number;
  bestTimes: BestTimeRecord;
}
