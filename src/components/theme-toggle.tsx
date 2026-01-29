import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="w-10 h-10">
                <Sun className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 transition-all duration-300 hover:scale-105"
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500 transition-transform duration-300 rotate-0 scale-100" />
            ) : (
                <Moon className="h-5 w-5 text-slate-700 transition-transform duration-300 rotate-0 scale-100" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
