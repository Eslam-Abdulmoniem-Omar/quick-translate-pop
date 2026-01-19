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
    <div className="min-h-screen">
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
