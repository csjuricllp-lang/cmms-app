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
    CircleCheck,
    AlertCircle,
    Eye,
    EyeOff
} from 'lucide-react';
import { authApi } from '../api/auth';
import { motion, AnimatePresence } from 'framer-motion';

const registerSchema = z.object({
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Required"),
  companyName: z.string().min(1, "Required"),
  teamSize: z.enum(["1-5", "6-10", "11-20", "21-50", "51-100", "100+"]),
  password: z.string().min(8, "Min 8 chars")
});

type RegisterData = z.infer<typeof registerSchema>;

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export const RegisterPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<RegisterData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { teamSize: "1-5" }
    });

    const companyNameValue = watch("companyName");

    const onSubmit = async (data: RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await authApi.register(data);
            
            localStorage.setItem('token', result.accessToken);
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('organization', JSON.stringify(result.organization));
            
            setIsSuccess(true);
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 2500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'The CMMS system encountered an error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[100dvh] w-full flex bg-background text-foreground overflow-hidden">
            {/* Left Column: Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-muted items-center justify-center p-12 overflow-hidden border-r border-border">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
                
                <div className="relative z-10 max-w-lg">
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, type: 'spring', damping: 25 }}
                    >
                        <div className="inline-flex w-12 h-12 rounded-2xl bg-card border border-border mb-3 shadow-sm items-center justify-center">
                            <span className="text-primary font-black text-2xl italic leading-none pr-1">J</span>
                        </div>
                        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-[0.9] mb-6 text-foreground">
                            Start Managing <br/>
                            <span className="text-primary">Maintenance</span> <br/>
                            Smarter
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium mb-12 leading-relaxed">
                            Enterprise Asset Intelligence designed for reliability teams. Deploy your local tenant in seconds.
                        </p>

                        <div className="space-y-5">
                            {[
                                "Secure Multi-Tenant Isolation",
                                "Advanced Asset Analytics",
                                "Mobile-First Maintenance"
                            ].map((feature, i) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    key={i} 
                                    className="flex items-center gap-4 group"
                                >
                                    <div className="p-1 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <CircleCheck className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold italic uppercase tracking-wider text-sm text-slate-600 group-hover:text-foreground transition-colors">
                                        {feature}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
                
                <div className="absolute bottom-8 left-12 flex items-center gap-3 opacity-40 select-none">
                    <div className="h-[1px] w-8 bg-slate-400" />
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] italic text-muted-foreground">CMMS Engine v2.1.0</span>
                </div>
            </div>

            {/* Right Column: Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-y-auto">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-6 lg:hidden text-center">
                        <div className="inline-flex w-12 h-12 rounded-2xl bg-card border border-border mb-3 shadow-sm items-center justify-center">
                            <span className="text-primary font-black text-2xl italic leading-none pr-1">J</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground mb-1 uppercase">
                            CMMS Juric
                        </h1>
                    </div>

                    <div className="relative p-6 sm:p-8 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 bg-card">
                        <div className="mb-6 text-center lg:text-left relative z-10">
                            <h2 className="text-2xl font-black italic uppercase tracking-tight mb-1 text-foreground">Get Started Free</h2>
                            <p className="text-muted-foreground text-xs font-medium italic">Create your enterprise organization ID</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div 
                                    key="success-message"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[24px] bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center gap-5 relative z-10"
                                >
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                        transition={{ type: 'spring', damping: 10 }}
                                        className="p-4 rounded-full bg-emerald-100 text-emerald-600"
                                    >
                                        <CircleCheck className="w-10 h-10" />
                                    </motion.div>
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tight text-emerald-900 mb-2">Tenant Deployed</h3>
                                        <p className="text-xs text-emerald-700 font-medium leading-relaxed italic opacity-90">
                                            Initializing secure environment for <span className="font-bold">{companyNameValue || 'your team' }</span>. Redirecting to workspace...
                                        </p>
                                    </div>
                                    <div className="w-full bg-emerald-200 h-1 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 2 }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.form 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="show"
                                    onSubmit={handleSubmit(onSubmit)} 
                                    className="space-y-3 relative z-10"
                                    autoComplete="off"
                                >
                                    <AnimatePresence mode="wait">
                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-600 text-[11px] font-bold italic"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.div variants={itemVariants} className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">First Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    {...register("firstName")}
                                                    className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                                    placeholder="Jane"
                                                />
                                            </div>
                                            {errors.firstName && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.firstName.message}</span>}
                                        </motion.div>
                                        <motion.div variants={itemVariants} className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">Last Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    {...register("lastName")}
                                                    className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                            {errors.lastName && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.lastName.message}</span>}
                                        </motion.div>
                                    </div>

                                    <motion.div variants={itemVariants} className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">Work Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                {...register("email")}
                                                autoComplete="off"
                                                className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                                placeholder="jane@company.com"
                                            />
                                        </div>
                                        {errors.email && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.email.message}</span>}
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">Company Name</label>
                                        <div className="relative group">
                                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                {...register("companyName")}
                                                className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                                placeholder="Acme Manufacturing"
                                            />
                                        </div>
                                        {errors.companyName && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.companyName.message}</span>}
                                    </motion.div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.div variants={itemVariants} className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">Team Size</label>
                                            <div className="relative group">
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary pointer-events-none transition-colors" />
                                                <select 
                                                    {...register("teamSize")}
                                                    className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-8 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="1-5">1-5 Employees</option>
                                                    <option value="6-10">6-10 Employees</option>
                                                    <option value="11-20">11-20 Employees</option>
                                                    <option value="21-50">21-50 Employees</option>
                                                    <option value="51-100">51-100 Employees</option>
                                                    <option value="100+">100+ Employees</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-primary transition-colors">▼</div>
                                                {errors.teamSize && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.teamSize.message}</span>}
                                            </div>
                                        </motion.div>
                                        <motion.div variants={itemVariants} className="space-y-1">
                                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">Phone</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input 
                                                    {...register("phone")}
                                                    className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                                    placeholder="+1 (555) 000-0000"
                                                />
                                            </div>
                                            {errors.phone && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.phone.message}</span>}
                                        </motion.div>
                                    </div>

                                    <motion.div variants={itemVariants} className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 italic opacity-80">Account Passphrase</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                type={showPassword ? "text" : "password"}
                                                {...register("password")}
                                                autoComplete="new-password"
                                                className="w-full bg-transparent border border-border rounded-xl py-2.5 pl-9 pr-10 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400"
                                                placeholder="••••••••"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <span className="text-[9px] text-rose-500 font-bold italic ml-1">{errors.password.message}</span>}
                                    </motion.div>

                                    <motion.button 
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full btn-primary h-11 flex items-center justify-center gap-2 mt-4 cursor-pointer text-sm font-bold shadow-md shadow-primary/20"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                DEPLOY TENANT
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </motion.button>
                                </motion.form>
                            )}
                        </AnimatePresence>

                        <div className="mt-5 text-center relative z-10 pt-3 border-t border-slate-100">
                            <p className="text-muted-foreground text-[10px] font-bold italic uppercase tracking-widest">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary hover:underline underline-offset-4 transition-all font-black">Sign in</Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
