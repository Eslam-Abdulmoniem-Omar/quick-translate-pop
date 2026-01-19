import { Settings, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LANGUAGES } from '@/lib/languages';

interface SettingsPanelProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (value: string) => void;
  onTargetChange: (value: string) => void;
  onSwap: () => void;
}

export function SettingsPanel({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
  onSwap,
}: SettingsPanelProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-40 h-9 w-9 rounded-full glass-effect border border-border/30 shadow-md hover:bg-muted/50 transition-all duration-150"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-56 p-3 glass-effect border-border/30"
      >
        <div className="space-y-3">
          {/* Source Language */}
          <Select value={sourceLanguage} onValueChange={onSourceChange}>
            <SelectTrigger className="w-full h-9 bg-muted/30 border-border/30 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-effect">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Swap Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwap}
            className="w-full h-8 gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftRight className="h-3 w-3" />
            Swap
          </Button>

          {/* Target Language */}
          <Select value={targetLanguage} onValueChange={onTargetChange}>
            <SelectTrigger className="w-full h-9 bg-muted/30 border-border/30 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-effect">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
