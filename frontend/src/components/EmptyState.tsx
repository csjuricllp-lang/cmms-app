import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

// ─── Inline SVG Illustrations ─────────────────────────────────────────────────
const illustrations = {
    'work-order': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="20" y="15" width="80" height="70" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <rect x="30" y="28" width="45" height="5" rx="2.5" fill="currentColor" fillOpacity="0.18"/>
            <rect x="30" y="40" width="60" height="4" rx="2" fill="currentColor" fillOpacity="0.1"/>
            <rect x="30" y="50" width="50" height="4" rx="2" fill="currentColor" fillOpacity="0.1"/>
            <rect x="30" y="60" width="35" height="4" rx="2" fill="currentColor" fillOpacity="0.08"/>
            <circle cx="86" cy="72" r="14" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
            <path d="M82 72l3 3 6-6" stroke="currentColor" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    'asset': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="15" y="35" width="40" height="50" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
            <rect x="65" y="20" width="40" height="65" rx="6" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <rect x="22" y="45" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.15"/>
            <rect x="22" y="55" width="18" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1"/>
            <rect x="22" y="63" width="22" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1"/>
            <rect x="72" y="30" width="26" height="4" rx="2" fill="currentColor" fillOpacity="0.15"/>
            <rect x="72" y="40" width="18" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1"/>
            <rect x="72" y="50" width="22" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1"/>
            <path d="M35 35 L35 20 L55 20" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="3 2"/>
        </svg>
    ),
    'part': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="25" y="20" width="70" height="55" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <rect x="35" y="32" width="50" height="32" rx="4" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
            <line x1="35" y1="48" x2="85" y2="48" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
            <line x1="60" y1="32" x2="60" y2="64" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
            <rect x="38" y="35" width="19" height="10" rx="2" fill="currentColor" fillOpacity="0.12"/>
            <rect x="63" y="51" width="19" height="10" rx="2" fill="currentColor" fillOpacity="0.12"/>
            <rect x="35" y="70" width="20" height="5" rx="2.5" fill="currentColor" fillOpacity="0.15"/>
            <rect x="60" y="70" width="25" height="5" rx="2.5" fill="currentColor" fillOpacity="0.1"/>
        </svg>
    ),
    'location': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <ellipse cx="60" cy="82" rx="35" ry="6" fill="currentColor" fillOpacity="0.06"/>
            <path d="M60 18C47.85 18 38 27.85 38 40C38 55 60 82 60 82C60 82 82 55 82 40C82 27.85 72.15 18 60 18Z" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
            <circle cx="60" cy="40" r="8" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
            <circle cx="60" cy="40" r="3" fill="currentColor" fillOpacity="0.3"/>
        </svg>
    ),
    'person': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="42" cy="35" r="13" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5"/>
            <path d="M18 78C18 65.3 29.3 55 43 55C56.7 55 68 65.3 68 78" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="78" cy="30" r="10" fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <path d="M60 70C60 59.5 68.5 51 79 51C89.5 51 98 59.5 98 70" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
    ),
    'request': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="25" y="18" width="70" height="55" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <path d="M25 60 L120 60" stroke="transparent"/>
            <rect x="35" y="30" width="50" height="5" rx="2.5" fill="currentColor" fillOpacity="0.18"/>
            <rect x="35" y="42" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.1"/>
            <rect x="35" y="52" width="30" height="4" rx="2" fill="currentColor" fillOpacity="0.08"/>
            <path d="M40 80 L80 80" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/>
            <circle cx="60" cy="80" r="0" fill="none"/>
            <path d="M55 75 L60 80 L65 75" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    'pm': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="20" y="22" width="80" height="62" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <rect x="20" y="22" width="80" height="16" rx="8" fill="currentColor" fillOpacity="0.08"/>
            <rect x="8" y="16" width="1" height="0" rx="0" fill="none"/>
            <line x1="42" y1="16" x2="42" y2="28" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round"/>
            <line x1="78" y1="16" x2="78" y2="28" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round"/>
            {[0,1,2,3,4,5,6].map(i => (
                <rect key={i} x={29 + (i % 4) * 17} y={48 + Math.floor(i/4) * 16} width="12" height="10" rx="3" fill="currentColor" fillOpacity={i === 2 ? 0.25 : 0.08}/>
            ))}
            <path d="M56 52 L59 56 L64 50" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ),
    'checklist': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="22" y="15" width="76" height="75" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            {[0,1,2,3].map(i => (
                <g key={i}>
                    <rect x="32" y={28 + i * 15} width="10" height="10" rx="3" fill="currentColor" fillOpacity={i < 2 ? 0.2 : 0.06} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1"/>
                    {i < 2 && <path d={`M35 ${33 + i * 15} l2.5 2.5 4-4`} stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
                    <rect x="48" y={31 + i * 15} width={i === 0 ? 42 : i === 1 ? 30 : 38} height="4" rx="2" fill="currentColor" fillOpacity={i < 2 ? 0.15 : 0.07}/>
                </g>
            ))}
        </svg>
    ),
    'meter': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="60" cy="55" r="35" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <path d="M30 55 A30 30 0 0 1 90 55" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <path d="M30 55 A30 30 0 0 1 65 27" stroke="currentColor" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <circle cx="60" cy="55" r="4" fill="currentColor" fillOpacity="0.3"/>
            <line x1="60" y1="55" x2="52" y2="35" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round"/>
            <rect x="45" y="70" width="30" height="5" rx="2.5" fill="currentColor" fillOpacity="0.12"/>
        </svg>
    ),
    'file': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="35" y="15" width="50" height="65" rx="6" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <path d="M65 15 L85 35" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
            <path d="M65 15 L65 35 L85 35" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1"/>
            <rect x="44" y="45" width="32" height="4" rx="2" fill="currentColor" fillOpacity="0.12"/>
            <rect x="44" y="55" width="24" height="4" rx="2" fill="currentColor" fillOpacity="0.08"/>
            <rect x="44" y="65" width="28" height="4" rx="2" fill="currentColor" fillOpacity="0.08"/>
        </svg>
    ),
    'vendor': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect x="20" y="40" width="80" height="45" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <path d="M30 40 L35 20 L85 20 L90 40" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5"/>
            <rect x="47" y="55" width="26" height="30" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1"/>
            <circle cx="60" cy="62" r="4" fill="currentColor" fillOpacity="0.2"/>
            <rect x="30" y="52" width="14" height="14" rx="4" fill="currentColor" fillOpacity="0.1"/>
            <rect x="76" y="52" width="14" height="14" rx="4" fill="currentColor" fillOpacity="0.1"/>
        </svg>
    ),
    'generic': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="60" cy="45" r="30" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
            <path d="M48 45 L56 53 L72 37" stroke="currentColor" strokeOpacity="0.0" strokeWidth="0"/>
            <circle cx="60" cy="38" r="6" fill="currentColor" fillOpacity="0.15"/>
            <rect x="48" y="48" width="24" height="3" rx="1.5" fill="currentColor" fillOpacity="0.12"/>
            <rect x="52" y="56" width="16" height="3" rx="1.5" fill="currentColor" fillOpacity="0.08"/>
            <rect x="35" y="78" width="50" height="6" rx="3" fill="currentColor" fillOpacity="0.1"/>
        </svg>
    ),
    'search': (
        <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="50" cy="44" r="24" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
            <line x1="67" y1="61" x2="88" y2="82" stroke="currentColor" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round"/>
            <circle cx="50" cy="44" r="14" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1"/>
            <line x1="44" y1="44" x2="56" y2="44" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="38" x2="50" y2="50" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    ),
};

