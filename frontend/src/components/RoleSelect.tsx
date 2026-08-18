import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Shield, DollarSign, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const RoleSelect = ({ value, onChange, roles }: { value: string, onChange: (id: string) => void, roles: any[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedRole = roles.find(r => r.id === value);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const updateCoords = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 6,
                left: rect.left,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Also check if clicking inside the portal dropdown
                const portal = document.getElementById('role-select-portal');
                if (portal && portal.contains(event.target as Node)) return;
                setIsOpen(false);
            }
        };

        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    const hasDollarBadge = (roleName: string) => {
        const paidRoles = ['Administrator', 'Maintenance Manager', 'Limited Administrator', 'Limited Technician', 'Technician'];
        return paidRoles.includes(roleName);
    };

    const dropdown = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    id="role-select-portal"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{
                        position: 'fixed',
                        top: coords.top,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 99999,
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        padding: '8px 0',
                        color: '#1e293b',
                    }}
                >
                    <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => {
                                    onChange(role.id);
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    textAlign: 'left',
                                    display: 'block',
                                    backgroundColor: value === role.id ? '#eef2ff' : 'transparent',
                                    borderBottom: '1px solid #f8fafc',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.15s',
                                    color: '#1e293b',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = value === role.id ? '#eef2ff' : '#f8fafc')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = value === role.id ? '#eef2ff' : 'transparent')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{role.name}</span>
                                        {hasDollarBadge(role.name) && (
                                            <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center' }}>
                                                $
                                            </span>
                                        )}
                                    </div>
                                    {value === role.id && <Check className="w-4 h-4" style={{ color: '#4f46e5' }} />}
                                </div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                                    {role.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => {
                    updateCoords();
                    setIsOpen(!isOpen);
                }}
                className={cn(
                    "w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded-lg text-[14px] font-medium text-left flex items-center justify-between transition-all bg-white",
                    isOpen ? "border-indigo-500 ring-4 ring-indigo-500/10" : "hover:border-slate-200"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <span className={cn("truncate", !selectedRole && "text-slate-400")}>
                        {selectedRole ? selectedRole.name : "Select User Role"}
                    </span>
                    {selectedRole && hasDollarBadge(selectedRole.name) && (
                        <div className="flex-shrink-0 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center">
                            <DollarSign className="w-3 h-3" />
                        </div>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {createPortal(dropdown, document.body)}
        </div>
    );
};
