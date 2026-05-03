import { BuildingData, FloorData, HazardData, NpcData, PlatformData } from './types';
import { FLOOR_WIDTH, FLOOR_HEIGHT } from './constants';

const exitRect = { x: FLOOR_WIDTH - 80, y: 80, width: 70, height: 80 };

function p(x: number, y: number, width: number, height = 16): PlatformData {
  return { x, y, width, height };
}

function ground(parts: Array<[number, number]>): PlatformData[] {
  return parts.map(([x, w]) => ({ x, y: FLOOR_HEIGHT - 24, width: w, height: 24 }));
}

function debris(id: string, x: number, phase = 0): HazardData {
  return { id, type: 'debris', x, y: -40, width: 28, height: 28, phase };
}

function wire(id: string, x: number, y: number, width = 80): HazardData {
  return { id, type: 'wire', x, y, width, height: 10 };
}

function spike(id: string, x: number, y: number, width = 60): HazardData {
  return { id, type: 'spike', x, y, width, height: 14 };
}

function npc(id: string, x: number, y: number, emoji: string): NpcData {
  return { id, x, y, emoji };
}

// ---------- APARTMENT ----------

const apt1: FloorData = {
  id: 'apt-1',
  buildingId: 'apartment',
  floorIndex: 0,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 50, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, FLOOR_WIDTH]]),
    p(180, 370, 130),
    p(380, 290, 130),
    p(580, 220, 130),
    p(680, 160, 110),
  ],
  hazards: [],
  npcs: [],
  waterRiseSeconds: 32,
};

const apt2: FloorData = {
  id: 'apt-2',
  buildingId: 'apartment',
  floorIndex: 1,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 340], [460, 340]]),
    p(160, 360, 110),
    p(360, 290, 130),
    p(560, 240, 120),
    p(660, 160, 130),
  ],
  hazards: [debris('d1', 220, 0), debris('d2', 500, 0.8)],
  npcs: [npc('cat1', 405, 264, '🐱')],
  waterRiseSeconds: 28,
};

const apt3: FloorData = {
  id: 'apt-3',
  buildingId: 'apartment',
  floorIndex: 2,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 200], [300, 200], [600, 200]]),
    p(120, 370, 110),
    p(290, 320, 110),
    p(470, 280, 110),
    p(620, 220, 130),
    p(450, 160, 110),
    p(680, 130, 110),
  ],
  hazards: [
    debris('d1', 280, 0),
    debris('d2', 520, 0.6),
    wire('w1', 290, 304),
  ],
  npcs: [
    npc('grandma', 320, 294, '👵'),
    npc('dog1', 510, 254, '🐶'),
  ],
  waterRiseSeconds: 24,
};

// ---------- OFFICE ----------

const off1: FloorData = {
  id: 'office-1',
  buildingId: 'office',
  floorIndex: 0,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 280], [380, 420]]),
    p(140, 370, 100),
    p(280, 310, 100),
    p(440, 280, 110),
    p(600, 230, 120),
    p(680, 160, 110),
  ],
  hazards: [debris('d1', 220, 0.2), debris('d2', 500, 1.0), spike('s1', 320, FLOOR_HEIGHT - 38)],
  npcs: [npc('intern', 470, 254, '🧑‍💻')],
  waterRiseSeconds: 24,
};

const off2: FloorData = {
  id: 'office-2',
  buildingId: 'office',
  floorIndex: 1,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 220], [320, 160], [560, 240]]),
    p(120, 370, 90),
    p(260, 320, 90),
    p(420, 290, 100),
    p(560, 230, 110),
    p(380, 180, 110),
    p(640, 150, 130),
  ],
  hazards: [
    debris('d1', 180, 0),
    debris('d2', 380, 0.5),
    debris('d3', 600, 1.0),
    wire('w1', 260, 304),
  ],
  npcs: [npc('boss', 430, 264, '🧑‍💼'), npc('cat2', 590, 204, '🐱')],
  waterRiseSeconds: 22,
};

const off3: FloorData = {
  id: 'office-3',
  buildingId: 'office',
  floorIndex: 2,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 160], [240, 140], [460, 140], [680, 120]]),
    p(120, 380, 80),
    p(260, 340, 80),
    p(400, 300, 80),
    p(540, 270, 80),
    p(660, 220, 110),
    p(460, 180, 100),
    p(660, 140, 110),
  ],
  hazards: [
    debris('d1', 180, 0),
    debris('d2', 320, 0.4),
    debris('d3', 480, 0.8),
    spike('s1', 360, FLOOR_HEIGHT - 38),
    wire('w1', 540, 254),
  ],
  npcs: [npc('janitor', 565, 244, '🧑‍🔧'), npc('dog2', 480, 154, '🐕')],
  waterRiseSeconds: 20,
};

