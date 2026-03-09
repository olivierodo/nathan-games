# Game Data & Content Management

This document explains how game content is managed in Nathan's Game Arcade.

## Overview

All games use **pre-generated data files** instead of making external API calls. This means:
- ✅ Games work **offline** without internet
- ✅ **No API keys** needed for deployment
- ✅ **Faster builds** (no runtime API calls)
- ✅ Games are **self-contained** and portable

---

## Games & Data Files

### 1. Alien Invasion

**Trivia Data:** `apps/alien-invasion/data/trivia.yaml`

Pre-generated space trivia questions that are loaded at runtime.

**Format:**
```yaml
questions:
  - question: "Which planet is known as the Red Planet?"
    options: ["Venus", "Mars", "Jupiter", "Saturn"]
    correctAnswer: "Mars"
```

**How to Add More:**
1. Edit `apps/alien-invasion/data/trivia.yaml`
2. Add new questions following the same format
3. Run `npm run build:all` to rebuild
4. The service automatically loads and shuffles all questions

**Current Count:** 20 questions

---

### 2. Fruit Escape

**Riddles Data:** `apps/fruit-escape/data/riddles.yaml`

Pre-generated fruit-themed riddles for the escape game.

**Format:**
```yaml
riddles:
  - riddle: "I'm yellow when ripe..."
    options: ["Apple", "Banana", "Orange"]
    answer: "Banana"
    explanation: "Bananas are yellow when ripe!"
```

**How to Add More:**
1. Edit `apps/fruit-escape/data/riddles.yaml`
2. Add new riddles with explanation text
3. The service automatically loads and shuffles
4. Games gracefully handle any number of riddles

**Current Count:** 15 riddles

**Audio:** Currently returns silent audio. To add custom audio:
- Add MP3/WAV files to `apps/fruit-escape/public/audio/`
- Modify `services/geminiService.ts` to load them

---

### 3. Habitat Rescue

**Audio:** `apps/habitat-rescue/public/intro.wav` (static file)

Pre-generated intro speech for the survival game.

**How to Add Custom Audio:**
1. Record or generate intro.wav (16kHz or higher, mono or stereo)
2. Save as `apps/habitat-rescue/public/intro.wav`
3. The service loads it at runtime with fallback if missing

**Current Status:** Uses silent fallback (no audio file included)

**To Generate Custom Intro:**
- Use text-to-speech tool (e.g., Amazon Polly, Google Cloud TTS, ElevenLabs)
- Convert to WAV format
- Drop into public folder
- No rebuild needed! App loads from public folder

---

## Adding New Games

To add a new game to the arcade:

### Step 1: Create Game Folder

```bash
mkdir -p apps/my-game
cd apps/my-game
```

### Step 2: Create Package.json

```json
{
  "name": "my-game",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

### Step 3: Create Data Files (if needed)

```yaml
# apps/my-game/data/content.yaml
items:
  - id: 1
    text: "Content item"
```

### Step 4: Create Vite Config

```typescript
// apps/my-game/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/my-game/',
  plugins: [react()],
});
```

### Step 5: Implement Game

Create `apps/my-game/src/App.tsx` with your game logic.

### Step 6: Update Portal

Add to root `index.html` games array:

```javascript
{
  title: "My Game",
  description: "A fun new game",
  image: "my-game.png",
  url: "/my-game/",
  tags: ["Fun", "Game"],
  date: "2026-03-09",
  isNew: true
}
```

### Step 7: Build

```bash
npm install          # Auto-detects new workspace
npm run build:all    # Builds all apps including new one
```

---

## Data File Formats

### YAML Structure

All game data uses YAML for readability. Example:

```yaml
# Comments are supported
items:
  - id: 1
    name: "Item Name"
    description: "Item details"
    properties:
      key1: "value1"
      key2: "value2"
```

### Loading in Services

**TypeScript:**
```typescript
// Data is stored in YAML but loaded as data constants in the service
const DATA: MyType[] = [
  { /* data */ },
];
```

Currently, YAML files are **reference documentation**. The actual game data is in TypeScript constants. To automate this:

1. Use a YAML loader package (e.g., `js-yaml`)
2. Load at runtime: `const data = yaml.load(require('./data.yaml'))`
3. Or generate TypeScript from YAML at build time

---

## Content Guidelines

### Alien Invasion Trivia

- ✅ Space and astronomy topics
- ✅ Suitable for 9-year-olds
- ✅ Multiple choice (4 options)
- ✅ One clear correct answer
- ❌ Avoid overly difficult concepts
- ❌ Avoid controversial topics

### Fruit Escape Riddles

- ✅ Fruit and nature themes
- ✅ Riddle format with clear answer
- ✅ Include helpful explanation
- ✅ Multiple choice (3 options)
- ❌ Avoid trick questions
- ❌ Avoid ambiguous answers

### Habitat Rescue Audio

- ✅ Encouraging game intro (5-10 seconds)
- ✅ Clear voice, friendly tone
- ✅ 16kHz+ sample rate
- ✅ WAV or MP3 format
- ❌ Avoid loud/startling sounds
- ❌ Avoid excessive background noise

---

## Deployment

### Local Build

```bash
npm run build:all
npm run dev:alien-invasion    # Or other game
```

### GitHub Pages

Push to main branch. GitHub Actions automatically:
1. Installs dependencies
2. Builds all games
3. Collects artifacts to `dist/`
4. Deploys to GitHub Pages

**No API keys needed!**

---

## Troubleshooting

**Q: Game won't load data**
- Check file path in service
- Verify data format matches TypeScript type
- Run `npm run build:all` to rebuild

**Q: Build fails**
- Check YAML syntax (indentation matters)
- Ensure all required fields are present
- Run `npm install` to update dependencies

**Q: Audio not playing**
- Check file exists: `apps/habitat-rescue/public/intro.wav`
- Verify format (WAV, 16kHz+, mono/stereo)
- Browser may require user interaction to play audio

---

## Future Improvements

- [ ] Automate YAML to TypeScript conversion
- [ ] Add admin UI for content management
- [ ] Implement database for dynamic content
- [ ] Add content validation tests
- [ ] Create content template generator
