export enum TileType {
  NORMAL = 'NORMAL',
  MUD = 'MUD',
  NICE_ALIEN = 'NICE_ALIEN', // Trivia
  SHOES = 'SHOES', // Super Boost
  START = 'START',
  FINISH = 'FINISH',
}

export interface Player {
  id: number;
  name: string;
  color: string;
  position: number;
  isStuck: number; // Rounds remaining stuck
  hasShoes: boolean;
  shoeJumpUsed: boolean; // Tracks if the one-time jump has been used
  skipNextTurn: boolean; // From rescuing someone
  finished: boolean;
}

export interface GameState {
  players: Player[];
  badAlienPosition: number;
  badAlienStunned: number; // Rounds stunned
  alienHeadStart: number; // Rounds before alien appears
  isAlienTurn: boolean; // Tracks if it is the Alien's turn
  gameMode: 'COOP' | 'VERSUS'; // COOP = AI Alien, VERSUS = Player Alien
  currentPlayerIndex: number;
  turnCount: number; // To track rounds
  gameStatus: 'LOBBY' | 'PLAYING' | 'WON' | 'LOST' | 'TRIVIA';
  diceRoll: number | null;
  messageLog: string[];
  triviaQuestion: TriviaData | null;
  triviaBank: TriviaData[]; // Pre-fetched questions
  pendingMovement: number | null; // Used during trivia handling
  selectedBoostTarget: number | null; // For finish line bonus
  selectedPlayerCount: number; // Total participants (including Alien player in Versus)
}

export interface TriviaData {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface BoardNode {
  id: number;
  x: number;
  y: number;
  type: TileType;
}