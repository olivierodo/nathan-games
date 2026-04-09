# Nathan's Arcade -- Tablet PWA & Play Store Design

**Date:** 2026-04-09
**Status:** Approved
**Approach:** PWA + TWA (Progressive Web App with Trusted Web Activity for Play Store)

## Problem

Nathan's games are deployed at nathan-game.com but kids can't easily access them at home. They need to remember a URL and type it into a browser -- too much friction for young kids. We need every kid to be able to find, install, and play the games on whatever device they have (iPad, Android tablet, phone, computer) with offline support.

## Goals

- One unified "Nathan's Arcade" app experience across all devices
- Offline play after first visit (important -- some kids don't have reliable internet)
- Play Store listing for Android discoverability
- Multiple sharing mechanisms: QR codes, in-app share button, word of mouth
- Minimal deployment/maintenance overhead -- keep using GitHub Pages

## Non-Goals

- iOS App Store listing (too expensive and complex for the value)
- Push notifications
- User accounts or analytics
- New game features or gameplay changes
- Backend or server infrastructure

---

## 1. PWA Foundation

### Web App Manifest

A `manifest.json` at the root makes the site installable as an app.

- **App name:** "Nathan's Arcade" (short name: "Arcade")
- **Display mode:** `standalone` -- hides browser chrome, feels like a native app
- **Orientation:** `any` -- works in portrait and landscape
- **Theme/background colors:** match the existing portal design
- **Icons:** 192px, 512px, and maskable variants for Android adaptive icons
- **Start URL:** `/` (the portal page)
- **Scope:** `/` (all games under one PWA)

### Service Worker

Registered from the portal page. Manages caching for offline play.

**Caching strategy:**
- **Precache (on install):** portal HTML, CSS, JS, manifest, icons, shared assets
- **Lazy cache (on first open):** each game's bundle, CSS, and data files (trivia.yaml, riddles, etc.) are cached when the kid first plays that game
- **Update strategy:** stale-while-revalidate -- serve cached version instantly, fetch updates in background. Updated version is ready on next app open.

**Cache size:** All 4 games are React DOM with no heavy assets (sound is Web Audio API synthesis). Total cache well under 5MB.

**Offline fallback:** Games that haven't been opened yet show a friendly message: "Play this game once while online to unlock offline play."

### Install Experience

- Custom install banner on the portal page for browsers that support `beforeinstallprompt`
- For iOS: clear instructions with visual guide ("Tap Share > Add to Home Screen")
- After install: app launches fullscreen with splash screen and app icon, no browser bar

---

## 2. Tablet-Friendly Touch & Layout

### Portal Page

- Large, tappable game cards with existing screenshots from `/assets/`
- Responsive grid: 2 columns on tablet, 1 column on phone
- Minimum 48px touch targets on all interactive elements
- No hover-dependent interactions -- everything responds to tap

### Per-Game Touch Improvements

Each of the 4 games needs an audit and touch pass:

- Replace keyboard-only controls with on-screen touch buttons (e.g., Dino Escape grid navigation)
- All interactions (dice rolls, selections, actions) work via tap
- Increase button and interactive element sizes for kid-sized fingers
- Viewport meta already present -- ensure proper scaling
- Handle both portrait and landscape gracefully

### Kid-Friendly UX Polish

- Larger fonts for tablet readability
- Clear visual feedback on tap (button press animation)
- "Back to Arcade" button in every game for easy navigation
- No tiny text or cramped layouts

---

## 3. Sharing & Discoverability

### QR Code

- Generated QR code pointing to `nathan-game.com`
- Printable card/sticker design Nathan can hand out at school
- QR code also shown on the portal page so kids can show their screen to a friend

### Web Share API

- Share button on the portal page and inside each game
- Uses native Web Share API (opens device share sheet: WhatsApp, Messages, email, etc.)
- Fallback: copy-link-to-clipboard for unsupported browsers
- Share message includes app name and URL, with deep link to specific game when sharing from within a game

### Play Store Listing (TWA)

- Wrap the PWA as a Trusted Web Activity using Google's Bubblewrap CLI
- Generates an Android APK that loads nathan-game.com in a chrome-less browser
- Digital Asset Links file (`assetlinks.json`) hosted on the site for domain verification
- One-time $25 Google Play Developer account fee
- Kids/parents search "Nathan's Arcade" on Play Store and install
- Updates are automatic -- deploy to GitHub Pages, TWA loads the latest

### iOS Strategy

- No App Store listing (avoids $99/year and review process)
- iOS kids use PWA "Add to Home Screen" -- guided by QR code landing and in-app instructions
- PWA on iOS provides fullscreen standalone experience with app icon

---

## 4. Project Structure

### New Files

```
root/
├── manifest.json                  # PWA manifest (root level, alongside index.html)
├── sw.js                          # Service Worker (root level for full scope)
├── icons/                         # App icons (192, 512, maskable)
├── .well-known/
│   └── assetlinks.json            # Digital Asset Links for TWA verification
├── twa/                           # TWA config for Play Store (not deployed)
│   ├── build.gradle
│   └── ...
└── assets/
    └── qr-code.svg                # Printable QR code
```

Note: `manifest.json` and `sw.js` must be at root level because the portal `index.html` is at root and the service worker's scope must cover all game paths (`/alien-invasion/`, `/dino-escape/`, etc.). The build script must copy `.well-known/assetlinks.json` to `dist/` for TWA verification.

### Modified Files

```
├── index.html                     # Add manifest link, install banner, share button
├── scripts/collect-dist.mjs       # Copy manifest, sw.js, icons, .well-known/ to dist
├── .github/workflows/             # Minor: ensure new files are included in deploy
├── apps/alien-invasion/           # Touch/tablet UI pass
├── apps/fruit-escape/             # Touch/tablet UI pass
├── apps/habitat-rescue/           # Touch/tablet UI pass
└── apps/dino-escape/              # Touch/tablet UI pass
```

### What Stays the Same

- Vite build pipeline -- no changes
- GitHub Pages hosting -- no changes
- GitHub Actions workflow -- only minor additions
- Game logic -- untouched, only UI/touch adjustments

---

## 5. Implementation Scope

| Work Item | Effort |
|-----------|--------|
| PWA manifest + icons | Low |
| Service worker with caching | Medium |
| Install banner + iOS instructions | Low |
| Portal page tablet layout | Low |
| Touch/tablet audit per game (x4) | Medium each |
| Share button (Web Share API) | Low |
| QR code generation + printable card | Low |
| TWA setup + Play Store listing | Medium |

**Total estimated scope:** 5 work items at low effort, 5 at medium effort. No high-effort items -- this is all incremental on top of a working codebase.
