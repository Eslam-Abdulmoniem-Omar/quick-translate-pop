import { useState, useCallback, useEffect } from 'react';
import { AudioWaveform } from '@/components/AudioWaveform';
import { TranslationToast } from '@/components/TranslationToast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useTranslation, TranslationResult } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

interface VoiceOverlayProps {
  sourceLanguage: string;
  targetLanguage: string;
}

export function VoiceOverlay({ sourceLanguage, targetLanguage }: VoiceOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    text: string;
    context?: string;
    result: TranslationResult;
  } | null>(null);

  const { translate, isTranslating } = useTranslation({ sourceLanguage, targetLanguage });

  const handleTranslation = useCallback(async (text: string, context?: string) => {
    const result = await translate(text, context);
    if (result) {
      setCurrentTranslation({ text, context, result });
      setShowToast(true);
    }
    // Hide overlay after translation completes
    setTimeout(() => setIsVisible(false), 300);
  }, [translate]);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceInput({
    onTranscription: (text) => {
      handleTranslation(text);
    },
  });

  // Handle Alt+Q keydown/keyup for press-and-hold
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q' && e.altKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating) {
          setIsVisible(true);
          startRecording();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') {
        if (isRecording) {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isProcessing, isTranslating, startRecording, stopRecording]);

  const isActive = isRecording || isProcessing || isTranslating;
  const statusText = isRecording 
    ? 'Listening...' 
    : isProcessing 
      ? 'Transcribing...' 
      : isTranslating 
        ? 'Translating...' 
        : null;

  if (!isVisible && !isActive) return null;

  return (
    <>
      {/* Full-screen backdrop */}
      <div 
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-background/80 backdrop-blur-xl',
          'animate-fade-in'
        )}
      >
        {/* Ambient glow rings */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px] rounded-full',
            'bg-primary/10 blur-3xl',
            isRecording && 'animate-breathe'
          )} />
          {isRecording && (
            <>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/20 animate-ripple" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/20 animate-ripple" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/20 animate-ripple" style={{ animationDelay: '1s' }} />
            </>
          )}
        </div>

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          {isRecording ? (
            <>
              {/* Large waveform */}
              <div className="relative">
                <AudioWaveform 
                  isActive={true} 
                  barCount={15}
                  className="h-24 w-80"
                />
                {/* Glow under waveform */}
                <div className="absolute inset-0 -z-10 bg-primary/30 blur-2xl rounded-full" />
              </div>

              {/* Status text */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-2xl font-medium text-foreground animate-pulse">
                  {statusText}
                </p>
                <p className="text-sm text-muted-foreground">
                  Release <span className="kbd px-1.5 py-0.5 text-xs">Alt+Q</span> to stop
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Processing animation */}
              <div className="relative flex items-center justify-center w-32 h-32">
                {/* Orbital dots */}
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-3 h-3 bg-primary rounded-full"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 120}deg) translateY(-40px) translateX(-50%)`,
                      }}
                    />
                  ))}
                </div>
                {/* Center pulse */}
                <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>

              {/* Status text */}
              <p className="text-2xl font-medium text-foreground animate-pulse">
                {statusText}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Translation Toast */}
      {showToast && currentTranslation && (
        <TranslationToast
          originalText={currentTranslation.text}
          context={currentTranslation.context}
          result={currentTranslation.result}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={() => setShowToast(false)}
          autoDismiss={0}
        />
      )}
    </>
  );
}
