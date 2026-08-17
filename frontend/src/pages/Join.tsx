import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Key, User, ArrowRight, Loader2, AlertCircle, Phone, Mail } from 'lucide-react';
import { fetchApi } from '../lib/api';

export const JoinPage = () => {
    const [searchParams] = useSearchParams();
    const role = searchParams.get('role');
    const orgId = searchParams.get('org');
    
    const navigate = useNavigate();
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!role || !orgId) {
            setError("Invalid Join Link. Missing role or organization ID.");
        }
    }, [role, orgId]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!role || !orgId) {
             setError("Invalid Join Link. Missing role or organization ID.");
             return;
        }

        try {
            setSubmitting(true);
            setError(null);
            
            const response = await fetchApi('/auth/register-open', {
                method: 'POST',
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone || '0000000000',
                    password: formData.password,
                    roleName: role,
                    organizationId: orgId
                })
            });

            if (response.error) throw new Error(response.error);
            
            // Set token and redirect
            localStorage.setItem('token', response.accessToken);
            if (response.user) {
                localStorage.setItem('user', JSON.stringify(response.user));
            }
            if (response.organization) {
                localStorage.setItem('organizationConfig', JSON.stringify(response.organization));
            }

            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 3000);
            
        } catch (err: any) {
            setError(err.message || 'Failed to complete registration');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="max-w-md w-full glass-panel p-10 rounded-[3rem] shadow-2xl text-center">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">Welcome Aboard</h2>
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Redirecting you to dashboard...</p>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary animate-[progress_3s_ease-in-out]" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="max-w-lg w-full relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Juric CMMS</h1>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                        Open Registration Engine
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-white">Join the Team</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            You are registering for the role of <span className="text-primary font-bold">{role || 'Unknown'}</span>.
                        </p>
                    </div>

                    <form onSubmit={handleAccept} className="space-y-6" autoComplete="off">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3 text-primary" /> First Name
                                </label>
                                <input
                                    type="text" required
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3 text-primary" /> Last Name
                                </label>
                                <input
                                    type="text" required
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Mail className="w-3 h-3 text-primary" /> Email
                            </label>
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Key className="w-3 h-3 text-primary" /> Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"} required minLength={8}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Key className="w-3 h-3 text-primary" /> Confirm Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"} required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input 
                                type="checkbox" id="show-password" 
                                checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)}
                                className="rounded bg-white/5 border-white/10 text-primary cursor-pointer"
                            />
                            <label htmlFor="show-password" className="text-xs text-muted-foreground cursor-pointer select-none">
                                Show Passwords
                            </label>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-xs text-red-500 font-bold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={submitting || !role || !orgId}
                            className="w-full btn-primary py-5 rounded-[1.5rem] font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Complete Registration
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
