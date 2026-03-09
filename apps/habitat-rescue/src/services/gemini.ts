// Habitat Rescue - No API calls needed
// Audio generation moved to build-time static assets

export async function generateIntroSpeech(): Promise<ArrayBuffer | null> {
  // Load pre-generated intro audio from public/intro.wav
  try {
    const response = await fetch('/habitat-rescue/intro.wav');
    if (!response.ok) {
      console.warn("Intro audio not found, continuing without it");
      return null;
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.warn("Could not load intro audio:", error);
    return null;
  }
}
