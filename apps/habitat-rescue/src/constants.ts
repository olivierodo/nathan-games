import { Question, Tile, TerrainType } from './types';

export const GRID_COLS = 25;
export const GRID_ROWS = 25;
export const STARTING_WATER = 5;
export const MAX_WATER = 5;

// Generate Grid
export const generateGrid = (): Tile[] => {
  const tiles: Tile[] = [];
  
  // Surface
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      let type: TerrainType = 'grass';
      
      // Hardcoded special tiles for gameplay balance
      if (x === GRID_COLS - 1 && y === GRID_ROWS - 1) type = 'goal';
      else if ((x + y) % 15 === 0 && (x !== 0 || y !== 0)) type = 'water-source';
      else if ((x * y) % 20 === 0 && (x !== 0 || y !== 0) && (x+y > 5)) type = 'burrow';
      else if ((x + y * GRID_COLS) % 20 === 0 && (x+y > 0)) type = 'checkpoint';

      tiles.push({ x, y, type, layer: 'surface' });
    }
  }

  // Underground (simplified for now, mostly dirt/burrows)
  // We might not need to render a separate grid array if we just toggle rendering logic
  // but keeping data consistent is good.
  return tiles;
};

export const QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'What do penguins primarily eat?',
    options: ['Krill and Fish', 'Seaweed', 'Insects', 'Polar Bears'],
    correctAnswer: 0,
    difficulty: 'easy'
  },
  {
    id: '2',
    text: 'How does a Fennec Fox stay cool in the desert?',
    options: ['It pants constantly', 'It sweats through its paws', 'Its large ears radiate heat', 'It swims in oases'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '3',
    text: 'What is the primary purpose of camouflage?',
    options: ['To attract mates', 'To hide from predators or prey', 'To regulate body temperature', 'To signal dominance'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '4',
    text: 'Which of these animals is nocturnal?',
    options: ['Cheetah', 'Owl', 'Gorilla', 'Eagle'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '5',
    text: 'What is a group of wolves called?',
    options: ['A Herd', 'A Flock', 'A Pack', 'A School'],
    correctAnswer: 2,
    difficulty: 'easy'
  },
  {
    id: '6',
    text: 'Where do Polar Bears live?',
    options: ['Antarctica', 'The Arctic', 'Rainforests', 'Deserts'],
    correctAnswer: 1,
    difficulty: 'medium'
  },
  {
    id: '7',
    text: 'What is the fastest land animal?',
    options: ['Lion', 'Cheetah', 'Horse', 'Ostrich'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '8',
    text: 'Which animal is known as the "Ship of the Desert"?',
    options: ['Horse', 'Camel', 'Elephant', 'Donkey'],
    correctAnswer: 1,
    difficulty: 'easy'
  },
  {
    id: '9',
    text: 'What type of animal is a frog?',
    options: ['Reptile', 'Mammal', 'Amphibian', 'Bird'],
    correctAnswer: 2,
    difficulty: 'medium'
  },
  {
    id: '10',
    text: 'What do pandas mainly eat?',
    options: ['Meat', 'Bamboo', 'Fruit', 'Fish'],
    correctAnswer: 1,
    difficulty: 'easy'
  }
];
