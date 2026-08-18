import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Trash2, Plus, Loader2, Copy, Link2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
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

    // Per-row generated links: map from row id -> link string
    const [rowLinks, setRowLinks] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen) {
            setRows([{ id: Math.random().toString(), email: '', roleId: '' }]);
            setRowLinks({});
        }
    }, [isOpen]);

    const { data: roles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const response = await api.get('/roles');
            return response.data;
        }
    });

    // --- Mutation 1: Send Email Invite (original behaviour) ---
    const emailMutation = useMutation({
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
            toast.success('Invitations sent via email');
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send invitation email');
        }
    });

    // --- Mutation 2: Generate Invite Link (new behaviour) ---
    const linkMutation = useMutation({
        mutationFn: async (row: InviteRow) => {
            const res = await api.post('/invitations/invite', {
                email: row.email,
                roleId: row.roleId,
                name: row.email.split('@')[0],
            });
            return { rowId: row.id, token: res.data.token };
        },
        onSuccess: ({ rowId, token }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            const link = `${window.location.origin}/accept-invitation/${token}`;
            setRowLinks(prev => ({ ...prev, [rowId]: link }));
            toast.success('Invite link generated!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to generate invite link');
        }
    });

    const addRow = () => {
        setRows([...rows, { id: Math.random().toString(), email: '', roleId: '' }]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter(r => r.id !== id));
            setRowLinks(prev => { const next = { ...prev }; delete next[id]; return next; });
        }
    };

    const updateRow = (id: string, field: keyof InviteRow, value: string) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
        // Clear link if user edits the row
        if (rowLinks[id]) {
            setRowLinks(prev => { const next = { ...prev }; delete next[id]; return next; });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Link copied to clipboard!');
    };

    const isAnyRowIncomplete = rows.some(r => !r.email || !r.roleId);

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
                className="relative w-full max-w-[700px] bg-white rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.2)]"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[20px] font-bold text-slate-800">Invite Users</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header */}
                <div className="px-8 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-[13px] text-slate-500 font-medium">
                        Enter email and role. Use <span className="font-bold text-indigo-600">Invite</span> to send an email, or <span className="font-bold text-emerald-600">Generate Link</span> to get a copyable link.
                    </span>
                </div>

                {/* Body */}
                <div className="p-8 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {rows.map((row) => (
                            <motion.div
                                key={row.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-3"
                            >
                                {/* Row inputs */}
                                <div className="flex items-center gap-4">
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

                                    <div className="w-[220px] space-y-1">
                                        <label className="text-[12px] font-bold text-slate-500 block">Role</label>
                                        <RoleSelect
                                            value={row.roleId}
                                            onChange={(id) => updateRow(row.id, 'roleId', id)}
                                            roles={roles}
                                        />
                                    </div>

                                    {/* Generate Link button (per-row) */}
                                    <div className="pt-5">
                                        <button
                                            type="button"
                                            disabled={!row.email || !row.roleId || linkMutation.isPending}
                                            onClick={() => linkMutation.mutate(row)}
                                            title="Generate invite link"
                                            className="p-2.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-all disabled:opacity-40 disabled:pointer-events-none"
                                        >
                                            {linkMutation.isPending && linkMutation.variables?.id === row.id
                                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                                : <Link2 className="w-5 h-5" />
                                            }
                                        </button>
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
                                </div>

                                {/* Generated link display (per-row, shows inline) */}
                                {rowLinks[row.id] && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2"
                                    >
                                        <input
                                            readOnly
                                            value={rowLinks[row.id]}
                                            className="flex-1 bg-transparent text-[13px] font-medium text-slate-700 outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(rowLinks[row.id])}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-[12px] font-bold rounded-md hover:bg-emerald-700 transition-colors shrink-0"
                                        >
                                            <Copy className="w-3.5 h-3.5" /> Copy
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <button
                        onClick={addRow}
                        className="flex items-center gap-2 text-indigo-600 font-bold text-[14px] hover:text-indigo-700 transition-colors pt-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Another User
                    </button>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[12px] text-slate-400 font-medium flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                        Click the green link icon per row to generate a shareable link
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border border-slate-200 rounded-lg text-[15px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            disabled={emailMutation.isPending || isAnyRowIncomplete}
                            onClick={() => emailMutation.mutate(rows)}
                            className={cn(
                                "px-8 py-2.5 bg-indigo-600 text-white rounded-lg text-[15px] font-bold shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                            )}
                        >
                            {emailMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Invite via Email
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
