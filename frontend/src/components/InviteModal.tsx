import { useState, useRef, useEffect } from 'react';
import { X, Mail, Shield, Plus, Trash2, Loader2, DollarSign, ChevronDown, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InviteRow {
    id: string;
    email: string;
    roleId: string;
}

const RoleSelect = ({ value, onChange, roles }: { value: string, onChange: (id: string) => void, roles: any[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedRole = roles.find(r => r.id === value);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const updateCoords = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width
                });
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

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
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

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{ 
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                        }}
                        className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 z-[9999] overflow-hidden py-2"
                    >
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {roles.map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(role.id);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group",
                                        value === role.id && "bg-indigo-50/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
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
        </div>
    );
};

export const InviteModal = ({ isOpen, onClose }: InviteModalProps) => {
    const queryClient = useQueryClient();
    const [rows, setRows] = useState<InviteRow[]>([
        { id: Math.random().toString(), email: '', roleId: '' }
    ]);

    useEffect(() => {
        if (!isOpen) {
            setRows([{ id: Math.random().toString(), email: '', roleId: '' }]);
        }
    }, [isOpen]);

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/roles');
            // Filter out system organization roles or sort them properly
            return response.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (invites: InviteRow[]) => {
            const validInvites = invites.filter(i => i.email && i.roleId);
            const promises = validInvites.map(invite => 
                api.post('/invitations/invite', {
                    email: invite.email,
                    roleId: invite.roleId,
                    name: invite.email.split('@')[0],
                })
            );
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Invitations dispatched successfully');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to dispatch invitations');
        }
    });

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(), email: '', roleId: '' }]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof InviteRow, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" 
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-[650px] bg-white rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)]"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[20px] font-bold text-slate-800">Invite Users</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header */}
                <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[13px] text-slate-500 font-medium">Unused paid seats: 9</span>
                    <a href="#" className="text-[13px] text-indigo-600 font-medium hover:underline">
                        Learn more about seats, inviting, and roles
                    </a>
                </div>

                {/* Body */}
                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {rows.map((row) => (
                            <motion.div 
                                key={row.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-4 group"
                            >
                                <div className="flex-1 space-y-1">
                                    <label className="text-[12px] font-bold text-slate-500 block">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="email"
                                            placeholder="Enter email address"
                                            className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-100 rounded-lg text-[14px] font-medium focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            value={row.email}
                                            onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="w-[240px] space-y-1">
                                    <label className="text-[12px] font-bold text-slate-500 block">Role</label>
                                    <RoleSelect 
                                        value={row.roleId} 
                                        onChange={(id) => updateRow(row.id, 'roleId', id)} 
                                        roles={roles} 
                                    />
                                </div>

                                <div className="pt-5">
                                    <button 
                                        onClick={() => removeRow(row.id)}
                                        disabled={rows.length === 1}
                                        className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-0"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button 
                        onClick={addRow}
                        className="flex items-center gap-2 text-indigo-600 font-bold text-[14px] hover:text-indigo-700 transition-colors pt-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add User
                    </button>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 border border-slate-200 rounded-lg text-[15px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        disabled={mutation.isPending || rows.some(r => !r.email || !r.roleId)}
                        onClick={() => mutation.mutate(rows)}
                        className={cn(
                            "px-10 py-2.5 bg-indigo-600 text-white rounded-lg text-[15px] font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                        )}
                    >
                        {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Invite
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
