import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RiddleData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const GUARDIAN_PERSONAS = [
  "a grumpy old Oak Tree who loves puns",
  "a hyperactive Squirrel who talks very fast",
  "a wise and sparkly Dragonfly",
  "a mysterious glowing Mushroom from the deep woods",
  "a friendly but competitive Strawberry who wants to see you win"
];

export async function generateAllRiddles(traps: Array<{id: number, type: 'MISSILE' | 'BOMB'}>): Promise<Array<RiddleData & {squareId: number}>> {
  const persona = GUARDIAN_PERSONAS[Math.floor(Math.random() * GUARDIAN_PERSONAS.length)];
  const trapList = traps.map(t => `Square ${t.id} (${t.type})`).join(", ");
  
  const prompt = `Act as ${persona}. You are a guardian in the Orchard of Destiny.
  I need riddles for a board game with ${traps.length} specific traps.
  Generate exactly one unique nature/fruit-themed riddle for each of the following trap locations: ${trapList}.
  
  For each riddle:
  1. It must be a multiple choice question with exactly 3 distinct options.
  2. One option must be the correct answer. 
  3. Include a fun, helpful explanation for why the answer is correct.
  4. Ensure they are suitable for children.
  
  Return the response as a JSON array of objects, where each object has 'squareId' (matching the input) and the riddle fields.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              squareId: { type: Type.INTEGER },
              riddle: { type: Type.STRING },
              options: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              answer: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["squareId", "riddle", "options", "answer", "explanation"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Error generating all riddles:", error);
    // Fallback: Return some basic ones if the API fails
    return traps.map(t => ({
      squareId: t.id,
      riddle: "I'm a fruit that's red and round, often found upon the ground. I have a core but no heart. What am I?",
      options: ["Apple", "Orange", "Banana"],
      answer: "Apple",
      explanation: "Apples are crisp and delicious orchard favorites!"
    }));
  }
}

export async function generateAudio(text: string, audioContext: AudioContext): Promise<AudioBuffer | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly and with a magical forest character voice: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(arrayBuffer);
      const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
    }
  } catch (error) {
    console.error("TTS generation failed", error);
  }
  return null;
}