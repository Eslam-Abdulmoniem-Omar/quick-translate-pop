import { useState } from 'react';
import { VoiceOverlay } from '@/components/VoiceOverlay';
import { SettingsPanel } from '@/components/SettingsPanel';

const Index = () => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ar');

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Minimal hint - only visible when idle */}
      <main className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-5xl font-bold text-foreground/10 tracking-tight">TransLingual</h1>
          <p className="text-muted-foreground/50 text-sm">
            Press and hold <span className="kbd px-1.5 py-0.5 text-xs">Alt</span> + <span className="kbd px-1.5 py-0.5 text-xs">Q</span> to translate
          </p>
        </div>
      </main>

      {/* Voice Overlay - appears on Alt+Q */}
      <VoiceOverlay 
        sourceLanguage={sourceLanguage} 
        targetLanguage={targetLanguage} 
      />

      {/* Settings Button - always visible in corner */}
      <SettingsPanel
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceChange={setSourceLanguage}
        onTargetChange={setTargetLanguage}
        onSwap={swapLanguages}
      />
    </div>
  );
};

export default Index;
