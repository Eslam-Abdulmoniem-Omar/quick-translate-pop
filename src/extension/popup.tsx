/// <reference types="chrome" />

// Extension popup entry point - reuses Settings component
import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { LANGUAGES } from '@/lib/languages';
import '@/index.css';

function PopupSettings() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ar');
  const [loaded, setLoaded] = useState(false);

  // Load settings from chrome storage
  useEffect(() => {
    chrome.storage.sync.get({
      'translingual-source-lang': 'en',
      'translingual-target-lang': 'ar',
    }, (result: Record<string, string>) => {
      setSourceLanguage(result['translingual-source-lang']);
      setTargetLanguage(result['translingual-target-lang']);
      setLoaded(true);
    });
  }, []);

  // Save settings on change
  useEffect(() => {
    if (loaded) {
      chrome.storage.sync.set({
        'translingual-source-lang': sourceLanguage,
        'translingual-target-lang': targetLanguage,
      });
    }
  }, [sourceLanguage, targetLanguage, loaded]);

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  if (!loaded) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 bg-background min-h-[200px]">
      <h1 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-xl">🌐</span>
        Translingual
      </h1>
      
      <div className="space-y-3">
        {/* Source Language */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Source Language</label>
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-muted/30 border border-border/30 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <button
          onClick={swapLanguages}
          className="w-full h-8 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/30 rounded-md hover:bg-muted/30 transition-colors"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Swap Languages
        </button>

        {/* Target Language */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground font-medium">Target Language</label>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="w-full h-9 px-3 text-sm bg-muted/30 border border-border/30 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shortcut hint */}
      <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> Hold{' '}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">Alt</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-muted rounded border border-border font-mono">T</kbd>
          {' '}on any page to translate.
        </p>
      </div>
    </div>
  );
}

// Mount the popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupSettings />);
}
