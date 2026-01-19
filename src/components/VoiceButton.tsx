import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const NUM_BARS = 24;

export function VoiceButton({ 
  isRecording, 
  isProcessing, 
  onMouseDown, 
  onMouseUp, 
  onClick,
  size = 'lg' 
}: VoiceButtonProps) {
  const sizeClasses = {
    sm: 'h-12 px-6',
    md: 'h-14 px-8',
    lg: 'h-16 px-10',
  };

  const barHeights = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const isActive = isRecording || isProcessing;

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onClick={onClick}
      disabled={isProcessing}
      className={cn(
        'relative rounded-full flex items-center justify-center gap-0.5 transition-all duration-300',
        sizeClasses[size],
        isActive 
          ? 'bg-secondary border-2 border-border shadow-lg' 
          : 'bg-secondary hover:bg-secondary/80 border-2 border-border shadow-md hover:shadow-lg',
        isProcessing && 'cursor-not-allowed'
      )}
    >
      {/* Recording indicator dot */}
      <div 
        className={cn(
          'absolute left-3 w-2 h-2 rounded-full transition-all duration-300',
          isRecording ? 'bg-destructive animate-pulse' : 'bg-muted-foreground/30'
        )}
      />

      {/* Waveform bars */}
      <div className="flex items-center justify-center gap-[2px] ml-2">
        {Array.from({ length: NUM_BARS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-[2px] rounded-full transition-all',
              isRecording 
                ? 'bg-foreground animate-waveform' 
                : isProcessing
                  ? 'bg-primary animate-processing'
                  : 'bg-muted-foreground/40'
            )}
            style={{
              height: isActive 
                ? `${barHeights[size]}px` 
                : `${Math.max(4, barHeights[size] * (0.2 + Math.abs(Math.sin(i * 0.5)) * 0.3))}px`,
              animationDelay: isActive ? `${i * 50}ms` : '0ms',
            }}
          />
        ))}
      </div>
    </button>
  );
}
