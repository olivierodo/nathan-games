import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

export function generateAudioPlugin(apiKey: string) {
  return {
    name: 'generate-audio',
    async buildStart() {
      if (!apiKey) {
        console.warn('GEMINI_API_KEY not found, skipping audio generation');
        return;
      }

      const publicDir = path.resolve('public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }

      const filePath = path.join(publicDir, 'intro.wav');
      if (fs.existsSync(filePath)) {
        console.log('Audio file already exists, skipping generation');
        return;
      }

      console.log('Generating intro audio...');
      try {
        const ai = new GoogleGenAI({ apiKey });
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
          fs.writeFileSync(filePath, buffer);
          console.log(`Audio saved to ${filePath}`);
        } else {
          console.error("No audio data received from Gemini API");
        }
      } catch (error) {
        console.error("Error generating audio:", error);
      }
    }
  };
}
