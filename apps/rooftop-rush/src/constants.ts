// World units. The floor SVG/DOM stage is FLOOR_WIDTH x FLOOR_HEIGHT, scaled to fit the viewport.
export const FLOOR_WIDTH = 800;
export const FLOOR_HEIGHT = 480;

// Player physics
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 44;
export const MOVE_SPEED = 240;          // px / s horizontal
export const JUMP_VELOCITY = 620;       // initial upward velocity (px / s) — max jump ≈ 128 px
export const GRAVITY = 1500;            // px / s^2
export const MAX_FALL_SPEED = 900;
export const GROUND_FRICTION = 0.82;    // applied each frame when no input

// Hazard / debris
export const DEBRIS_FALL_SPEED = 200;   // px / s
export const DEBRIS_RESPAWN_GAP = 1.6;  // seconds between drops
export const DEBRIS_SIZE = 28;

// Loop
export const TARGET_FRAME_MS = 1000 / 60;

export const STORAGE_KEY = 'rooftop-rush:progress:v1';
