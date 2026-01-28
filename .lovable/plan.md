

# Convert TransLingual to Browser Extension

## Overview

Transform your TransLingual voice translation app into a lightweight Chrome/Firefox browser extension while preserving the invisible overlay UX and Alt+T keyboard shortcut.

---

## Current State

Your app has:
- Invisible overlay (visible only during recording/results)
- Alt+T keyboard shortcut for voice recording
- Voice transcription via OpenAI Whisper (backend function)
- Translation via Lovable AI (backend function)
- Settings page at `/settings`
- Electron desktop app code (to be removed)

---

## Part 1: Fix Build Error

**Issue:** Missing `build:dev` script causing build failures.

| File | Change |
|------|--------|
| `package.json` | Add `"build:dev": "vite build --mode development"` to scripts |

---

## Part 2: Remove Electron Dependencies

The following files and dependencies will be removed to make the app lightweight:

### Files to Delete

| File | Reason |
|------|--------|
| `electron/main.ts` | Electron main process |
| `electron/preload.ts` | Electron IPC bridge |
| `tsconfig.electron.json` | Electron TypeScript config |

### Dependencies to Remove

| Package | Type |
|---------|------|
| `electron` | devDependency |
| `electron-builder` | devDependency |
| `concurrently` | devDependency |
| `wait-on` | devDependency |
| `uiohook-napi` | devDependency |

### Scripts to Remove

| Script | Reason |
|--------|--------|
| `compile:electron` | Electron build |
| `dev:electron` | Electron dev |
| `build:electron` | Electron build |
| `package` | Electron packaging |

Also remove the entire `"build"` section (electron-builder config) from package.json.

---

## Part 3: Create Extension Structure

### Extension Manifest (Manifest V3)

**File:** `extension/manifest.json`

```text
extension/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (keyboard commands)
├── content.js         # Injected script for overlay
├── content.css        # Styles for injected overlay
├── popup.html         # Settings popup
├── popup.js           # Settings logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

The manifest will configure:
- **Commands:** Alt+T to trigger recording
- **Permissions:** `activeTab`, `storage`
- **Host permissions:** Supabase API endpoint
- **Content scripts:** Inject overlay into pages
- **Action:** Popup for settings

---

## Part 4: Extension Components

### 4.1 Background Service Worker

Handles the Alt+T command and sends messages to content scripts:

- Listen for `chrome.commands.onCommand`
- On "start-recording" command, send message to active tab
- On "stop-recording" (key release detected), send stop message

### 4.2 Content Script

Injects the React overlay into web pages:

- Create isolated container with Shadow DOM (prevents style conflicts)
- Load the bundled overlay component
- Listen for messages from background script
- Forward recording events to overlay

### 4.3 Settings Popup

Reuses the existing Settings component:

- Opens when clicking extension icon
- Source/target language selection
- Uses `chrome.storage.sync` for cross-device persistence

---

## Part 5: Code Modifications

### 5.1 Storage Abstraction Layer

**New File:** `src/lib/storage.ts`

Creates a unified storage API that works in both web and extension contexts:

```text
┌─────────────────────────────┐
│      storage.get/set        │
└─────────────────────────────┘
         │
         ├── Extension? → chrome.storage.sync
         │
         └── Web? → localStorage
