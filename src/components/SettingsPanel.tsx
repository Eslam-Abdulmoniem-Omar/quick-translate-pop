import { Settings, ArrowLeftRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full glass-effect border border-border/50 shadow-lg hover:bg-muted/50 transition-all duration-200"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="glass-effect border-border/50">
        <SheetHeader>
          <SheetTitle className="text-foreground">Settings</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 space-y-8">
          {/* Language Pair Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground">Language Pair</h3>
            
            {/* Source Language */}
            <div className="space-y-2">
              <Label htmlFor="source" className="text-muted-foreground text-xs uppercase tracking-wider">
                From
              </Label>
              <Select value={sourceLanguage} onValueChange={onSourceChange}>
                <SelectTrigger id="source" className="w-full bg-muted/30 border-border/50">
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

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={onSwap}
                className="gap-2 bg-muted/30 border-border/50 hover:bg-muted/50"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Swap Languages
              </Button>
            </div>

            {/* Target Language */}
            <div className="space-y-2">
              <Label htmlFor="target" className="text-muted-foreground text-xs uppercase tracking-wider">
                To
              </Label>
              <Select value={targetLanguage} onValueChange={onTargetChange}>
                <SelectTrigger id="target" className="w-full bg-muted/30 border-border/50">
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
          </div>

          <Separator className="bg-border/30" />

          {/* Keyboard Shortcut Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Keyboard Shortcut</h3>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
              <div className="flex items-center gap-1">
                <span className="kbd px-2 py-1 text-xs">Alt</span>
                <span className="text-muted-foreground">+</span>
                <span className="kbd px-2 py-1 text-xs">Q</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Hold to record, release to translate
              </span>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">How to Use</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Press and hold <span className="kbd px-1 py-0.5 text-xs">Alt+Q</span></li>
              <li>Speak in your source language</li>
              <li>Release to get the translation</li>
            </ol>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
