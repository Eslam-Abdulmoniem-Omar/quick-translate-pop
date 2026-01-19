import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
}

export function AudioWaveform({ isActive, barCount = 5, className }: AudioWaveformProps) {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(20));

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(barCount).fill(20));
      return;
    }

    const interval = setInterval(() => {
      setHeights(prev => 
        prev.map(() => Math.floor(Math.random() * 60) + 20)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {heights.map((height, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-100',
            isActive ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
          style={{ 
            height: `${height}%`,
            animationDelay: `${i * 50}ms`
          }}
        />
      ))}
    </div>
  );
}
