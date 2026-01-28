import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [showToast, setShowToast] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState<{
    text: string;
    context?: string;
    result: TranslationResult;
  } | null>(null);
  
  const popupGuardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const POPUP_DEADLINE_MS = 400;

  const mark = (name: string) => {
    try {
      if (typeof performance !== 'undefined') {
        performance.mark(name);
        console.log(`[Perf] mark: ${name}`);
      }
    } catch {
      // Ignore performance errors
    }
  };

  const measureHotkeyToPopup = () => {
    try {
      if (typeof performance !== 'undefined') {
        performance.measure('hotkey → popup', 'hotkey-pressed', 'popup-shown');
        const entries = performance.getEntriesByName('hotkey → popup');
        const last = entries[entries.length - 1];
        if (last) {
          const duration = last.duration.toFixed(1);
          const status = last.duration < 500 ? '✓' : '✗';
          console.log(`[Perf] hotkey → popup: ${duration}ms ${status} (target: <500ms)`);
        }
      }
    } catch {
      // Ignore measurement errors
    }
  };

  const measureRecordingPhase = () => {
    try {
      if (typeof performance !== 'undefined') {
        performance.measure('recording phase', 'hotkey-pressed', 'recording-ended');
        const entries = performance.getEntriesByName('recording phase');
        const last = entries[entries.length - 1];
        if (last) {
          const duration = last.duration.toFixed(1);
          const status = last.duration < 500 ? '✓' : '✗';
          console.log(`[Perf] recording phase: ${duration}ms ${status} (target: <500ms)`);
        }
      }
    } catch {
      // Ignore measurement errors
    }
  };

  const showPopupImmediately = useCallback(() => {
    if (popupGuardTimeoutRef.current) {
      clearTimeout(popupGuardTimeoutRef.current);
      popupGuardTimeoutRef.current = null;
    }
    
    setShowToast(true);
    setCurrentTranslation({
      text: '',
      result: { translation: '', examples: [] }
    });
    mark('popup-shown');
    measureHotkeyToPopup();
  }, []);

  const startPopupGuard = useCallback(() => {
    if (popupGuardTimeoutRef.current) {
      clearTimeout(popupGuardTimeoutRef.current);
    }
    
    popupGuardTimeoutRef.current = setTimeout(() => {
      console.warn(`[Perf Guard] Popup forced after ${POPUP_DEADLINE_MS}ms deadline`);
      showPopupImmediately();
    }, POPUP_DEADLINE_MS);
  }, [showPopupImmediately]);

  const { translate, isTranslating } = useTranslation({ sourceLanguage, targetLanguage });

  const handleRecordingEnd = useCallback(() => {
    // Popup now shown on keyup - this is just for cleanup
  }, []);

  const handleError = useCallback(() => {
    // Close popup immediately when there's an error (no transcription output)
    setShowToast(false);
    setCurrentTranslation(null);
  }, []);

  const handleTranslation = useCallback(async (text: string, context?: string) => {
    mark('translation-start');
    
    const handlePartial = (partial: TranslationResult) => {
      // Batch partial updates with RAF (non-critical path)
      requestAnimationFrame(() => {
        setCurrentTranslation({ text, context, result: partial });
      });
    };

    try {
      const result = await translate(text, context, handlePartial);
      if (result) {
        // Final update - synchronous for immediate display
        setCurrentTranslation({ text, context, result });
        mark('translation-complete');
      }
    } catch (error) {
      console.error('Translation error in background:', error);
    }
  }, [translate]);

  const { isRecording, isProcessing, isInitializing, isTooShort, activeStream, startRecording, stopRecording } = useVoiceInput({
    onRecordingEnd: handleRecordingEnd,
    onTranscription: (text) => {
      // Run translation in background without blocking
      handleTranslation(text).catch(error => {
        console.error('Background translation handler error:', error);
      });
    },
    onError: handleError,
  });

  useEffect(() => {
    // Electron IPC listeners
    if (window.electron) {
      window.electron.onStartRecording(() => {
        if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
          mark('hotkey-pressed');
          startRecording();
          startPopupGuard();
        }
      });

      window.electron.onStopRecording(() => {
        // CRITICAL: Show popup immediately, regardless of recording state
        showPopupImmediately();
        
        // Defer MediaRecorder.stop() and audio processing
        if (isRecording) {
          queueMicrotask(() => {
            stopRecording();
            measureRecordingPhase();
          });
        }
      });

      return () => {
        window.electron?.removeListeners();
      };
    }

    // Fallback for browser development (Alt+T or Ctrl+Shift)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Use e.code for physical key position - works regardless of keyboard layout
      if (e.code === 'KeyT' && e.altKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
          mark('hotkey-pressed');
          startRecording();
          startPopupGuard();
        }
      }

      if (e.ctrlKey && e.shiftKey && !e.repeat) {
        e.preventDefault();
        if (!isRecording && !isProcessing && !isTranslating && !isInitializing) {
          mark('hotkey-pressed');
          startRecording();
          startPopupGuard();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Check physical key code or Alt release to stop recording
      if (e.code === 'KeyT' || e.key === 'Alt') {
        // CRITICAL: Show popup immediately, regardless of recording state
        showPopupImmediately();
        
        // Defer MediaRecorder.stop() and audio processing
        if (isRecording) {
          queueMicrotask(() => {
            stopRecording();
            measureRecordingPhase();
          });
        }
      }

      if (e.key === 'Control' || e.key === 'Shift') {
        // CRITICAL: Show popup immediately, regardless of recording state
        showPopupImmediately();
        
        // Defer MediaRecorder.stop() and audio processing
        if (isRecording) {
          queueMicrotask(() => {
            stopRecording();
            measureRecordingPhase();
          });
        }
      }
    };

    const handleBlur = () => {
      // CRITICAL: Show popup immediately, regardless of recording state
      showPopupImmediately();
      
      // Defer MediaRecorder.stop() and audio processing
      if (isRecording) {
        queueMicrotask(() => {
          stopRecording();
          measureRecordingPhase();
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      
      if (popupGuardTimeoutRef.current) {
        clearTimeout(popupGuardTimeoutRef.current);
      }
    };
  }, [isRecording, isProcessing, isTranslating, isInitializing, startRecording, stopRecording, showPopupImmediately, startPopupGuard]);

  const handleToastClose = useCallback(() => {
    setShowToast(false);
    setCurrentTranslation(null);
  }, []);

  const isActive = isRecording || isProcessing || isTranslating || isInitializing || isTooShort;
  const isIdle = !isActive && !showToast;

  // Tell the main process when we're idle so it can make the window click-through
  // and auto-hide (prevents the "blank rectangle" problem on Windows).
  useEffect(() => {
    window.electron?.setOverlayIdle?.(isIdle);
  }, [isIdle]);
  
  return (
    <>
      {/* Bottom-center mic bar - matches popup (Google Translate style), invisible when idle */}
      <div 
        className={cn(
          'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]',
          'transition-all duration-200 ease-out',
          isIdle && !isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {isActive && (
          <div
            className={cn(
              'bg-white rounded-xl',
              'border border-[#DADCE0]',
              'shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
              'flex items-center justify-center',
              'transition-all duration-200 ease-out',
              'min-w-[48px] h-10 px-3'
            )}
          >
            {isRecording ? (
              <AudioWaveform
                isActive={true}
                stream={activeStream}
                barCount={5}
                className="h-4 w-[22px]"
              />
            ) : (
              <div className="relative flex items-center justify-center w-4 h-4">
                <div className="absolute inset-0 animate-spin-slow">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 rounded-full bg-[#1A73E8]"
                      style={{
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

      {/* Translation Toast - Independent of recording state */}
      {showToast && (
        <TranslationToast
          originalText={currentTranslation?.text || ''}
          context={currentTranslation?.context}
          result={currentTranslation?.result || { translation: '', examples: [] }}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={handleToastClose}
        />
      )}
    </>
  );
}
