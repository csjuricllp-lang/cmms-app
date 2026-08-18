import { useState, useRef, useEffect } from 'react';
import { Shield, DollarSign, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const RoleSelect = ({ value, onChange, roles }: { value: string, onChange: (id: string) => void, roles: any[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedRole = roles.find(r => r.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasDollarBadge = (roleName: string) => {
        const paidRoles = ['Administrator', 'Maintenance Manager', 'Limited Administrator', 'Limited Technician', 'Technician'];
        return paidRoles.includes(roleName);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded-lg text-[14px] font-medium text-left flex items-center justify-between transition-all bg-white text-slate-700",
                    isOpen ? "border-indigo-500 ring-4 ring-indigo-500/10" : "hover:border-slate-200"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <span className={cn("truncate", !selectedRole && "text-slate-400")}>
                        {selectedRole ? selectedRole.name : "Select User Role"}
                    </span>
                    {selectedRole && hasDollarBadge(selectedRole.name) && (
                        <span className="flex-shrink-0 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-black">$</span>
                    )}
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown opens UPWARD so it's always visible inside the modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 6px)',
                            left: 0,
                            right: 0,
                            zIndex: 9999,
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
                            border: '1px solid #e2e8f0',
                            overflow: 'hidden',
                            padding: '6px 0',
                        }}
                    >
                        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                            {roles.length === 0 && (
                                <p style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                                    Loading roles...
                                </p>
                            )}
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => { onChange(role.id); setIsOpen(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        textAlign: 'left',
                                        display: 'block',
                                        backgroundColor: value === role.id ? '#eef2ff' : 'transparent',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        color: '#1e293b',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = value === role.id ? '#eef2ff' : '#f8fafc')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = value === role.id ? '#eef2ff' : 'transparent')}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{role.name}</span>
                                            {hasDollarBadge(role.name) && (
                                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>$</span>
                                            )}
                                        </div>
                                        {value === role.id && <Check style={{ width: '16px', height: '16px', color: '#4f46e5', flexShrink: 0 }} />}
                                    </div>
                                    {role.description && (
                                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: 500 }}>{role.description}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
