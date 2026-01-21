import { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGES } from '@/lib/languages';

const Settings = () => {
  const [sourceLanguage, setSourceLanguage] = useState(() => {
    return localStorage.getItem('translingual-source-lang') || 'en';
  });
  const [targetLanguage, setTargetLanguage] = useState(() => {
    return localStorage.getItem('translingual-target-lang') || 'ar';
  });

  // Load settings from Electron store on mount
  useEffect(() => {
    if (window.electronAPI?.loadSettings) {
      window.electronAPI.loadSettings().then((settings) => {
        if (settings) {
          setSourceLanguage(settings.sourceLanguage);
          setTargetLanguage(settings.targetLanguage);
        }
      });
    }
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('translingual-source-lang', sourceLanguage);
    localStorage.setItem('translingual-target-lang', targetLanguage);
    
    // Save to Electron store and notify main window
    if (window.electronAPI?.saveSettings) {
      window.electronAPI.saveSettings({ sourceLanguage, targetLanguage });
    }
  }, [sourceLanguage, targetLanguage]);

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-xl font-semibold text-foreground mb-6">Settings</h1>
      
      <div className="space-y-4 max-w-xs">
        {/* Source Language */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Source Language</label>
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger className="w-full h-10 bg-muted/30 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Swap Button */}
        <Button
          variant="outline"
          onClick={swapLanguages}
          className="w-full h-9 gap-2 text-sm"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Swap Languages
        </Button>

        {/* Target Language */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Target Language</label>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="w-full h-10 bg-muted/30 border-border/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="mt-8 p-4 rounded-lg bg-muted/20 border border-border/30 max-w-xs">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Tip:</span> Hold{' '}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Alt</kbd>
          {' + '}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">T</kbd>
          {' '}to record and translate.
        </p>
      </div>
    </div>
  );
};

export default Settings;
