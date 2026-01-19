import { Languages } from 'lucide-react';
import { TranslatorInterface } from '@/components/TranslatorInterface';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Languages className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Voice Translator
            </h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        <TranslatorInterface />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-xs text-muted-foreground">
        <p>Press <span className="kbd">Alt</span> + <span className="kbd">Q</span> to start voice input</p>
      </footer>
    </div>
  );
};

export default Index;
