/// <reference types="chrome" />

// Background service worker for the browser extension

// Listen for the Alt+T command from manifest
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'start-recording') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'START_RECORDING' });
    }
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get({
      'translingual-source-lang': 'en',
      'translingual-target-lang': 'ar'
    }, (result) => {
      sendResponse(result);
    });
    return true; // Indicates async response
  }
  
  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set(message.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Install handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.sync.set({
      'translingual-source-lang': 'en',
      'translingual-target-lang': 'ar'
    });
  }
});

export {};
