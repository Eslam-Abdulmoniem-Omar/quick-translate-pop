import { useState, useEffect } from 'react';
import { VoiceOverlay } from '@/components/VoiceOverlay';
import { SettingsPanel } from '@/components/SettingsPanel';

const Index = () => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ar');

  // Warm up microphone permission on first user interaction
  useEffect(() => {
    const warmUpMic = () => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          // Keep stream alive but muted for instant re-use
          stream.getTracks().forEach(track => {
            track.enabled = false;
          });
        })
        .catch(() => {
          // Permission denied or no mic - that's okay, will prompt later
        });
      window.removeEventListener('click', warmUpMic);
      window.removeEventListener('keydown', warmUpMic);
    };
    
    window.addEventListener('click', warmUpMic, { once: true });
    window.addEventListener('keydown', warmUpMic, { once: true });
    
    return () => {
      window.removeEventListener('click', warmUpMic);
      window.removeEventListener('keydown', warmUpMic);
    };
  }, []);

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
  };

  return (
    <div className="min-h-screen">
      {/* Voice Overlay - appears on Alt+T */}
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
