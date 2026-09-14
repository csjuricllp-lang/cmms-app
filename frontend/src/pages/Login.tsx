import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { useThemeStore } from '../store/useThemeStore';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Force the global organization theme on the login page, overriding any cached user preferences
    useEffect(() => {
        useThemeStore.getState().setTheme('light-peach');
        useThemeStore.getState().setAccentColor('346.8 77.2% 49.8%');
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            // Set token and redirect
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Enforce default branding accent and workspace mood for the organization
            useThemeStore.getState().setTheme('light-peach');
            useThemeStore.getState().setAccentColor('346.8 77.2% 49.8%');
            useThemeStore.setState({ sidebarCollapsed: false });
            
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Connection to CMMS Engine failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-background">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/80/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-5">
                    <div className="inline-flex w-12 h-12 rounded-2xl bg-card border border-border mb-3 shadow-sm items-center justify-center">
                        <span className="text-primary font-black text-2xl italic leading-none pr-1">J</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground mb-1 uppercase">
                        CMMS Juric
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium tracking-wide">
                        Enterprise Asset Intelligence for Reliability Teams
                    </p>
                </div>

                <div className="bg-card p-5 sm:p-7 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-600 text-sm font-bold italic"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">
                                 Secure Email
                             </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                    placeholder="verify@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">
                                Passphrase
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-11 pr-11 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary' : 'border-slate-300 group-hover:border-slate-400 bg-card'}`}>
                                    {rememberMe && <motion.div initial={{scale:0}} animate={{scale:1}} className="w-1.5 h-1.5 bg-card rounded-sm" />}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground italic group-hover:text-foreground/90 transition-colors" onClick={() => setRememberMe(!rememberMe)}>
                                    Remember Me
                                </span>
                            </label>
                            <Link to="/forgot-password" className="relative z-50 cursor-pointer text-[9px] font-black uppercase tracking-[0.1em] text-primary hover:text-primary/80 transition-colors italic">
                                Forgot Passphrase?
                            </Link>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary h-11 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform group text-sm font-bold shadow-md shadow-primary/20"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    ENTER SYSTEM
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-4 flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-3 my-0.5">
                            <div className="w-full h-[1px] bg-slate-200" />
                            <span className="text-[9px] font-black text-slate-400 whitespace-nowrap tracking-widest uppercase">OR</span>
                            <div className="w-full h-[1px] bg-slate-200" />
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const emailInput = window.prompt("Enter your corporate email address to sign in with Single Sign-On (SSO):");
                                if (emailInput && emailInput.trim()) {
                                    const backendUrl = window.location.origin.replace('5173', '3000');
                                    window.location.href = `${backendUrl}/sso/initiate?email=${encodeURIComponent(emailInput.trim())}`;
                                }
                            }}
                            className="w-full h-11 bg-card hover:bg-transparent border border-border rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-foreground/90 transition-all active:scale-[0.98] shadow-sm"
                        >
                            <Shield className="w-4 h-4 text-primary" />
                            SIGN IN WITH SSO
                        </button>
                    </div>

                    <div className="mt-5 text-center pt-3 border-t border-slate-100">
                        <p className="text-muted-foreground text-[9px] font-black italic opacity-80 uppercase tracking-[0.2em]">
                            New to CMMS?{' '}
                            <Link to="/register" className="text-primary hover:text-primary/80 transition-colors">Create Tenant ID</Link>
                        </p>
                    </div>
                </div>

                <p className="mt-5 text-center text-[9px] text-slate-400 font-medium tracking-widest uppercase italic">
                    Certified Security • Flowchart Compliant • v2.1.0
                </p>
            </motion.div>
        </div>
    );
};


