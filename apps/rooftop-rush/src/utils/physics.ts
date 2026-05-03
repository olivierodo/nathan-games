import {
  GRAVITY,
  GROUND_FRICTION,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
} from '../constants';
import { PlatformData, PlayerState } from '../types';

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean; // edge-trigger: true only on the frame the jump was just pressed
}

export function stepPlayer(
  player: PlayerState,
  input: InputState,
  platforms: PlatformData[],
  worldWidth: number,
  worldHeight: number,
  dt: number,
): PlayerState {
  let { x, y, vx, vy, facing, onGround } = player;

  // Horizontal input
  if (input.left && !input.right) {
    vx = -MOVE_SPEED;
    facing = -1;
  } else if (input.right && !input.left) {
    vx = MOVE_SPEED;
    facing = 1;
  } else {
    vx *= GROUND_FRICTION;
    if (Math.abs(vx) < 5) vx = 0;
  }

  // Jump (edge-triggered)
  if (input.jumpPressed && onGround) {
    vy = -JUMP_VELOCITY;
    onGround = false;
  }

  // Gravity
  vy += GRAVITY * dt;
  if (vy > MAX_FALL_SPEED) vy = MAX_FALL_SPEED;

  // Integrate horizontal, then resolve collisions
  let nextX = x + vx * dt;
  // World bounds
  if (nextX < 0) nextX = 0;
  if (nextX + PLAYER_WIDTH > worldWidth) nextX = worldWidth - PLAYER_WIDTH;
  for (const plat of platforms) {
    if (rectsOverlap(nextX, y, PLAYER_WIDTH, PLAYER_HEIGHT, plat.x, plat.y, plat.width, plat.height)) {
      if (vx > 0) nextX = plat.x - PLAYER_WIDTH - 0.01;
      else if (vx < 0) nextX = plat.x + plat.width + 0.01;
      vx = 0;
    }
  }
  x = nextX;

  // Integrate vertical
  let nextY = y + vy * dt;
  let landed = false;
  for (const plat of platforms) {
    if (rectsOverlap(x, nextY, PLAYER_WIDTH, PLAYER_HEIGHT, plat.x, plat.y, plat.width, plat.height)) {
      if (vy > 0) {
        // Landing on top
        nextY = plat.y - PLAYER_HEIGHT - 0.01;
        vy = 0;
        landed = true;
      } else if (vy < 0) {
        // Bumping head
        nextY = plat.y + plat.height + 0.01;
        vy = 0;
      }
    }
  }
  y = nextY;
  onGround = landed;

  // Floor / ceiling clamps
  if (y < 0) {
    y = 0;
    if (vy < 0) vy = 0;
  }
  if (y + PLAYER_HEIGHT > worldHeight + 200) {
    // Fell off the world (shouldn't happen because water catches first, but clamp to be safe)
    y = worldHeight + 200 - PLAYER_HEIGHT;
  }

  return { x, y, vx, vy, facing, onGround };
}

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
