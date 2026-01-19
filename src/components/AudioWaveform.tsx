import { cn } from '@/lib/utils';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

interface AudioWaveformProps {
  isActive: boolean;
  stream?: MediaStream | null;
  barCount?: number;
  className?: string;
}

export function AudioWaveform({ isActive, stream, barCount = 15, className }: AudioWaveformProps) {
  const amplitudes = useAudioAnalyzer(isActive ? stream ?? null : null, barCount);

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {[...Array(barCount)].map((_, i) => {
        // Create a wave pattern with higher bars in the middle for idle state
        const centerDistance = Math.abs(i - (barCount - 1) / 2);
        const baseHeight = Math.max(0.2, 1 - centerDistance / (barCount / 2));
        
        // Use real amplitude data when active, otherwise use base pattern
        const amplitude = isActive ? amplitudes[i] || 0 : 0;
        const height = isActive 
          ? Math.max(10, amplitude * 90) // 10% min, up to 90% based on audio
          : baseHeight * 30;
        
        return (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-75',
              'bg-gradient-to-t from-primary via-primary to-primary/70',
              isActive && amplitude > 0.1 && 'shadow-sm shadow-primary/50'
            )}
            style={{
              width: barCount > 10 ? '4px' : '6px',
              height: `${height}%`,
              minHeight: '8px',
            }}
          />
        );
      })}
    </div>
  );
}
