import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface UseVoiceInputOptions {
  onTranscription: (text: string) => void;
}

// Global warm stream - persists across hook instances
let warmStream: MediaStream | null = null;
let isWarmingUp = false;

export function useVoiceInput({ onTranscription }: UseVoiceInputOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

      mediaRecorder.onstop = async () => {
        // Disable tracks but don't stop them (keep warm)
        stream.getTracks().forEach(track => {
          track.enabled = false;
        });
        
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        
        if (audioBlob.size < 1000) {
          toast.error('Recording too short. Please try again.');
          setIsProcessing(false);
          return;
        }

        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      // Use timeslice for faster chunk availability
      mediaRecorder.start(100);
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
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.text) {
        onTranscription(data.text);
      } else {
        toast.error('No speech detected. Please try again.');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    isInitializing,
    startRecording,
    stopRecording,
  };
}
