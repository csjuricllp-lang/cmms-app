import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    delay?: number;
}

export function DebouncedSearchInput({ value, onChange, placeholder = "Search...", className = "", delay = 300 }: Props) {
    const [localValue, setLocalValue] = useState(value);

    // Sync external value changes to local state
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, delay);

        return () => clearTimeout(handler);
    }, [localValue, onChange, delay, value]);

    return (
        <div className={cn("relative group", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
                type="text" 
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder} 
                className="w-full h-9 pl-9 pr-4 bg-muted border border-border rounded-xl text-[13px] text-foreground focus:outline-none focus:bg-background focus:border-primary/30 transition-all placeholder:text-muted-foreground"
            />
        </div>
    );
}
