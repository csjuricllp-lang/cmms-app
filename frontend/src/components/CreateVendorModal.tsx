
import { useState } from 'react';
import { X, UserPlus, Globe, Mail, Phone, MapPin, Save, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface CreateVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateVendorModal = ({ isOpen, onClose }: CreateVendorModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        isPreferred: false
    });

    const createVendorMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/vendors', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            toast.success('Supplier authorized successfully!');
            onClose();
            setFormData({ name: '', email: '', phone: '', address: '', website: '', isPreferred: false });
        },
        onError: () => {
            toast.error('Identity verification failed. Please try again.');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
            
            <div className="relative w-full max-w-[600px] glass-panel border border-white/10 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-4 rounded-3xl bg-primary/10 border border-primary/20 text-primary">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Authorize Supplier</h2>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Vendor Network Node</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                        <X className="w-6 h-6 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {/* Identification */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">Supplier Title</label>
                            <input 
                                type="text" 
                                placeholder="Global Dynamics Ltd."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">Communications Node (Email)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                    <input 
                                        type="email" 
                                        placeholder="sales@vendor.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">Vocal Link (Phone)</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                    <input 
                                        type="text" 
                                        placeholder="+1-555-092-2342"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">Digital HQ (Website)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                <input 
                                    type="text" 
                                    placeholder="https://vendor-global.com"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-2">Geographic Coordinates (Address)</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-6 w-4 h-4 text-primary" />
                                <textarea 
                                    rows={3}
                                    placeholder="Enter physical logistics center address..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={() => setFormData({ ...formData, isPreferred: !formData.isPreferred })}
                            className={`w-full p-6 rounded-3xl border transition-all flex items-center justify-between group ${
                                formData.isPreferred ? 'bg-primary/10 border-primary/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${formData.isPreferred ? 'bg-primary text-white' : 'bg-white/10 text-muted-foreground'}`}>
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-black italic text-white uppercase tracking-tighter">Strategic Partnership Status</p>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Mark as Preferred Logistics Node</p>
                                </div>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                formData.isPreferred ? 'border-primary bg-primary text-white' : 'border-white/20'
                            }`}>
                                {formData.isPreferred && <Save className="w-3 h-3" />}
                            </div>
                        </button>
                    </div>

                    <button 
                        onClick={() => createVendorMutation.mutate(formData)}
                        disabled={!formData.name || createVendorMutation.isPending}
                        className={`w-full py-6 rounded-3xl bg-primary text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 transition-all active:scale-95 ${
                            (!formData.name || createVendorMutation.isPending) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:brightness-110'
                        }`}
                    >
                        {createVendorMutation.isPending ? 'Validating Registry...' : 'Initialize Supplier Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
};
