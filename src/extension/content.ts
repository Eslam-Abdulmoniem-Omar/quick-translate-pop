/// <reference types="chrome" />

// Content script - injects the overlay into webpages using Shadow DOM
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { ContentOverlay } from './ContentOverlay';

// Create container and shadow DOM
function initOverlay() {
  // Prevent double initialization
  if (document.getElementById('translingual-extension-root')) {
    return;
  }

  // Create host element
  const host = document.createElement('div');
  host.id = 'translingual-extension-root';
  host.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483647;
    pointer-events: none;
  `;
  document.body.appendChild(host);

  // Create shadow DOM for style isolation
  const shadow = host.attachShadow({ mode: 'closed' });

  // Inject styles into shadow DOM
  const styles = document.createElement('style');
  styles.textContent = getOverlayStyles();
  shadow.appendChild(styles);

  // Create React root container
  const container = document.createElement('div');
  container.id = 'translingual-overlay';
  shadow.appendChild(container);

  // Mount React app
  const root = createRoot(container);
  root.render(createElement(ContentOverlay));
}

// Get the CSS styles for the overlay
function getOverlayStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :host {
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* CSS Variables - Dark theme for overlay */
    :root, #translingual-overlay {
      --background: 224 25% 8%;
      --foreground: 210 20% 98%;
      --card: 224 25% 11%;
      --card-foreground: 210 20% 98%;
      --popover: 224 25% 11%;
      --popover-foreground: 210 20% 98%;
      --primary: 262 83% 65%;
      --primary-foreground: 0 0% 100%;
      --secondary: 224 20% 15%;
      --secondary-foreground: 210 20% 98%;
      --muted: 224 20% 15%;
      --muted-foreground: 215 15% 55%;
      --accent: 262 83% 65%;
      --accent-foreground: 0 0% 100%;
      --destructive: 0 72% 51%;
      --destructive-foreground: 0 0% 100%;
      --border: 224 20% 18%;
      --input: 224 20% 18%;
      --ring: 262 83% 65%;
      --radius: 0.75rem;
    }

    #translingual-overlay {
      font-family: 'Inter', system-ui, sans-serif;
      color: hsl(var(--foreground));
    }

    /* Glass effect */
    .glass-effect {
      background: hsl(var(--background) / 0.9);
      backdrop-filter: blur(12px);
    }

    /* Animations */
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .animate-spin-slow {
      animation: spin-slow 1s linear infinite;
    }

    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .animate-slide-up {
      animation: slide-up 0.15s ease-out;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .animate-fade-in {
      animation: fade-in 0.15s ease-out;
    }

    /* Button styles */
    button {
      cursor: pointer;
      font-family: inherit;
    }

    button:focus {
      outline: 2px solid hsl(var(--ring));
      outline-offset: 2px;
    }
  `;
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_RECORDING') {
    const event = new CustomEvent('translingual-start-recording');
    document.dispatchEvent(event);
    sendResponse({ success: true });
  }
  return true;
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOverlay);
} else {
  initOverlay();
}

export {};
