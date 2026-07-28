export type Theme = 'light' | 'dark' | 'midnight' | 'emerald' | 'slate' | 'amethyst' | 'sand' | 'ruby';

export const ACCENT_COLORS = [
    { name: 'Classic Blue', value: '217.2 91.2% 59.8%' },
    { name: 'Sky Blue', value: '199 89% 48%' },
    { name: 'Teal Forest', value: '174 100% 29%' },
    { name: 'Emerald', value: '142.1 70.6% 45.3%' },
    { name: 'Lime Volt', value: '84 81% 44%' },
    { name: 'Amber Gold', value: '38 92% 50%' },
    { name: 'Industrial Orange', value: '24 95% 53%' },
    { name: 'Crimson Rose', value: '346.8 77.2% 49.8%' },
    { name: 'Electric Violet', value: '262.1 83.3% 57.8%' },
];

export const THEME_OPTIONS: { id: Theme; name: string; color: string }[] = [
    { id: 'light', name: 'Porcelain (Light)', color: '#ffffff' },
    { id: 'dark', name: 'Onyx (Dark)', color: '#0a0a0c' },
    { id: 'midnight', name: 'Midnight Navy', color: '#0f172a' },
    { id: 'emerald', name: 'Emerald Forest', color: '#022c22' },
    { id: 'slate', name: 'Technical Slate', color: '#1e293b' },
    { id: 'amethyst', name: 'Amethyst Purple', color: '#1a0521' },
    { id: 'sand', name: 'Golden Sand', color: '#1c170d' },
    { id: 'ruby', name: 'Ruby Sangria', color: '#1a0408' },
];
