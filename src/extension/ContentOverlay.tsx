/// <reference types="chrome" />

// Content overlay component for the browser extension
// This is a simplified version that works within Shadow DOM

import { useState, useCallback, useEffect } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';

// Simplified AudioWaveform for extension context
function AudioWaveform({ isActive, stream }: { isActive: boolean; stream: MediaStream | null }) {
  const [levels, setLevels] = useState<number[]>([0.3, 0.5, 0.7, 0.5, 0.3]);

  useEffect(() => {
    if (!isActive || !stream) {
      setLevels([0.3, 0.5, 0.7, 0.5, 0.3]);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 32;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const updateLevels = () => {
      analyser.getByteFrequencyData(dataArray);
      const newLevels = Array.from({ length: 5 }, (_, i) => {
        const value = dataArray[i * 2] / 255;
        return Math.max(0.2, Math.min(1, value * 1.5));
      });
      setLevels(newLevels);
      animationId = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      cancelAnimationFrame(animationId);
      audioContext.close();
    };
  }, [isActive, stream]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '16px', width: '22px' }}>
      {levels.map((level, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            backgroundColor: 'hsl(262 83% 65%)',
            borderRadius: '2px',
            transition: 'height 0.05s ease-out',
            height: `${level * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

// Simplified TranslationToast for extension context
function TranslationToast({
  originalText,
  result,
  sourceLanguage,
  targetLanguage,
  onClose,
}: {
  originalText: string;
  result: TranslationResult;
  sourceLanguage: string;
  targetLanguage: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '400px',
        width: '90%',
        padding: '16px',
        borderRadius: '12px',
        background: 'hsl(224 25% 11% / 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid hsl(224 20% 18%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'hsl(210 20% 98%)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          border: 'none',
          background: 'transparent',
          color: 'hsl(215 15% 55%)',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
        }}
      >
        ×
      </button>

      {/* Original text */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '10px', color: 'hsl(215 15% 55%)', marginBottom: '4px', textTransform: 'uppercase' }}>
          {sourceLanguage.toUpperCase()}
        </div>
        <div style={{ fontSize: '13px', color: 'hsl(215 15% 70%)' }}>{originalText}</div>
      </div>

      {/* Translation */}
      <div>
        <div style={{ fontSize: '10px', color: 'hsl(262 83% 65%)', marginBottom: '4px', textTransform: 'uppercase' }}>
          {targetLanguage.toUpperCase()}
        </div>
        <div style={{ fontSize: '15px', fontWeight: 500 }}>{result.translation}</div>
      </div>
    </div>
  );
}

export function ContentOverlay() {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('ar');
  const [showToast, setShowToast] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    text: string;
    result: TranslationResult;
  } | null>(null);

  // Load settings from extension storage
  useEffect(() => {
    chrome.storage.sync.get({
      'translingual-source-lang': 'en',
      'translingual-target-lang': 'ar',
    }, (result: Record<string, string>) => {
      setSourceLanguage(result['translingual-source-lang']);
      setTargetLanguage(result['translingual-target-lang']);
    });

    // Listen for settings changes
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['translingual-source-lang']) {
        setSourceLanguage(changes['translingual-source-lang'].newValue as string);
      }
      if (changes['translingual-target-lang']) {
        setTargetLanguage(changes['translingual-target-lang'].newValue as string);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const { translate, isTranslating } = useTranslation({ sourceLanguage, targetLanguage });

  const handleTranslation = useCallback(async (text: string) => {
    const result = await translate(text);
    if (result) {
      setCurrentTranslation({ text, result });
      setShowToast(true);
    }
  }, [translate]);

  const { isRecording, isProcessing, isInitializing, activeStream, startRecording, stopRecording } = useVoiceInput({
    onTranscription: handleTranslation,
  });

  // Handle keyboard shortcuts (Alt+T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && e.altKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' || e.key === 'Alt') {
        if (isRecording) {
          stopRecording();
        }
      }
    };

    // Listen for command from background script
    const handleExtCommand = () => {
      if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
        startRecording();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('translingual-start-recording', handleExtCommand);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('translingual-start-recording', handleExtCommand);
    };
  }, [isRecording, isProcessing, isTranslating, isInitializing, startRecording, stopRecording]);

  const handleToastClose = useCallback(() => {
    setShowToast(false);
    setCurrentTranslation(null);
  }, []);

  const isActive = isRecording || isProcessing || isTranslating || isInitializing;
  const isIdle = !isActive && !showToast;

  return (
    <>
      {/* Recording indicator pill */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          transition: 'opacity 0.2s ease-out',
          opacity: isIdle ? 0 : 1,
          pointerEvents: isIdle ? 'none' : 'auto',
        }}
      >
        {isActive && (
          <div
            className="glass-effect"
            style={{
              borderRadius: '9999px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              border: '1px solid hsl(224 20% 18% / 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '36px',
            }}
          >
            {isRecording ? (
              <AudioWaveform isActive={true} stream={activeStream} />
            ) : (
              <div style={{ position: 'relative', width: '16px', height: '16px' }}>
                <div className="animate-spin-slow" style={{ position: 'absolute', inset: 0 }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        width: '4px',
                        height: '4px',
                        backgroundColor: 'hsl(262 83% 65%)',
                        borderRadius: '50%',
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 120}deg) translateY(-6px) translateX(-50%)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Translation Toast */}
      {showToast && currentTranslation && (
        <TranslationToast
          originalText={currentTranslation.text}
          result={currentTranslation.result}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={handleToastClose}
        />
      )}
    </>
  );
}
