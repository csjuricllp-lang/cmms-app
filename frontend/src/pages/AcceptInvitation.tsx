import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Key, User, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export const AcceptInvitationPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [invitation, setInvitation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const validateToken = async () => {
            try {
                const response = await api.get(`/invitations/validate/${token}`);
                setInvitation(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Invalid or expired invitation link.');
            } finally {
                setLoading(false);
            }
        };

        if (token) validateToken();
    }, [token]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await api.post('/invitations/accept', {
                token,
                name: formData.name,
                password: formData.password
            });
            setSuccess(true);
            
            // Clear any existing admin sessions to prevent session bleed when testing locally
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('organization');

            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to joining organization.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-[2rem] glass-panel flex items-center justify-center animate-spin">
                    <Loader2 className="w-6 h-6 text-primary" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Authenticating Invitation...</p>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full glass-panel p-8 rounded-[2.5rem] border-red-500/20 text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-white">Access Denied</h2>
                        <p className="text-muted-foreground mt-2">{error}</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all uppercase text-[10px] tracking-widest"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full glass-panel p-10 rounded-[2.5rem] border-green-500/20 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-white">Welcome Aboard!</h2>
                        <p className="text-muted-foreground mt-2 leading-relaxed">
                            Your account has been activated and you are now part of <span className="text-primary font-bold">@{invitation.organization.name}</span>.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Redirecting you to login...</p>
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
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mb-64" />

            <div className="max-w-lg w-full relative z-10">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Juric CMMS</h1>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                        Staff Activation Engine
                    </div>
                </div>

                <div className="glass-panel p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-white">Join the Force</h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            You've been invited by <span className="text-primary font-bold">{invitation.organization.name}</span> to manage critical infrastructure.
                        </p>
                    </div>

                    <form onSubmit={handleAccept} className="space-y-6" autoComplete="off">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3 text-primary" />
                                Full Legal Name
                            </label>
                            <input
                                type="text"
                                required
                                autoComplete="off"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:bg-white/[0.08]"
                                placeholder="Technician Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Key className="w-3 h-3 text-primary" />
                                Secure Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:bg-white/[0.08]"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-3 h-3 text-primary" />
                                Confirm Password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:bg-white/[0.08]"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input 
                                type="checkbox" 
                                id="show-password" 
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="rounded bg-white/5 border-white/10 text-primary focus:ring-primary/20 cursor-pointer"
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
                            type="submit"
                            disabled={submitting}
                            className="w-full btn-primary py-5 rounded-[1.5rem] font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Complete Onboarding
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-10 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                    Powered by Antigravity OS • Secure Infrastructure
                </p>
            </div>
        </div>
    );
};
