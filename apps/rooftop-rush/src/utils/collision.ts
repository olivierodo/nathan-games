import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../constants';
import { HazardData, NpcData, PlayerState, Rect } from '../types';
import { rectsOverlap } from './physics';

export function playerHazardHit(player: PlayerState, hazard: HazardData, hazardYOverride?: number): boolean {
  const hy = hazardYOverride ?? hazard.y;
  return rectsOverlap(
    player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
    hazard.x, hy, hazard.width, hazard.height,
  );
}

export function playerInWater(player: PlayerState, waterTopY: number): boolean {
  // Water occupies waterTopY..bottom
  return player.y + PLAYER_HEIGHT > waterTopY;
}

export function playerReachedExit(player: PlayerState, exit: Rect): boolean {
  return rectsOverlap(
    player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
    exit.x, exit.y, exit.width, exit.height,
  );
}

export function playerTouchedNpc(player: PlayerState, npc: NpcData): boolean {
  // NPC is roughly 28x28
  return rectsOverlap(
    player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
    npc.x - 4, npc.y - 4, 36, 36,
  );
}
