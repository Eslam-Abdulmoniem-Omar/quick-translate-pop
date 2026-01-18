import { LANGUAGES } from '@/lib/languages';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function LanguageSelector({ value, onChange, label }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[160px] bg-secondary/50 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
  );
}
