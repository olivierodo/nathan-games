import { GoogleGenAI, Type } from "@google/genai";
import { TriviaData } from "../types";

const apiKey = process.env.API_KEY || '';

// Expanded Mock trivia to prevent repetition
const MOCK_TRIVIA_BATCH: TriviaData[] = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars"
  },
  {
    question: "What is the name of our galaxy?",
    options: ["Andromeda", "Milky Way", "Whirlpool", "Sombrero"],
    correctAnswer: "Milky Way"
  },
  {
    question: "Who was the first person to walk on the moon?",
    options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "Michael Collins"],
    correctAnswer: "Neil Armstrong"
  },
  {
    question: "Which planet is the largest in our solar system?",
    options: ["Mars", "Jupiter", "Saturn", "Neptune"],
    correctAnswer: "Jupiter"
  },
  {
    question: "What gives Mars its red color?",
    options: ["Fire", "Iron Rust", "Red Plants", "Volcanoes"],
    correctAnswer: "Iron Rust"
  },
  {
    question: "Which planet has beautiful rings around it?",
    options: ["Mars", "Venus", "Saturn", "Mercury"],
    correctAnswer: "Saturn"
  },
  {
    question: "What star is at the center of our solar system?",
    options: ["The Moon", "Alpha Centauri", "The Sun", "Betelgeuse"],
    correctAnswer: "The Sun"
  },
  {
    question: "How many moons does Earth have?",
    options: ["One", "Two", "Three", "None"],
    correctAnswer: "One"
  },
  {
    question: "What force keeps us on the ground?",
    options: ["Magnetism", "Gravity", "Friction", "Magic"],
    correctAnswer: "Gravity"
  },
  {
    question: "Which is the hottest planet in our solar system?",
    options: ["Mercury", "Mars", "Venus", "Jupiter"],
    correctAnswer: "Venus"
  },
  {
    question: "Humans have sent rovers to explore which planet?",
    options: ["Mars", "Jupiter", "Neptune", "Saturn"],
    correctAnswer: "Mars"
  },
  {
    question: "What is the closest planet to the Sun?",
    options: ["Earth", "Venus", "Mercury", "Mars"],
    correctAnswer: "Mercury"
  },
  {
    question: "Which planet is known as the 'Blue Planet'?",
    options: ["Neptune", "Uranus", "Earth", "Mars"],
    correctAnswer: "Earth"
  },
  {
    question: "What do astronauts wear in space?",
    options: ["Swimsuits", "Space Suits", "Lab Coats", "Pajamas"],
    correctAnswer: "Space Suits"
  },
  {
    question: "What is the Great Red Spot on Jupiter?",
    options: ["A Volcano", "A Lake", "A Storm", "A Mountain"],
    correctAnswer: "A Storm"
  },
  {
    question: "Which planet spins on its side?",
    options: ["Uranus", "Mars", "Earth", "Jupiter"],
    correctAnswer: "Uranus"
  },
  {
    question: "What is a shooting star?",
    options: ["A Star", "A Comet", "A Meteor", "A Planet"],
    correctAnswer: "A Meteor"
  },
  {
    question: "Which planet is no longer considered a planet?",
    options: ["Pluto", "Mars", "Neptune", "Mercury"],
    correctAnswer: "Pluto"
  },
  {
    question: "How long does it take Earth to orbit the Sun?",
    options: ["1 Day", "1 Month", "1 Year", "10 Years"],
    correctAnswer: "1 Year"
  },
  {
    question: "What is the dark side of the moon?",
    options: ["The side facing away from Earth", "The side without sun", "A band", "A movie"],
    correctAnswer: "The side facing away from Earth"
  }
];

// Helper to shuffle array
const shuffleArray = (array: TriviaData[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const fetchSpaceTriviaBatch = async (count: number): Promise<TriviaData[]> => {
  if (!apiKey) {
    console.warn("No API Key found, using mock trivia.");
    // Return a shuffled list of mock trivia
    const shuffled = shuffleArray(MOCK_TRIVIA_BATCH);
    // Cycle if we need more than available
    const result = [];
    for(let i=0; i<count; i++) {
        result.push(shuffled[i % shuffled.length]);
    }
    return result;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} distinct, fun, and easy space-themed trivia questions for a 9-year-old kid. For each question provide 4 short options and the correct answer. Output as a JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of 4 possible answers" 
              },
              correctAnswer: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text) as TriviaData[];
      return data;
    }
    return shuffleArray(MOCK_TRIVIA_BATCH);
  } catch (error) {
    console.error("Error fetching trivia batch:", error);
    // Fallback logic
    const shuffled = shuffleArray(MOCK_TRIVIA_BATCH);
    const result = [];
    for(let i=0; i<count; i++) {
        result.push(shuffled[i % shuffled.length]);
    }
    return result;
  }
};

// Deprecated single fetch (kept for compatibility if needed, but unused)
export const fetchSpaceTrivia = async (): Promise<TriviaData> => {
    return MOCK_TRIVIA_BATCH[0];
};