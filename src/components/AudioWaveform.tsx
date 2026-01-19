import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function AudioWaveform({ isActive, barCount = 15, className }: AudioWaveformProps) {
  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {[...Array(barCount)].map((_, i) => {
        // Create a wave pattern with higher bars in the middle
        const centerDistance = Math.abs(i - (barCount - 1) / 2);
        const baseHeight = Math.max(0.2, 1 - centerDistance / (barCount / 2));
        
        return (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-150',
              'bg-gradient-to-t from-primary via-primary to-primary/70',
              isActive && 'shadow-sm shadow-primary/50'
            )}
            style={{
              width: barCount > 10 ? '4px' : '6px',
              height: isActive 
                ? `${Math.random() * 60 + 20}%` 
                : `${baseHeight * 30}%`,
              minHeight: '8px',
              animation: isActive 
                ? `waveform ${0.3 + Math.random() * 0.4}s ease-in-out infinite alternate` 
                : 'none',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        );
      })}
    </div>
  );
}
