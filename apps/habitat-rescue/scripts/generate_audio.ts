import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is not set");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function generateIntroSpeech() {
  try {
    console.log("Generating speech...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: "Welcome to Habitat Rescue. Avoid wolves, manage your water, and reach the goal to survive. Good luck!" }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Fenrir" }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const buffer = Buffer.from(base64Audio, 'base64');
      const publicDir = path.join(process.cwd(), 'public');
      
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      
      const filePath = path.join(publicDir, 'intro.wav');
      fs.writeFileSync(filePath, buffer);
      console.log(`Audio saved to ${filePath}`);
    } else {
      console.error("No audio data received");
    }
  } catch (error) {
    console.error("Error generating speech:", error);
  }
}

generateIntroSpeech();
