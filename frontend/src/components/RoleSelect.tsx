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
                    }}
                    className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden py-2"
                >
                    <div className="max-h-[260px] overflow-y-auto">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => {
                                    onChange(role.id);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                                    value === role.id && "bg-indigo-50/50"
                                )}
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800 text-[14px]">{role.name}</span>
                                        {hasDollarBadge(role.name) && (
                                            <div className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[10px] font-black flex items-center">
                                                <DollarSign className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    {value === role.id && <Check className="w-4 h-4 text-indigo-600" />}
                                </div>
                                <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
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
