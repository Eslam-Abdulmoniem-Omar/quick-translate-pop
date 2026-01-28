// TransLingual Background Service Worker
// Handles keyboard shortcuts and message routing

// Track key state for start/stop recording
let isRecording = false;

// Listen for extension commands (Alt+T)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'start-recording') {
    // Send start message to active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        if (!isRecording) {
          isRecording = true;
          chrome.tabs.sendMessage(tabs[0].id, { type: 'START_RECORDING' });
        }
      }
    });
  }
});

// Listen for key release to stop recording
// Note: Chrome extensions can't directly listen for keyup, so we use a workaround
// The content script will detect keyup and send a message back
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KEY_RELEASED') {
    if (isRecording) {
      isRecording = false;
      // Broadcast stop to the tab that sent the message
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'STOP_RECORDING' });
      }
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(['translingual-source-lang', 'translingual-target-lang'], (result) => {
      sendResponse({
        sourceLanguage: result['translingual-source-lang'] || 'en',
        targetLanguage: result['translingual-target-lang'] || 'ar'
      });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'SAVE_SETTINGS') {
    chrome.storage.sync.set({
      'translingual-source-lang': message.sourceLanguage,
      'translingual-target-lang': message.targetLanguage
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'RECORDING_STOPPED') {
    isRecording = false;
    sendResponse({ success: true });
    return true;
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default languages on first install
    chrome.storage.sync.set({
      'translingual-source-lang': 'en',
      'translingual-target-lang': 'ar'
    });
    console.log('TransLingual extension installed with default settings');
  }
});
