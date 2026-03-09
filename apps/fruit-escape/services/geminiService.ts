import { RiddleData } from "../types";

// Pre-generated fruit and nature riddles
const RIDDLE_POOL: RiddleData[] = [
  {
    riddle: "I'm a yellow fruit that monkeys love. I have no bones but am very soft. What am I?",
    options: ["Banana", "Orange", "Apple"],
    answer: "Banana",
    explanation: "Bananas are yellow and soft fruit that monkeys are famous for eating!"
  },
  {
    riddle: "I'm red and round, often found in a bowl. I keep the doctor away. What am I?",
    options: ["Apple", "Cherry", "Strawberry"],
    answer: "Apple",
    explanation: "The saying goes 'An apple a day keeps the doctor away!'"
  },
  {
    riddle: "I'm orange and full of vitamin C. I'm segmented like a puzzle. What am I?",
    options: ["Orange", "Pumpkin", "Carrot"],
    answer: "Orange",
    explanation: "Oranges have segments and are packed with vitamin C!"
  },
  {
    riddle: "I'm small and purple, I stain your fingers. I grow in bunches on a vine. What am I?",
    options: ["Grape", "Blueberry", "Plum"],
    answer: "Grape",
    explanation: "Grapes grow in bunches and can stain your hands purple!"
  },
  {
    riddle: "I'm a tropical fruit with a crown on top. I'm prickly outside but sweet inside. What am I?",
    options: ["Pineapple", "Mango", "Papaya"],
    answer: "Pineapple",
    explanation: "Pineapples have a crown-like top and a spiky exterior!"
  },
  {
    riddle: "I'm pink or red inside, but black and white outside. I'm refreshing on a hot day. What am I?",
    options: ["Watermelon", "Pomegranate", "Dragon Fruit"],
    answer: "Watermelon",
    explanation: "Watermelons are perfect summer fruits with sweet pink flesh!"
  },
  {
    riddle: "I'm small and red, with seeds on the outside. I grow on bushes and am very sweet. What am I?",
    options: ["Strawberry", "Raspberry", "Cherry"],
    answer: "Strawberry",
    explanation: "Strawberries have seeds on the outside and are deliciously sweet!"
  },
  {
    riddle: "I'm green on the outside, but brown inside. I'm hairy and from tropical places. What am I?",
    options: ["Kiwi", "Avocado", "Coconut"],
    answer: "Kiwi",
    explanation: "Kiwis are fuzzy fruits with brown and green coloring!"
  },
  {
    riddle: "I'm yellow when ripe and very creamy. I have a large pit in the middle. What am I?",
    options: ["Avocado", "Banana", "Papaya"],
    answer: "Avocado",
    explanation: "Avocados are creamy fruits with a large central pit!"
  },
  {
    riddle: "I'm dark purple and round. I grow on thorny bushes. What am I?",
    options: ["Blackberry", "Blueberry", "Plum"],
    answer: "Blackberry",
    explanation: "Blackberries are purple and grow on prickly bushes!"
  },
  {
    riddle: "I'm white inside and brown outside. I come from coconut palms. What am I?",
    options: ["Coconut", "Kiwi", "Walnut"],
    answer: "Coconut",
    explanation: "Coconuts have a brown exterior and white flesh inside!"
  },
  {
    riddle: "I'm sour and yellow. I'm cut into slices for drinks. What am I?",
    options: ["Lemon", "Lime", "Grapefruit"],
    answer: "Lemon",
    explanation: "Lemons are sour yellow citrus fruits great for lemonade!"
  },
  {
    riddle: "I'm blue and small. I grow in clusters on bushes. What am I?",
    options: ["Blueberry", "Blackberry", "Grape"],
    answer: "Blueberry",
    explanation: "Blueberries are small blue berries that grow on bushes!"
  },
  {
    riddle: "I'm bumpy and brown on the outside. I'm spiky and sweet inside. What am I?",
    options: ["Pineapple", "Durian", "Rambutan"],
    answer: "Pineapple",
    explanation: "Pineapples have a bumpy brown exterior and sweet yellow flesh!"
  },
  {
    riddle: "I'm pale green and pear-shaped. I have a large pit. What am I?",
    options: ["Avocado", "Pear", "Kiwi"],
    answer: "Avocado",
    explanation: "Avocados are creamy green fruits with a big central pit!"
  }
];

// Shuffle array helper
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Load riddles from pre-generated data (no API calls needed)
export async function generateAllRiddles(traps: Array<{id: number, type: 'MISSILE' | 'BOMB'}>): Promise<Array<RiddleData & {squareId: number}>> {
  const shuffled = shuffleArray(RIDDLE_POOL);
  return traps.map((trap, index) => ({
    squareId: trap.id,
    ...shuffled[index % shuffled.length]
  }));
}

// Silent audio fallback (no TTS needed)
export async function generateAudio(text: string, audioContext: AudioContext): Promise<AudioBuffer | null> {
  // Return empty audio buffer (silent)
  // Games can still play without audio
  try {
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    return buffer;
  } catch (error) {
    console.warn("Audio not available:", error);
    return null;
  }
}
