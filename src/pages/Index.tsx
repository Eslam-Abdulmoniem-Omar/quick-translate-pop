import { useState, useEffect } from 'react';
import { VoiceOverlay } from '@/components/VoiceOverlay';

const Index = () => {
  const [sourceLanguage, setSourceLanguage] = useState(() => {
    return localStorage.getItem('translingual-source-lang') || 'en';
  });
  const [targetLanguage, setTargetLanguage] = useState(() => {
    return localStorage.getItem('translingual-target-lang') || 'ar';
  });

  // Persist language settings
  useEffect(() => {
    localStorage.setItem('translingual-source-lang', sourceLanguage);
    localStorage.setItem('translingual-target-lang', targetLanguage);
  }, [sourceLanguage, targetLanguage]);

  // Listen for settings changes from Electron (via IPC)
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent<{ sourceLanguage: string; targetLanguage: string }>) => {
      setSourceLanguage(event.detail.sourceLanguage);
      setTargetLanguage(event.detail.targetLanguage);
    };
    
    window.addEventListener('settings-changed', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChange as EventListener);
    };
  }, []);

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

  return (
    <div className="min-h-screen">
      {/* Voice Overlay - appears on Alt+T, completely invisible when idle */}
      <VoiceOverlay 
        sourceLanguage={sourceLanguage} 
        targetLanguage={targetLanguage} 
      />
    </div>
  );
};

export default Index;
