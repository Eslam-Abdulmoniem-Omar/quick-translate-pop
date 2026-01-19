import { Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceButton({ isRecording, isProcessing, onClick, size = 'lg' }: VoiceButtonProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={cn(
        'relative rounded-full flex items-center justify-center transition-all duration-300',
        sizeClasses[size],
        isRecording 
          ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/30' 
          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30',
        isProcessing && 'opacity-70 cursor-not-allowed'
      )}
    >
      {/* Pulse animation when recording */}
      {isRecording && (
        <>
          <span className="absolute inset-0 rounded-full bg-destructive animate-pulse-ring" />
          <span className="absolute inset-0 rounded-full bg-destructive animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        </>
      )}
      
      <span className="relative z-10">
        {isProcessing ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin')} />
        ) : (
          <Mic className={iconSizes[size]} />
        )}
      </span>
    </button>
  );
}
