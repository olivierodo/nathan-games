
export enum SquareType {
  NORMAL = 'NORMAL',
  CHEST = 'CHEST',
  PLANE = 'PLANE',
  MISSILE = 'MISSILE',
  BOMB = 'BOMB',
  START = 'START',
  FINISH = 'FINISH'
}

export interface Player {
  id: number;
  name: string;
  emoji: string;
  position: number;
  isEliminated: boolean;
  color: string;
}

export interface SquareData {
  id: number;
  type: SquareType;
  used: boolean;
  destination?: number;
  name?: string;
  riddle?: RiddleData;
  audioBuffer?: AudioBuffer;
}

export interface RiddleData {
  riddle: string;
  options: string[];
  answer: string;
  explanation: string;
}

export enum GameStage {
  SETUP = 'SETUP',
  PRELOADING = 'PRELOADING',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}
