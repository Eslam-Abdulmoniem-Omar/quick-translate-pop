// TransLingual Content Script
// Injects the overlay into web pages and handles message routing

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__translingual_injected) return;
  window.__translingual_injected = true;

  // Create container for the overlay
  const container = document.createElement('div');
  container.id = 'translingual-root';
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  `;
  
  // Attach shadow DOM for style isolation
  const shadow = container.attachShadow({ mode: 'closed' });
  
  // Create app mount point inside shadow
  const appRoot = document.createElement('div');
  appRoot.id = 'app';
  appRoot.style.cssText = `
    width: 100%;
    height: 100%;
    pointer-events: none;
  `;
  shadow.appendChild(appRoot);
  
  // Inject styles
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('overlay.css');
  shadow.appendChild(styleLink);
  
  // Inject the overlay script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('overlay.js');
  script.type = 'module';
  
  // Add container to page
  document.body.appendChild(container);
  
  // Load the overlay script into the page context
  // We need to communicate via custom events since the script runs in page context
  document.head.appendChild(script);
  
  // Track Alt key state for keyup detection
  let altPressed = false;
  let tPressed = false;
  
  // Listen for keydown to detect Alt+T combination
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Alt') altPressed = true;
    if (e.code === 'KeyT') tPressed = true;
  }, true);
  
  // Listen for keyup to stop recording
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Alt' || e.code === 'KeyT') {
      if (altPressed && tPressed) {
        // Notify background script that key was released
        chrome.runtime.sendMessage({ type: 'KEY_RELEASED' });
      }
      if (e.key === 'Alt') altPressed = false;
      if (e.code === 'KeyT') tPressed = false;
    }
  }, true);
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_RECORDING' || message.type === 'STOP_RECORDING') {
      // Dispatch custom event for the React app to catch
      window.dispatchEvent(new CustomEvent('translingual-message', {
        detail: message
      }));
      sendResponse({ received: true });
    }
    return true;
  });
  
  // Listen for messages from React app
  window.addEventListener('translingual-to-background', (e) => {
    chrome.runtime.sendMessage(e.detail);
  });
  
  console.log('TransLingual: Content script loaded');
})();
