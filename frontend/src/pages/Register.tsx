import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Shield, 
    ArrowRight, 
    Mail, 
    Lock, 
    User, 
    Building2, 
    Users, 
    Phone,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { authApi } from '../api/auth';
import { motion, AnimatePresence } from 'framer-motion';

const registerSchema = z.object({
  firstName: z.string().min(2, "Required (min 2)"),
  lastName: z.string().min(2, "Required (min 2)"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
  teamSize: z.enum(["1-5", "6-10", "11-20", "21-50", "51-100", "100+"]),
  password: z.string().min(8, "Passphrase must be at least 8 characters")
});

type RegisterData = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            teamSize: "1-5"
        }
    });

    const companyNameValue = watch("companyName");

    const onSubmit = async (data: RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("🚀 Starting registration for:", data.companyName);
            const result = await authApi.register(data);
            
            // Success handshake
            localStorage.setItem('token', result.accessToken);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('organization', JSON.stringify(result.organization));
            
            setIsSuccess(true);
            console.log("✅ Registration successful. Organizations synced.");
            
            // Hold briefly to show success state before redirect
            setTimeout(() => {
                navigate('/dashboard');
            }, 2500);
        } catch (err: any) {
            console.error("❌ Registration failure:", err);
            setError(err.response?.data?.message || 'The CMMS system encountered a registration bottleneck. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-[#050505] text-white overflow-hidden register-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
                .register-container {
                    font-family: 'Outfit', sans-serif;
                }
                .glossy-input {
                    color: #ffffff !important;
                    background-color: rgba(255, 255, 255, 0.03) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                .glossy-input:focus {
                    background-color: rgba(255, 255, 255, 0.05) !important;
                    border-color: #3b82f6 !important;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
                }
                .glossy-input::placeholder {
                    color: rgba(255, 255, 255, 0.3) !important;
                }
            `}</style>
            
            {/* Left Column: Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0c] items-center justify-center p-12 overflow-hidden border-r border-white/5">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                
                <div className="relative z-10 max-w-lg">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 mb-8 shadow-2xl backdrop-blur-xl">
                            <Shield className="w-12 h-12 text-primary" />
                        </div>
                        <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-[0.9] mb-6">
                            Start Managing <br/>
                            <span className="text-primary">Maintenance</span> <br/>
                            Smarter
                        </h1>
                        <p className="text-xl text-muted-foreground font-medium mb-12 leading-relaxed opacity-80">
                            Enterprise Asset Intelligence designed for reliability teams. Deploy your local tenant in seconds.
                        </p>

                        <div className="space-y-6">
                            {[
                                "Hyper-Secure Multi-Tenant Isolation",
                                "AI-Powered MTBF/MTTR Analytics",
                                "Mobile-First Offline Maintenance"
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="p-1 rounded-full bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold italic uppercase tracking-wider text-sm opacity-70 group-hover:opacity-100 transition-opacity">
                                        {feature}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
                
                {/* Decorative Bottom Tag */}
                <div className="absolute bottom-12 left-12 flex items-center gap-3 opacity-30 select-none">
                    <div className="h-[1px] w-12 bg-white" />
                    <span className="text-[10px] uppercase font-black tracking-[0.5em] italic">Antigravity Engine v2.4.0</span>
                </div>
            </div>

            {/* Right Column: Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-24 relative overflow-y-auto bg-gradient-to-b from-[#050508] to-[#010102]">
                <div className="absolute top-1/4 right-1/4 w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 lg:hidden text-center">
                         <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-2">
                            CMMS ENGINE
                        </h1>
                    </div>

                    <div className="relative overflow-hidden p-8 lg:p-12 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] border border-white/15 bg-gradient-to-br from-white/[0.04] to-white/[0.01] backdrop-blur-[35px]">
                        {/* Specular high-end highlights */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="absolute -top-[20%] -left-[20%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[60px] pointer-events-none" />

                        <div className="mb-10 text-center lg:text-left relative z-10">
                            <h2 className="text-3xl font-black italic uppercase tracking-tight mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Get Started Free</h2>
                            <p className="text-muted-foreground text-sm font-medium italic">Create your enterprise organization ID</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div 
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[32px] bg-primary/10 border border-primary/20 flex flex-col items-center text-center gap-6 relative z-10"
                                >
                                    <div className="p-4 rounded-full bg-primary/20 text-primary animate-bounce">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white mb-2">Tenant Deployed</h3>
                                        <p className="text-sm text-muted-foreground font-medium leading-relaxed italic opacity-80">
                                            Initializing secure environment for <span className="text-white font-bold">{companyNameValue || 'your team' }</span>. Redirecting to workspace...
                                        </p>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 2 }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-xs font-bold italic"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">First Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    {...register("firstName")}
                                                    className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:outline-none transition-all shadow-inner"
                                                    placeholder="Jane"
                                                />
                                            </div>
                                            {errors.firstName && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.firstName.message}</span>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">Last Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    {...register("lastName")}
                                                    className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:outline-none transition-all"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                            {errors.lastName && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.lastName.message}</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">Work Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                {...register("email")}
                                                className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:outline-none transition-all"
                                                placeholder="jane@company.com"
                                            />
                                        </div>
                                        {errors.email && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.email.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">Company Name</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                {...register("companyName")}
                                                className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:outline-none transition-all"
                                                placeholder="Acme Manufacturing"
                                            />
                                        </div>
                                        {errors.companyName && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.companyName.message}</span>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">Team Size</label>
                                            <div className="relative group">
                                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary pointer-events-none transition-colors" />
                                                <select 
                                                    {...register("teamSize")}
                                                    className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-10 text-sm font-semibold focus:outline-none appearance-none transition-all cursor-pointer"
                                                >
                                                    <option value="1-5" className="bg-[#0f111a] text-white">1-5 Employees</option>
                                                    <option value="6-10" className="bg-[#0f111a] text-white">6-10 Employees</option>
                                                    <option value="11-20" className="bg-[#0f111a] text-white">11-20 Employees</option>
                                                    <option value="21-50" className="bg-[#0f111a] text-white">21-50 Employees</option>
                                                    <option value="51-100" className="bg-[#0f111a] text-white">51-100 Employees</option>
                                                    <option value="100+" className="bg-[#0f111a] text-white">100+ Employees</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-300 transition-colors">▼</div>
                                                {errors.teamSize && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.teamSize.message}</span>}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">Phone</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    {...register("phone")}
                                                    className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:outline-none transition-all"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                            {errors.phone && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.phone.message}</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1 italic opacity-80">Account Passphrase</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                type="password"
                                                {...register("password")}
                                                className="w-full glossy-input rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold focus:outline-none transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        {errors.password && <span className="text-[10px] text-destructive font-bold italic ml-1">{errors.password.message}</span>}
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full btn-primary h-14 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform group mt-8 cursor-pointer"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                DEPLOY TENANT
                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </AnimatePresence>

                        <div className="mt-8 text-center relative z-10">
                            <p className="text-muted-foreground text-xs font-semibold italic opacity-50 uppercase tracking-widest">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary hover:underline underline-offset-4 opacity-100 transition-all font-bold">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
