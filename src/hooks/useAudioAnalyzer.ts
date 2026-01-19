import { useState, useEffect, useRef } from 'react';

export function useAudioAnalyzer(stream: MediaStream | null, barCount: number = 8) {
  const [amplitudes, setAmplitudes] = useState<number[]>(() => new Array(barCount).fill(0));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setAmplitudes(new Array(barCount).fill(0));
      return;
    }

    // Create audio context and analyzer
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64; // Small for performance, gives us 32 frequency bins
    analyser.smoothingTimeConstant = 0.4; // Smooth transitions

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const analyze = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Map frequency data to bar amplitudes
      const binCount = dataArray.length;
      const binsPerBar = Math.floor(binCount / barCount);
      
      const newAmplitudes = [];
      for (let i = 0; i < barCount; i++) {
        // Average the bins for this bar
        let sum = 0;
        const startBin = i * binsPerBar;
        const endBin = Math.min(startBin + binsPerBar, binCount);
        
        for (let j = startBin; j < endBin; j++) {
          sum += dataArray[j];
        }
        
        // Normalize to 0-1 range and apply some scaling for visual appeal
        const avg = sum / (endBin - startBin);
        const normalized = Math.min(1, (avg / 255) * 1.5); // Boost a bit for visibility
        newAmplitudes.push(normalized);
      }

      setAmplitudes(newAmplitudes);
      animationFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, barCount]);

  return amplitudes;
}
