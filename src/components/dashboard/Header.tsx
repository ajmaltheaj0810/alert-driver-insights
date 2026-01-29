import { Shield, Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-primary/20 glow-success">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Driver Safety Monitor</h1>
              <p className="text-sm text-muted-foreground">Intelligent Drowsiness Detection System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-secondary border border-border">
              <Activity className="w-4 h-4 text-success animate-pulse" />
              <span className="text-sm font-medium">System Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
