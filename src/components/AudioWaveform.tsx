import { cn } from '@/lib/utils';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

interface AudioWaveformProps {
  isActive: boolean;
  stream?: MediaStream | null;
  barCount?: number;
  className?: string;
}

export function AudioWaveform({ isActive, stream, barCount = 5, className }: AudioWaveformProps) {
  const amplitudes = useAudioAnalyzer(isActive ? stream ?? null : null, barCount);

  return (
    <div className={cn('flex items-center justify-center gap-[3px]', className)}>
      {[...Array(barCount)].map((_, i) => {
        // Create a subtle wave pattern for idle state (center slightly higher)
        const centerDistance = Math.abs(i - (barCount - 1) / 2);
        const baseHeight = Math.max(0.3, 1 - centerDistance / (barCount / 2));
        
        // Use real amplitude data when active, otherwise use minimal pattern
        const amplitude = isActive ? amplitudes[i] || 0 : 0;
        const height = isActive 
          ? Math.max(15, amplitude * 100) // 15% min, up to 100% based on audio
          : baseHeight * 25;
        
        // Subtle opacity based on amplitude for more dynamic feel
        const opacity = isActive ? Math.max(0.6, amplitude * 0.4 + 0.6) : 0.5;
        
        return (
          <div
            key={i}
            className="rounded-full bg-primary"
            style={{
              width: '2px',
              height: `${height}%`,
              minHeight: '4px',
              opacity,
              transition: 'height 50ms ease-out, opacity 50ms ease-out',
            }}
          />
        );
      })}
    </div>
  );
}