```

### 5.2 Update VoiceOverlay.tsx

Changes needed:
- Remove `window.electron` IPC listener block (lines 140-167)
- Add Chrome extension message listener
- Keep existing keyboard handlers as fallback for web version

New message handling:

```text
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'START_RECORDING') → startRecording()
  if (message.type === 'STOP_RECORDING') → stopRecording()
});
```

### 5.3 Update TranslationToast.tsx

Remove Electron-specific calls:
- Remove `window.electron?.setOverlayInteractive` calls (lines 28, 49, 58, 62)

### 5.4 Update Settings.tsx

Replace localStorage with storage abstraction:
- Import from `@/lib/storage`
- Use async storage.get/set methods
- Works in both web and extension contexts

### 5.5 Update global.d.ts

Add Chrome extension type declarations:
- `chrome.runtime.onMessage`
- `chrome.storage.sync`
- Keep Window interface for backward compatibility

---

## Part 6: Build Configuration

### 6.1 Extension Build Config

**New File:** `vite.config.extension.ts`

Configures Vite to build extension-specific bundles:

```text
Build Outputs:
├── dist-extension/
│   ├── overlay.js       # React overlay bundle
│   ├── popup.js         # Settings popup bundle
│   ├── popup.html       # Popup HTML
│   ├── background.js    # Service worker
│   ├── content.js       # Content script
│   ├── content.css      # Styles
│   ├── manifest.json    # Extension manifest
│   └── icons/           # Extension icons
```

### 6.2 New NPM Scripts

| Script | Description |
|--------|-------------|
| `build:dev` | Development build (fixes current error) |
| `build:extension` | Build extension package |

---

## Part 7: Entry Points

### 7.1 Overlay Entry

**New File:** `src/extension/overlay.tsx`

Mounts VoiceOverlay component for content script injection.

### 7.2 Popup Entry

**New File:** `src/extension/popup.tsx`

Renders Settings component in extension popup.

---

## File Summary

| Action | File |
|--------|------|
| Delete | `electron/main.ts` |
| Delete | `electron/preload.ts` |
| Delete | `tsconfig.electron.json` |
| Modify | `package.json` - Remove Electron deps, add extension scripts |
| Modify | `src/components/VoiceOverlay.tsx` - Add extension messaging |
| Modify | `src/components/TranslationToast.tsx` - Remove Electron calls |
| Modify | `src/pages/Settings.tsx` - Use storage abstraction |
| Modify | `src/global.d.ts` - Add Chrome types |
| Create | `src/lib/storage.ts` - Cross-platform storage |
| Create | `extension/manifest.json` - Extension config |
| Create | `extension/background.js` - Service worker |
| Create | `extension/content.js` - Overlay injector |
| Create | `extension/content.css` - Overlay styles |
| Create | `extension/popup.html` - Settings popup HTML |
| Create | `src/extension/overlay.tsx` - Overlay entry |
| Create | `src/extension/popup.tsx` - Popup entry |
| Create | `vite.config.extension.ts` - Extension build config |
| Create | `extension/icons/` - Extension icons (16, 48, 128px) |

---

## Testing the Extension

After implementation:

1. Run `npm run build:extension`
2. Open Chrome > `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist-extension` folder
6. Visit any webpage
7. Press Alt+T to test recording
8. Click extension icon for settings

---

## Architecture Diagram

```text
┌────────────────────────────────────────────────────────────┐
│                    Browser Extension                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ Background.js    │      │ Popup (Settings) │           │
│  │ (Service Worker) │      │                  │           │
│  │                  │      │ - Source Lang    │           │
│  │ - Alt+T Command  │      │ - Target Lang    │           │
│  │ - Message Router │      │ - Swap Button    │           │
│  └────────┬─────────┘      └──────────────────┘           │
│           │                                                │
│           │ chrome.tabs.sendMessage                        │
│           ▼                                                │
│  ┌──────────────────────────────────────────────┐         │
│  │ Content Script (Injected into pages)         │         │
│  │                                              │         │
│  │  ┌────────────────────────────────────────┐  │         │
│  │  │ Shadow DOM Container                   │  │         │
│  │  │                                        │  │         │
│  │  │  ┌────────────────────────────────┐   │  │         │
│  │  │  │ VoiceOverlay (React)           │   │  │         │
│  │  │  │                                │   │  │         │
│  │  │  │ - Waveform Animation           │   │  │         │
│  │  │  │ - Processing Spinner           │   │  │         │
│  │  │  │ - Translation Toast            │   │  │         │
│  │  │  └────────────────────────────────┘   │  │         │
│  │  └────────────────────────────────────────┘  │         │
│  └──────────────────────────────────────────────┘         │
│                            │                               │
└────────────────────────────┼───────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │   Lovable Cloud Backend      │
              │                              │
              │ - /transcribe (Whisper API)  │
              │ - /translate (Lovable AI)    │
              └──────────────────────────────┘
```

---

## Notes

- The web version at `/` will continue to work for non-extension use
- Settings sync across devices via `chrome.storage.sync`
- Shadow DOM ensures overlay styles don't conflict with host pages
- Alt+T shortcut works globally on any webpage
- Firefox support can be added later with minimal changes (WebExtensions API is compatible)

