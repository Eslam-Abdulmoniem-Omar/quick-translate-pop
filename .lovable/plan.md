
## Browser Extension Conversion Plan

This plan will convert your translation app into a **Manifest V3 browser extension** for Chrome and Firefox. Users will install it from the browser's extension store, and it will work as an invisible overlay on any webpage.

---

### How It Will Work

1. **User installs the extension** from Chrome Web Store or Firefox Add-ons
2. **Press Alt+T anywhere** in the browser to start recording
3. **Invisible overlay appears** with the mic animation
4. **Release Alt+T** to transcribe and translate
5. **Translation toast appears** with the result
6. **Auto-hides** after 10 seconds
7. **Click extension icon** in toolbar to open Settings popup

---

### Part 1: Extension Manifest

Create `public/manifest.json` with Manifest V3 configuration:

- Extension name, version, description
- Permissions: `activeTab`, `storage`
- Host permissions for backend API calls
- Background service worker
- Content script injection
- Browser action (popup for settings)
- Icons (16px, 48px, 128px)
- Keyboard command: Alt+T

---

### Part 2: Background Service Worker

Create `src/extension/background.ts`:

- Listen for Alt+T keyboard command
- Send message to content script to start/stop recording
- Handle communication between popup and content scripts

---

### Part 3: Content Script (Overlay Injection)

Create `src/extension/content.ts`:

- Inject overlay into any webpage using Shadow DOM (prevents style conflicts)
- Render the existing `VoiceOverlay` component
- Listen for messages from background script
- Handle Alt+T keydown/keyup events for recording control

Create `src/extension/ContentOverlay.tsx`:

- Wrapper component that mounts into Shadow DOM
- Reuses existing `VoiceOverlay`, `AudioWaveform`, `TranslationToast`
- Applies isolated styles

---

### Part 4: Popup (Settings)

Create `src/extension/popup.tsx` and `public/popup.html`:

- Reuse existing `Settings.tsx` component
- Language selection dropdowns
- Settings saved to `chrome.storage.sync` (syncs across devices)

---

### Part 5: Storage Abstraction

Create `src/lib/storage.ts`:

- Unified API that works in both extension and web contexts
- Extension: Uses `chrome.storage.sync`
- Web: Falls back to `localStorage`
- Auto-detects environment

```text
+------------------+     +------------------+
|  Extension Mode  |     |    Web Mode      |
+------------------+     +------------------+
| chrome.storage   |     | localStorage     |
+--------+---------+     +--------+---------+
         |                        |
         +----------+-------------+
                    |
            +-------v-------+
            | storage.ts    |
            | (unified API) |
            +---------------+
```

---

### Part 6: Extension Build Configuration

Create `vite.config.extension.ts`:

- Separate build config for extension
- Multiple entry points:
  - `background.ts` → `dist-extension/background.js`
  - `content.ts` → `dist-extension/content.js`
  - `popup.tsx` → `dist-extension/popup.html`
- Copies `manifest.json` and icons to output

Update `package.json` scripts:

- `build:extension` - Builds the extension
- `build:extension:watch` - Watch mode for development

---

### Part 7: Extension Icons

Create icons in `public/icons/`:

- `icon-16.png` - Toolbar icon
- `icon-48.png` - Extension management
- `icon-128.png` - Chrome Web Store

---

### Files to Create

| File | Purpose |
|------|---------|
| `public/manifest.json` | Extension configuration |
| `public/popup.html` | Settings popup HTML |
| `public/icons/icon-16.png` | Toolbar icon |
| `public/icons/icon-48.png` | Management icon |
| `public/icons/icon-128.png` | Store icon |
| `src/extension/background.ts` | Service worker |
| `src/extension/content.ts` | Content script entry |
| `src/extension/ContentOverlay.tsx` | Overlay component |
| `src/extension/popup.tsx` | Popup entry |
| `src/lib/storage.ts` | Storage abstraction |
| `vite.config.extension.ts` | Extension build config |

---

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add extension build scripts |
| `src/pages/Settings.tsx` | Use storage abstraction |
| `src/pages/Index.tsx` | Use storage abstraction |
| `src/components/VoiceOverlay.tsx` | Minor adjustments for extension context |

---

### Development Workflow

1. Run `npm run build:extension`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → Select `dist-extension` folder
5. Test Alt+T on any webpage

---

### Publishing

**Chrome Web Store:**
1. Create developer account ($5 one-time fee)
2. Zip `dist-extension` folder
3. Upload to Chrome Web Store Dashboard

**Firefox Add-ons:**
1. Create developer account (free)
2. Zip `dist-extension` folder
3. Submit to Firefox Add-ons

---

### Technical Notes

- **Shadow DOM isolation** ensures overlay styles don't conflict with webpage styles
- **Manifest V3** is required for Chrome (Manifest V2 is deprecated)
- **Storage sync** means settings follow the user across devices
- The extension reuses all existing React components and backend edge functions