export type EmptyStateVariant =
    | 'work-order' | 'asset' | 'part' | 'location' | 'person'
    | 'request' | 'pm' | 'checklist' | 'meter' | 'file'
    | 'vendor' | 'generic' | 'search';

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title: string;
    description?: string;
    action?: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    /** Override illustration color (Tailwind text-* class) */
    colorClass?: string;
}

const sizeConfig = {
    sm: { wrap: 'py-10', art: 'w-24 h-20', title: 'text-[14px]', desc: 'text-[12px]' },
    md: { wrap: 'py-16', art: 'w-32 h-28', title: 'text-[15px]', desc: 'text-[13px]' },
    lg: { wrap: 'py-24', art: 'w-40 h-32', title: 'text-[16px]', desc: 'text-[13px]' },
};

export function EmptyState({
    variant = 'generic',
    title,
    description,
    action,
    size = 'md',
    className,
    colorClass = 'text-muted-foreground',
}: EmptyStateProps) {
    const { wrap, art, title: titleSize, desc: descSize } = sizeConfig[size];
    const illus = illustrations[variant] ?? illustrations.generic;

    return (
        <div className={cn(
            'flex flex-col items-center justify-center text-center select-none animate-in fade-in duration-500',
            wrap,
            className
        )}>
            {/* Illustration */}
            <div className={cn('relative mb-5', art, colorClass)}>
                {/* Subtle glow behind illustration */}
                <div className="absolute inset-0 rounded-full bg-current opacity-[0.04] blur-2xl scale-150 pointer-events-none" />
                {illus}
            </div>

            {/* Text */}
            <h3 className={cn('font-bold text-foreground mb-1 leading-tight', titleSize)}>
                {title}
            </h3>
            {description && (
                <p className={cn('text-muted-foreground max-w-xs', descSize)}>
                    {description}
                </p>
            )}

            {/* CTA */}
            {action && (
                <div className="mt-5">
                    {action}
                </div>
            )}
        </div>
    );
}

/**
 * Convenience wrapper for use inside a <td colSpan> in table bodies.
 */
export function TableEmptyState({
    colSpan,
    ...props
}: EmptyStateProps & { colSpan?: number }) {
    return (
        <tr>
            <td colSpan={colSpan ?? 20} className="px-4">
                <EmptyState {...props} />
            </td>
        </tr>
    );
}
