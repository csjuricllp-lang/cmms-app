import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Trash2, Plus, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { RoleSelect } from './RoleSelect';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface InviteRow {
    id: string;
    email: string;
    roleId: string;
}

export const InviteModal = ({ isOpen, onClose }: InviteModalProps) => {
    const queryClient = useQueryClient();
    const [rows, setRows] = useState<InviteRow[]>([
        { id: Math.random().toString(), email: '', roleId: '' }
    ]);
    
    const [generatedLinks, setGeneratedLinks] = useState<{email: string, link: string}[] | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setRows([{ id: Math.random().toString(), email: '', roleId: '' }]);
            setGeneratedLinks(null);
        }
    }, [isOpen]);

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/roles');
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
                }).then(res => ({ email: invite.email, token: res.data.token }))
            );
            return Promise.all(promises);
        },
        onSuccess: (results) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Invitations generated successfully');
            
            const links = results.map(r => ({
                email: r.email,
                link: \\/accept-invitation/\\
            }));
            
            setGeneratedLinks(links);
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
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Link copied to clipboard!");
    }

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
                    <h2 className="text-[20px] font-bold text-slate-800">
                        {generatedLinks ? 'Invitation Links Ready' : 'Invite Users'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!generatedLinks && (
                    <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[13px] text-slate-500 font-medium">Generate magic invite links to bypass email.</span>
                    </div>
                )}

                {/* Body */}
                <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {generatedLinks ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-green-50 text-green-700 rounded-xl border border-green-200">
                                <CheckCircle2 className="w-6 h-6 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-[14px]">Success!</h4>
                                    <p className="text-[13px] opacity-90 mt-0.5">Please copy the links below and send them directly to your users.</p>
                                </div>
                            </div>
                            
                            {generatedLinks.map((item, idx) => (
                                <div key={idx} className="space-y-2">
                                    <label className="text-[12px] font-bold text-slate-500 block">Link for {item.email}</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            readOnly 
                                            value={item.link} 
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-medium text-slate-600 outline-none"
                                        />
                                        <button 
                                            onClick={() => copyToClipboard(item.link)}
                                            className="px-4 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold flex items-center gap-2 transition-colors border border-indigo-100"
                                        >
                                            <Copy className="w-4 h-4" /> Copy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    {generatedLinks ? (
                        <button 
                            onClick={onClose}
                            className="px-8 py-2.5 bg-slate-800 text-white rounded-lg text-[15px] font-bold shadow-lg shadow-slate-200 transition-all hover:bg-slate-900 active:scale-95"
                        >
                            Done
                        </button>
                    ) : (
                        <>
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
                                Generate Links
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
