import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckCircle2, AlertCircle, X, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';

interface CompleteWorkOrderModalProps {
    workOrderId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const CompleteWorkOrderModal = ({ workOrderId, onClose, onSuccess }: CompleteWorkOrderModalProps) => {
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    // Fetch Work Order complete configuration settings
    const { data: woSettings = [] } = useQuery<any[]>({
        queryKey: ['wo-settings'],
        queryFn: async () => {
            const response = await api.get('/settings');
            const data = Array.isArray(response.data) ? response.data : [];
            return data.filter((s: any) => s.key.startsWith('wo.'));
        },
        staleTime: 60000,
    });

    // Helper: get complete field config (Optional | Required | Hidden)
    const fieldConf = (field: string): 'Optional' | 'Required' | 'Hidden' => {
        const key = `wo.conf.complete.${field}`;
        return (woSettings.find((s: any) => s.key === key)?.value as any) || 'Optional';
    };

    const mutation = useMutation({
        mutationFn: async () => {
            // Validate Required fields based on configuration settings
            if (fieldConf('closeoutNotes') === 'Required' && !notes.trim()) {
                throw new Error('Closeout Notes are required to complete this Work Order.');
            }
            return api.patch(`/work-orders/${workOrderId}`, {
                status: 'COMPLETED',
                resolutionNotes: notes,
                rootCauseCode: 'MAINTENANCE_COMPLETED'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            onSuccess();
            onClose();
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || err.message || 'Failed to complete work order.');
        }
    });

    const closeoutNotesConf = fieldConf('closeoutNotes');
    const isSubmitDisabled = mutation.isPending || (closeoutNotesConf === 'Required' && !notes.trim());

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold">Complete Work Order</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-xs font-bold leading-tight uppercase tracking-wide">{error}</p>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Closeout Notes — controlled by wo.conf.complete.closeoutNotes */}
                    {closeoutNotesConf !== 'Hidden' && (
                        <div>
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 block">
                                Resolution / Closeout Notes
                                {closeoutNotesConf === 'Required' && <span className="text-red-400 ml-1">*</span>}
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-muted-foreground" />
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="What was fixed? E.g. Replaced worn bearings and re-lubricated housing..."
                                    rows={4}
                                    className="w-full glass-panel pl-12 pr-4 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all border-none bg-black/40"
                                />
                            </div>
                        </div>
                    )}

                    {/* Info message if closeoutNotes is Hidden but fields like time/cost are Optional */}
                    {closeoutNotesConf === 'Hidden' && (
                        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                            <p className="text-xs font-bold text-primary">
                                Completing this work order will mark it as COMPLETED in the system.
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-2xl border border-white/5 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => mutation.mutate()}
                            disabled={isSubmitDisabled}
                            className="flex-[2] btn-primary disabled:opacity-50 disabled:grayscale"
                        >
                            {mutation.isPending ? 'Verifying Compliance...' : 'Finish & Close'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
