import { FloatingDock } from '@/components/FloatingDock';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Empty canvas - content area for future use */}
      <main className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-4xl font-bold text-foreground/10">TransLingual</h1>
          <p className="text-muted-foreground/50 text-sm">
            Press <span className="kbd">Alt</span> + <span className="kbd">Q</span> or click the microphone to translate
          </p>
        </div>
      </main>

      {/* Floating Dock - main interaction point */}
      <FloatingDock />
    </div>
  );
};

export default Index;
