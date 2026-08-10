import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useThemeStore } from '../store/useThemeStore';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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
            
            // Reset sidebar collapse state to make it visible by default after login
            useThemeStore.setState({ sidebarCollapsed: false });
            
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Connection to CMMS Engine failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-6">
                    <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-2xl backdrop-blur-xl">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-white mb-1 uppercase">
                        CMMS ENGINE
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium tracking-wide">
                        Enterprise Asset Intelligence by Antigravity
                    </p>
                </div>

                <div className="glass-panel p-6 sm:p-8 rounded-[32px] shadow-2xl border-white/10">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 mb-2 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-bold italic"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-60">
                                 Secure Email
                             </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/10"
                                    placeholder="verify@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-60">
                                Passphrase
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-white/10"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary' : 'border-white/20 group-hover:border-white/40'}`}>
                                    {rememberMe && <motion.div initial={{scale:0}} animate={{scale:1}} className="w-1.5 h-1.5 bg-white rounded-sm" />}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground italic group-hover:text-white/80 transition-colors" onClick={() => setRememberMe(!rememberMe)}>
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
                            className="w-full btn-primary h-12 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform group text-sm"
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

                    <div className="mt-5 flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-3 my-1 opacity-40">
                            <div className="w-full h-[1px] bg-white/10" />
                            <span className="text-[9px] font-black text-white whitespace-nowrap tracking-widest">OR</span>
                            <div className="w-full h-[1px] bg-white/10" />
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
                            className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-white transition-all active:scale-[0.98]"
                        >
                            <Shield className="w-4 h-4 text-primary" />
                            SIGN IN WITH SSO
                        </button>
                    </div>

                    <div className="mt-6 text-center pt-2 border-t border-white/5">
                        <p className="text-muted-foreground text-[9px] font-black italic opacity-40 uppercase tracking-[0.2em]">
                            New to CMMS?{' '}
                            <Link to="/register" className="text-primary hover:text-primary/80 transition-colors opacity-100">Create Tenant ID</Link>
                        </p>
                    </div>
                </div>

                <p className="mt-6 text-center text-[10px] text-muted-foreground font-medium tracking-widest opacity-40 uppercase italic">
                    Certified Security • Flowchart Compliant • v2.1.0
                </p>
            </motion.div>
        </div>
    );
};

