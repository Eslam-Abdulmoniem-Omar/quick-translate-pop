/// <reference types="chrome" />
// Extension overlay entry point
// Mounts the VoiceOverlay component for content script injection

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { VoiceOverlay } from '@/components/VoiceOverlay';
import { settings } from '@/lib/storage';
import '@/index.css';

// Type guard for chrome extension environment
const isExtension = typeof chrome !== 'undefined' && 
  typeof chrome.storage !== 'undefined';

function ExtensionOverlay() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ar');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load settings from storage
    settings.getLanguages().then(({ source, target }) => {
      setSourceLanguage(source);
      setTargetLanguage(target);
      setIsLoaded(true);
    });

    // Listen for storage changes (when user updates settings in popup)
    if (isExtension && chrome.storage.onChanged) {
      const handleStorageChange = () => {
        settings.getLanguages().then(({ source, target }) => {
          setSourceLanguage(source);
          setTargetLanguage(target);
        });
      };

      chrome.storage.onChanged.addListener(handleStorageChange);
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };
    }
  }, []);

  if (!isLoaded) return null;

  return (
    <VoiceOverlay 
      sourceLanguage={sourceLanguage} 
      targetLanguage={targetLanguage} 
    />
  );
}

// Mount to shadow DOM root if available, otherwise to regular DOM
const rootElement = document.getElementById('translingual-overlay') || 
                   document.getElementById('app') ||
                   document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ExtensionOverlay />
    </React.StrictMode>
  );
}