// ---------- SKYSCRAPER ----------

const sky1: FloorData = {
  id: 'sky-1',
  buildingId: 'skyscraper',
  floorIndex: 0,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 140], [220, 110], [400, 110], [580, 110]]),
    p(140, 380, 80),
    p(260, 320, 80),
    p(420, 290, 80),
    p(560, 240, 90),
    p(680, 200, 110),
    p(440, 170, 90),
    p(660, 140, 110),
  ],
  hazards: [
    debris('d1', 200, 0),
    debris('d2', 400, 0.5),
    debris('d3', 600, 1.0),
    spike('s1', 290, FLOOR_HEIGHT - 38),
    spike('s2', 510, FLOOR_HEIGHT - 38),
  ],
  npcs: [npc('exec', 460, 254, '🤵'), npc('cat3', 590, 204, '🐈')],
  waterRiseSeconds: 19,
};

const sky2: FloorData = {
  id: 'sky-2',
  buildingId: 'skyscraper',
  floorIndex: 1,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 110], [180, 90], [320, 90], [460, 90], [600, 110]]),
    p(120, 380, 70),
    p(240, 340, 70),
    p(360, 310, 70),
    p(480, 280, 70),
    p(600, 240, 80),
    p(680, 190, 110),
    p(480, 200, 80),
    p(280, 240, 70),
    p(660, 140, 110),
  ],
  hazards: [
    debris('d1', 160, 0),
    debris('d2', 320, 0.3),
    debris('d3', 480, 0.7),
    debris('d4', 640, 1.1),
    wire('w1', 240, 324),
    spike('s1', 410, FLOOR_HEIGHT - 38),
  ],
  npcs: [
    npc('scientist2', 510, 254, '🧑‍🔬'),
    npc('dog3', 310, 214, '🐩'),
    npc('bird1', 690, 164, '🦜'),
  ],
  waterRiseSeconds: 17,
};

const sky3: FloorData = {
  id: 'sky-3',
  buildingId: 'skyscraper',
  floorIndex: 2,
  width: FLOOR_WIDTH,
  height: FLOOR_HEIGHT,
  spawn: { x: 40, y: FLOOR_HEIGHT - 24 - 44 },
  exit: exitRect,
  platforms: [
    ...ground([[0, 90], [160, 80], [280, 80], [400, 80], [520, 80], [640, 100]]),
    p(110, 380, 60),
    p(220, 340, 60),
    p(330, 310, 60),
    p(440, 280, 60),
    p(560, 250, 60),
    p(660, 200, 120),
    p(460, 200, 60),
    p(280, 220, 60),
    p(660, 140, 120),
  ],
  hazards: [
    debris('d1', 140, 0),
    debris('d2', 280, 0.25),
    debris('d3', 420, 0.55),
    debris('d4', 560, 0.85),
    debris('d5', 700, 1.15),
    wire('w1', 220, 324),
    wire('w2', 440, 264),
    spike('s1', 350, FLOOR_HEIGHT - 38),
  ],
  npcs: [
    npc('mom', 470, 184, '👩'),
    npc('dad', 295, 194, '👨'),
    npc('sibling', 580, 224, '🧒'),
  ],
  waterRiseSeconds: 15,
};

export const BUILDINGS: BuildingData[] = [
  {
    id: 'apartment',
    name: 'Apartment',
    emoji: '🏠',
    themeClass: 'theme-apartment',
    floors: [apt1, apt2, apt3],
  },
  {
    id: 'office',
    name: 'Office Tower',
    emoji: '🏢',
    themeClass: 'theme-office',
    floors: [off1, off2, off3],
  },
  {
    id: 'skyscraper',
    name: 'Skyscraper',
    emoji: '🏙️',
    themeClass: 'theme-skyscraper',
    floors: [sky1, sky2, sky3],
  },
];

export function getFloor(buildingIndex: number, floorIndex: number): FloorData {
  return BUILDINGS[buildingIndex].floors[floorIndex];
}

export const TOTAL_BUILDINGS = BUILDINGS.length;
export const FLOORS_PER_BUILDING = 3;
