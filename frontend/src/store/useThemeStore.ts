import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'midnight' | 'emerald' | 'slate' | 'amethyst' | 'sand' | 'ruby' | 'light-blue' | 'light-mint' | 'light-peach';

interface ThemeState {
    theme: Theme;
    accentColor: string;

    sidebarCollapsed: boolean;
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: string) => void;
    toggleSidebar: () => void;
}

// Default: Peach Dawn (Warm Beige) theme + Crimson Red accent
const DEFAULT_THEME: Theme = 'light-peach';
const DEFAULT_ACCENT = '346.8 77.2% 49.8%'; // Crimson Rose (the signature red)

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: DEFAULT_THEME,
            accentColor: DEFAULT_ACCENT,
            sidebarCollapsed: false,

            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                set({ theme });
            },

            setAccentColor: (color) => {
                document.documentElement.style.setProperty('--primary-raw', color);
                set({ accentColor: color });
            },

            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        }),
        {
            name: 'elite-theme-storage',
            onRehydrateStorage: () => (state) => {
                if (state) {
                    document.documentElement.setAttribute('data-theme', state.theme);
                    document.documentElement.style.setProperty('--primary-raw', state.accentColor);
                }
            },
        }
    )
);
