import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'midnight' | 'emerald' | 'slate' | 'amethyst' | 'sand' | 'ruby';

interface ThemeState {
    theme: Theme;
    accentColor: string;

    sidebarCollapsed: boolean;
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: string) => void;
    toggleSidebar: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'light',
            accentColor: '243 75% 59%',
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
