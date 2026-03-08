import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyC-ZomYCj4xlSaTeK8pq1EJo8_jusleO8k" });

export async function generateIntroSpeech(): Promise<ArrayBuffer | null> {
	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash-preview-tts",
			contents: [{ parts: [{ text: "Welcome to Habitat Rescue. Avoid wolves, manage your water, and reach the goal to survive. Good luck!" }] }],
			config: {
				responseModalities: ["AUDIO"],
				speechConfig: {
					voiceConfig: {
						prebuiltVoiceConfig: { voiceName: "Fenrir" }, // Deep, serious voice for survival game
					},
				},
			},
		});

		const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
		if (base64Audio) {
			// Convert base64 to ArrayBuffer
			const binaryString = window.atob(base64Audio);
			const len = binaryString.length;
			const bytes = new Uint8Array(len);
			for (let i = 0; i < len; i++) {
				bytes[i] = binaryString.charCodeAt(i);
			}
			return bytes.buffer;
		}
		return null;
	} catch (error) {
		console.error("Error generating speech:", error);
		return null;
	}
}
