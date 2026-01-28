import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onRecordingEnd?: () => void;
  onTranscription: (text: string) => void;
  onError?: () => void;
}

// Global warm stream - persists across hook instances
let warmStream: MediaStream | null = null;
let isWarmingUp = false;

export function useVoiceInput({ onRecordingEnd, onTranscription, onError }: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isTooShort, setIsTooShort] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const hasSentForIntentRef = useRef(false);
  const isTranscribingRef = useRef(false);

  const MIN_RECORDING_DURATION_MS = 500;
  // Warm up microphone on mount
  useEffect(() => {
    warmUpMicrophone();
  }, []);

  const warmUpMicrophone = useCallback(async () => {
    if (warmStream || isWarmingUp) return;
    
    isWarmingUp = true;
    try {
      warmStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      // Disable tracks but keep stream alive for instant re-enable
      warmStream.getTracks().forEach(track => {
        track.enabled = false;
      });
    } catch (error) {
      console.log('Microphone warm-up skipped:', error);
    } finally {
      isWarmingUp = false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    // Show initializing state immediately
    setIsInitializing(true);
    hasSentForIntentRef.current = false;
    
    try {
      let stream: MediaStream;
      
      // Use warm stream if available, otherwise get new one
      if (warmStream) {
        warmStream.getTracks().forEach(track => {
          track.enabled = true;
        });
        stream = warmStream;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 16000,
          }
        });
        warmStream = stream;
      }

      // Use opus codec for smaller file size
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Disable tracks but don't stop them (keep warm)
        stream.getTracks().forEach(track => {
          track.enabled = false;
        });
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        if (audioBlob.size < 5000) {
          toast.error('Recording too short. Hold Ctrl+Shift longer.');
          setIsProcessing(false);
          onError?.();
          return;
        }

        // Process transcription in background without blocking
        transcribeAudio(audioBlob).catch(error => {
          console.error('Background transcription error:', error);
        });
      };

      mediaRecorderRef.current = mediaRecorder;
      // Use smaller timeslice for faster chunk availability
      mediaRecorder.start(50);
      recordingStartTimeRef.current = Date.now();
      setActiveStream(stream);
      setIsInitializing(false);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
      setIsInitializing(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      const recordingDuration = Date.now() - recordingStartTimeRef.current;
      
      if (recordingDuration < MIN_RECORDING_DURATION_MS) {
        // Recording too short - show feedback and don't process
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsTooShort(true);
        toast.info('Hold Ctrl+Shift a bit longer', { duration: 1500 });
        setTimeout(() => setIsTooShort(false), 1500);
        onError?.();
        return;
      }
      
      if (typeof performance !== 'undefined') {
        try {
          performance.mark('recording-ended');
          console.log('[Perf] mark: recording-ended');
        } catch {
          // Ignore performance errors
        }
      }
      
      onRecordingEnd?.();
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setActiveStream(null);
      setIsProcessing(true);
    }
  }, [isRecording, onRecordingEnd]);

  const transcribeAudio = async (audioBlob: Blob) => {
    if (isTranscribingRef.current) return;
    isTranscribingRef.current = true;
    
    if (typeof performance !== 'undefined') {
      try {
        performance.mark('audio-processing-start');
        console.log('[Perf] mark: audio-processing-start (popup should already be visible)');
      } catch {
        // Ignore performance errors
      }
    }
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      if (typeof performance !== 'undefined') {
        try {
          performance.mark('audio-upload-start');
          performance.mark('whisper-request-start');
          console.log('[Perf] mark: audio-upload-start');
          console.log('[Perf] mark: whisper-request-start');
        } catch {
          // Ignore performance errors
        }
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: formData,
        }
      );

      if (typeof performance !== 'undefined') {
        try {
          performance.mark('audio-upload-end');
          performance.mark('whisper-response-end');
          console.log('[Perf] mark: audio-upload-end');
          console.log('[Perf] mark: whisper-response-end');
          performance.measure('upload audio', 'audio-upload-start', 'audio-upload-end');
          performance.measure('whisper latency', 'whisper-request-start', 'whisper-response-end');
          const uploadEntries = performance.getEntriesByName('upload audio');
          const whisperEntries = performance.getEntriesByName('whisper latency');
          const lastUpload = uploadEntries[uploadEntries.length - 1];
          const lastWhisper = whisperEntries[whisperEntries.length - 1];
          if (lastUpload) {
            console.log(`[Perf] upload audio: ${lastUpload.duration.toFixed(1)}ms`);
          }
          if (lastWhisper) {
            console.log(`[Perf] whisper latency: ${lastWhisper.duration.toFixed(1)}ms`);
          }
        } catch {
          // Ignore performance errors
        }
      }

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const text = data.text?.trim() || '';
      if (typeof performance !== 'undefined') {
        try {
          performance.mark('transcription-done');
          console.log('[Perf] mark: transcription-done');
        } catch {
          // Ignore performance errors
        }
      }
      
      // Check if it's actual speech (not just audio events like [beeping], [clicking], etc.)
      const isAudioEventOnly = /^\[.*\]$/.test(text) || !text;
      
      if (text && !isAudioEventOnly) {
        if (!hasSentForIntentRef.current) {
          hasSentForIntentRef.current = true;
          // Yield to event loop before triggering translation
          queueMicrotask(() => {
            onTranscription(text);
          });
        }
      } else {
        toast.info("We couldn't hear you", { duration: 1500 });
        onError?.();
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio. Please try again.');
      onError?.();
    } finally {
      setIsProcessing(false);
      isTranscribingRef.current = false;
    }
  };

  return {
    isRecording,
    isProcessing,
    isInitializing,
    isTooShort,
    activeStream,
    startRecording,
    stopRecording,
  };
}
