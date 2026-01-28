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

  // Listen for storage changes (from settings page)
  useEffect(() => {
    const handleStorage = () => {
      const source = localStorage.getItem('translingual-source-lang');
      const target = localStorage.getItem('translingual-target-lang');
      if (source) setSourceLanguage(source);
      if (target) setTargetLanguage(target);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Keep edge functions warm to reduce cold starts
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const ping = () => {
      fetch(`${url}/functions/v1/ping`, {
        method: 'GET',
        headers: {
          apikey: key,
        },
      }).catch(() => {});
    };

    ping();
    const intervalId = window.setInterval(ping, 10 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Warm up microphone permission on first user interaction
  useEffect(() => {
    const warmUpMic = () => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.enabled = false;
          });
        })
        .catch(() => {});
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
      <VoiceOverlay 
        sourceLanguage={sourceLanguage} 
        targetLanguage={targetLanguage} 
      />
    </div>
  );
};

export default Index;
