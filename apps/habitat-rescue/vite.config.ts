import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';
import { GoogleGenAI } from "@google/genai";

const generateAudioPlugin = (apiKey) => ({
  name: 'generate-audio',
  async buildStart() {
    const logPath = path.resolve('debug.log');
    const log = (msg) => fs.appendFileSync(logPath, msg + '\n');
    
    log('Plugin started');
    if (!apiKey) {
      log('GEMINI_API_KEY not found');
      return;
    }
    log(`API Key found: length=${apiKey.length}, start=${apiKey.substring(0, 4)}`);

    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    const filePath = path.join(publicDir, 'intro.wav');
    if (fs.existsSync(filePath)) {
      log('Audio file already exists');
      return;
    }

    log('Generating intro audio...');
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
        log(`Audio saved to ${filePath}`);
      } else {
        log("No audio data received");
      }
    } catch (error) {
      log(`Error: ${error.message}`);
    }
  }
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // Also check process.env for system variables
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  return {
    base: '/habitat-rescue/',
    plugins: [
      react(),
      tailwindcss(),
      generateAudioPlugin(apiKey)
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
