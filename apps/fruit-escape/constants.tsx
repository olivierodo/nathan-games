
import { SquareType, SquareData } from './types';

export const FRUIT_AVATARS = [
  { emoji: '🍎', name: 'Apple', color: 'bg-red-500' },
  { emoji: '🍌', name: 'Banana', color: 'bg-yellow-400' },
  { emoji: '🍇', name: 'Grapes', color: 'bg-purple-500' },
  { emoji: '🍊', name: 'Orange', color: 'bg-orange-500' },
  { emoji: '🍓', name: 'Strawberry', color: 'bg-pink-500' },
  { emoji: '🍍', name: 'Pineapple', color: 'bg-yellow-600' },
  { emoji: '🥝', name: 'Kiwi', color: 'bg-green-600' },
  { emoji: '🍒', name: 'Cherry', color: 'bg-red-600' },
  { emoji: '🍑', name: 'Peach', color: 'bg-orange-300' },
  { emoji: '🍉', name: 'Watermelon', color: 'bg-green-500' },
];

export const BOARD_SIZE = 51; // 0 to 50

const SPECIAL_SQUARES: Record<number, Partial<SquareData>> = {
  0: { type: SquareType.START },
  50: { type: SquareType.FINISH },
  5: { type: SquareType.CHEST },
  10: { type: SquareType.MISSILE },
  12: { type: SquareType.PLANE, destination: 25, name: 'Cloud Port' },
  15: { type: SquareType.CHEST },
  18: { type: SquareType.BOMB },
  20: { type: SquareType.MISSILE },
  25: { type: SquareType.PLANE, destination: 12, name: 'Dew Hangar' },
  28: { type: SquareType.CHEST },
  33: { type: SquareType.BOMB },
  35: { type: SquareType.MISSILE },
  38: { type: SquareType.PLANE, destination: 48, name: 'Sun Ridge' },
  42: { type: SquareType.CHEST },
  45: { type: SquareType.MISSILE },
  48: { type: SquareType.BOMB },
};

export const INITIAL_BOARD: SquareData[] = Array.from({ length: BOARD_SIZE }, (_, i) => ({
  id: i,
  type: SPECIAL_SQUARES[i]?.type || SquareType.NORMAL,
  used: false,
  destination: SPECIAL_SQUARES[i]?.destination,
  name: SPECIAL_SQUARES[i]?.name,
}));
