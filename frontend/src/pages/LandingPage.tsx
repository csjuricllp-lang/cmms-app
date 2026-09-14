import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, 
  Settings, 
  BarChart3, 
  Wrench, 
  ShieldCheck,
  Zap,
  Smartphone,
  CheckCircle2,
  Box,
  Users,
  Play,
  TrendingUp,
  Activity,
  LayoutDashboard,
  ClipboardList,
  RefreshCcw,
  CheckSquare,
  MessageSquare,
  MapPin,
  Package,
  Gauge,
  ShoppingCart,
  Truck,
  Files,
  Sparkles
} from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';

export const LandingPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  // Redirect if logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/20 transition-colors duration-500 relative">
      
      {/* 1. Dynamic Premium Ambient Glow Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] opacity-70" />

        {/* Top Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        
        {/* Floating Animated Ambient Glow Blobs */}
        <motion.div 
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ y }}
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary/15 rounded-full blur-[160px] mix-blend-normal pointer-events-none" 
        />
        <motion.div 
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.45, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          style={{ y: useTransform(scrollYProgress, [0, 1], ['0%', '-50%']) }}
          className="absolute top-[35%] right-[-10%] w-[45%] h-[45%] bg-primary/10 rounded-full blur-[160px] mix-blend-normal pointer-events-none" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[25%] w-[50%] h-[40%] bg-primary/10 rounded-full blur-[180px] mix-blend-normal pointer-events-none" 
        />
      </div>
      
      {/* 2. Navigation Header */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-2xl transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 group-hover:shadow-primary/50 group-hover:scale-105 transition-all duration-500 relative overflow-hidden">
              <span className="text-white font-black text-xl italic leading-none pr-0.5">J</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter uppercase">CMMS <span className="text-primary">JURIC</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-10 font-bold text-[13px] tracking-widest uppercase">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform inline-block">Features</a>
            <a href="#roi" className="text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform inline-block">ROI</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors hover:scale-105 transform inline-block">Pricing</a>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hidden md:block text-[13px] font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
              Log In
            </Link>
            <Link to="/register" className="relative group overflow-hidden h-12 px-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-black uppercase tracking-widest text-[13px] hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/50 active:scale-95">
              <span className="relative z-10">Try for Free</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* 3. Hero Section */}
      <section className="pt-48 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/25 text-primary font-black uppercase tracking-widest text-[11px] mb-8 shadow-[0_0_20px_hsl(var(--primary-raw)/0.15)] relative overflow-hidden backdrop-blur-md"
          >
            <Zap className="w-4 h-4 fill-primary/50 animate-pulse text-primary" />
            <span>The Future of Maintenance is Here</span>
            <Sparkles className="w-3.5 h-3.5 text-primary/70 ml-1" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] mb-8"
          >
            Stop Fixing. <br/>
            <span className="relative inline-block text-primary drop-shadow-[0_0_35px_hsl(var(--primary-raw)/0.45)]">
              Start Preventing.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground font-bold max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            The world's most intelligent CMMS. Manage work orders, track assets, and orchestrate your entire maintenance team from a single, lightning-fast dashboard.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto h-16 px-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[15px] hover:shadow-[0_0_50px_hsl(var(--primary-raw)/0.5)] hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden group">
              <span className="relative z-10 flex items-center gap-3">
                Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto h-16 px-10 bg-card/80 border border-border text-foreground rounded-full flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[15px] hover:bg-muted hover:border-primary/40 transition-all duration-300 backdrop-blur-md shadow-xl hover:shadow-2xl">
              <Play className="w-5 h-5 fill-muted-foreground group-hover:fill-foreground transition-colors" /> Watch Demo
            </Link>
          </motion.div>
        </div>

        {/* 4. Premium Dashboard UI Mockup with Glow & 3D Tilt */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-6xl mx-auto mt-24 relative perspective-[2000px] group"
        >
          {/* Ambient Glow halo behind Mockup */}
          <div className="absolute inset-0 bg-primary/20 blur-[130px] rounded-[3rem] pointer-events-none group-hover:bg-primary/30 transition-all duration-700" />
          
          {/* Floor gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-20 pointer-events-none" />
          
          <div className="relative rounded-[2rem] bg-card/90 border border-border/60 shadow-[0_35px_120px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col transform-gpu rotate-x-[2deg] scale-[1.02] hover:rotate-x-0 hover:scale-100 transition-all duration-700 ease-out backdrop-blur-2xl ring-1 ring-white/10 dark:ring-white/5 group-hover:border-primary/40">
            
            {/* Window Header Bar */}
            <div className="h-14 border-b border-border/50 flex items-center px-6 justify-between bg-muted/40 backdrop-blur-md">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-500/50 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-500/50 shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-500/50 shadow-sm" />
              </div>
              <div className="h-7 w-72 bg-background/60 rounded-full flex items-center px-4 border border-border/40 shadow-inner">
                <div className="w-3.5 h-3.5 rounded-full bg-primary/40 mr-2 animate-pulse" />
                <div className="w-24 h-2 bg-muted-foreground/30 rounded-full" />
              </div>
              <div className="w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-primary-foreground font-black text-xs">
                J
              </div>
            </div>

            {/* Realistic Dashboard Content */}
            <div className="flex h-[600px] text-foreground bg-background">
              {/* Sidebar */}
              <div className="w-60 border-r border-border/50 p-3 flex flex-col gap-4 bg-muted/10 overflow-y-auto scrollbar-thin text-left select-none">
                {[
                  {
                    title: "MAINTENANCE",
                    items: [
                      { name: 'Dashboard', active: true, icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
                      { name: 'Work Orders', icon: <ClipboardList className="w-4 h-4 shrink-0" /> },
                      { name: 'Preventive Maintenance', icon: <RefreshCcw className="w-4 h-4 shrink-0" /> },
                      { name: 'Scheduler', icon: <CheckSquare className="w-4 h-4 shrink-0" /> },
                      { name: 'Requests', icon: <MessageSquare className="w-4 h-4 shrink-0" /> }
                    ]
                  },
                  {
                    title: "ASSETS & INVENTORY",
                    items: [
                      { name: 'Locations', icon: <MapPin className="w-4 h-4 shrink-0" /> },
                      { name: 'Assets', icon: <Box className="w-4 h-4 shrink-0" /> },
                      { name: 'Parts & Inventory', icon: <Package className="w-4 h-4 shrink-0" /> },
                      { name: 'Meters', icon: <Gauge className="w-4 h-4 shrink-0" /> }
                    ]
                  },
                  {
                    title: "PROCUREMENT",
                    items: [
                      { name: 'Purchase Orders', icon: <ShoppingCart className="w-4 h-4 shrink-0" /> },
                      { name: 'Providers & Network', icon: <Truck className="w-4 h-4 shrink-0" /> }
                    ]
                  },
                  {
                    title: "SYSTEM",
                    items: [
                      { name: 'Analytics', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
                      { name: 'People & Teams', icon: <Users className="w-4 h-4 shrink-0" /> },
                      { name: 'Files', icon: <Files className="w-4 h-4 shrink-0" /> },
                      { name: 'Settings', icon: <Settings className="w-4 h-4 shrink-0" /> }
                    ]
                  }
                ].map((group, gi) => (
                  <div key={gi} className="space-y-1">
                    <div className="px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      {group.title}
                    </div>
                    {group.items.map((item, i) => (
                      <div 
                        key={i} 
                        className={`h-8 rounded-xl flex items-center px-3 gap-2.5 text-[12px] font-semibold cursor-pointer transition-all duration-300 ${
                          item.active 
                            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-bold scale-[1.02]' 
                            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                      >
                        {item.icon}
                        <span className="truncate">{item.name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              {/* Main Workspace Area */}
              <div className="flex-1 p-8 overflow-hidden bg-muted/5 flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tight">Overview</h2>
                    <p className="text-sm font-bold text-muted-foreground">Real-time status of your facility</p>
                  </div>
                  <div className="h-10 px-6 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                    + New Work Order
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { title: 'Active Work Orders', value: '24', trend: '+12% this week', color: 'text-amber-500' },
                    { title: 'Critical Issues', value: '3', trend: '-2 since yesterday', color: 'text-rose-500' },
                    { title: 'PM Compliance', value: '98%', trend: 'On track', color: 'text-emerald-500' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary/30 hover:shadow-md transition-all duration-300">
                      <p className="text-sm font-bold text-muted-foreground">{stat.title}</p>
                      <div className="mt-4 flex items-end justify-between">
                        <span className="text-4xl font-black">{stat.value}</span>
                        <span className={`text-xs font-bold ${stat.color}`}>{stat.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Content Area */}
                <div className="flex gap-6 flex-1 min-h-0">
                  {/* Visual Analytics Chart */}
                  <div className="flex-[2] bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group/chart hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Work Order Completion</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-black text-foreground">148</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">+18.4% vs last week</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-primary inline-block shadow-sm" /> Completed</span>
                        <span className="flex items-center gap-1.5 text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-primary/30 inline-block" /> Planned</span>
                      </div>
                    </div>

                    {/* Visual Analytics Chart Graph */}
                    <div className="relative flex-1 min-h-[190px] flex flex-col justify-end pt-4">
                      {/* Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pb-6">
                        <div className="border-b border-dashed border-border w-full" />
                        <div className="border-b border-dashed border-border w-full" />
                        <div className="border-b border-dashed border-border w-full" />
                        <div className="border-b border-dashed border-border w-full" />
                      </div>

                      {/* Bars & Labels */}
                      <div className="relative z-10 flex items-end justify-between gap-3 h-40">
                        {[
                          { day: 'Mon', count: 18, h: '55%', prev: '35%' },
                          { day: 'Tue', count: 24, h: '75%', prev: '45%' },
                          { day: 'Wed', count: 15, h: '50%', prev: '30%' },
                          { day: 'Thu', count: 32, h: '95%', prev: '60%' },
                          { day: 'Fri', count: 28, h: '85%', prev: '50%' },
                          { day: 'Sat', count: 19, h: '60%', prev: '40%' },
                          { day: 'Sun', count: 12, h: '40%', prev: '25%' }
                        ].map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group/bar">
                            <span className="text-[11px] font-black text-foreground group-hover/bar:scale-110 transition-transform">
                              {item.count}
                            </span>
                            <div className="w-full max-w-[38px] bg-muted/40 rounded-t-lg h-full flex items-end justify-center p-0.5 overflow-hidden relative">
                              <div 
                                className="w-full bg-primary/20 rounded-t-sm transition-all duration-500" 
                                style={{ height: item.prev }} 
                              />
                              <div 
                                className="w-full bg-gradient-to-t from-primary via-primary to-primary/80 rounded-t-md shadow-md shadow-primary/20 absolute bottom-0 transition-all duration-500 group-hover/bar:brightness-110" 
                                style={{ height: item.h }} 
                              />
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                              {item.day}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="flex-1 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col hover:border-primary/30 transition-colors">
                    <h3 className="text-sm font-bold text-muted-foreground mb-4">Recent Activity</h3>
                    <div className="flex-1 overflow-hidden flex flex-col gap-4">
                      {[
                        { title: 'HVAC Inspection', time: '10 mins ago', status: 'Completed' },
                        { title: 'Fix Leaking Pipe', time: '1 hour ago', status: 'In Progress' },
                        { title: 'Generator PM', time: '2 hours ago', status: 'Assigned' },
                        { title: 'Safety Audit', time: '5 hours ago', status: 'Completed' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 group/item">
                          <div className="w-2 h-2 rounded-full bg-primary group-hover/item:scale-125 transition-transform" />
                          <div className="flex-1">
                            <p className="text-sm font-bold leading-tight group-hover/item:text-primary transition-colors">{item.title}</p>
                            <p className="text-xs text-muted-foreground font-semibold">{item.time}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-muted rounded-full text-muted-foreground">
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 5. Trust Strip Marquee */}
      <section className="py-16 border-y border-border/50 bg-muted/10 relative overflow-hidden">
        {/* Gradients that match the theme background to fade the edges */}
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background to-transparent z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center mb-10 relative z-20">
          <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary/80 drop-shadow-sm">Powering operations for industry leaders</p>
        </div>
        
        <div className="flex w-fit animate-marquee hover:pause items-center">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 px-5">
              {/* Brand 1: LUMINUS MFG (Crimson Red) */}
              <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card/90 border border-[#e11d48]/30 shadow-lg shadow-[#e11d48]/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-[#e11d48]/15 border border-[#e11d48]/40 flex items-center justify-center text-[#e11d48] shadow-[0_0_15px_rgba(225,29,72,0.3)] group-hover:scale-110 transition-transform">
                  <Box className="w-5 h-5" />
                </div>
                <span className="font-black italic text-xl tracking-tighter uppercase text-[#e11d48]">
                  LUMINUS <span className="text-foreground/70 font-normal">MFG</span>
                </span>
              </div>

              {/* Brand 2: APEX LOGISTICS (Electric Cyan / Sky) */}
              <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card/90 border border-[#0284c7]/30 shadow-lg shadow-[#0284c7]/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-[#0284c7]/15 border border-[#0284c7]/40 flex items-center justify-center text-[#0284c7] shadow-[0_0_15px_rgba(2,132,199,0.3)] group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-black italic text-xl tracking-tighter uppercase text-[#0284c7]">
                  APEX <span className="text-foreground/70 font-normal">LOGISTICS</span>
                </span>
              </div>

              {/* Brand 3: SYNAPSE TECH (Emerald Green) */}
              <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card/90 border border-[#059669]/30 shadow-lg shadow-[#059669]/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-[#059669]/15 border border-[#059669]/40 flex items-center justify-center text-[#059669] shadow-[0_0_15px_rgba(5,150,105,0.3)] group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-black italic text-xl tracking-tighter uppercase text-[#059669]">
                  SYNAPSE <span className="text-foreground/70 font-normal">TECH</span>
                </span>
              </div>

              {/* Brand 4: FORTIS PROPERTIES (Deep Violet / Purple) */}
              <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card/90 border border-[#9333ea]/30 shadow-lg shadow-[#9333ea]/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-[#9333ea]/15 border border-[#9333ea]/40 flex items-center justify-center text-[#9333ea] shadow-[0_0_15px_rgba(147,51,234,0.3)] group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-black italic text-xl tracking-tighter uppercase text-[#9333ea]">
                  FORTIS <span className="text-foreground/70 font-normal">PROPERTIES</span>
                </span>
              </div>

              {/* Brand 5: QUANTUM DYNAMICS (Golden Amber / Orange) */}
              <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card/90 border border-[#d97706]/30 shadow-lg shadow-[#d97706]/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-[#d97706]/15 border border-[#d97706]/40 flex items-center justify-center text-[#d97706] shadow-[0_0_15px_rgba(217,119,6,0.3)] group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="font-black italic text-xl tracking-tighter uppercase text-[#d97706]">
                  QUANTUM <span className="text-foreground/70 font-normal">DYNAMICS</span>
                </span>
              </div>

              {/* Brand 6: NEXUS INDUSTRIAL (Deep Indigo / Royal) */}
              <div className="flex items-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card/90 border border-[#4f46e5]/30 shadow-lg shadow-[#4f46e5]/10 backdrop-blur-md hover:scale-105 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-xl bg-[#4f46e5]/15 border border-[#4f46e5]/40 flex items-center justify-center text-[#4f46e5] shadow-[0_0_15px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="font-black italic text-xl tracking-tighter uppercase text-[#4f46e5]">
                  NEXUS <span className="text-foreground/70 font-normal">INDUSTRIAL</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Core Features */}
      <section id="features" className="py-40 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-24"
          >
            <motion.div 
              animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 text-primary mb-8 shadow-lg shadow-primary/15"
            >
              <Activity className="w-8 h-8 animate-pulse" />
            </motion.div>

            <div className="relative inline-block overflow-hidden py-4 px-6 rounded-3xl">
              {/* Glossy Flash Sheen Streak Overlay */}
              <motion.div
                animate={{ x: ["-150%", "300%"] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: [0.25, 1, 0.5, 1]
                }}
                className="absolute top-0 bottom-0 w-36 bg-gradient-to-r from-transparent via-white/70 dark:via-white/80 to-transparent transform -skew-x-20 pointer-events-none z-20 mix-blend-overlay blur-[1px]"
              />

              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-4 leading-none select-none relative z-10">
                <motion.span 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block text-foreground"
                >
                  EVERYTHING YOU{" "}
                </motion.span>
                <motion.span 
                  animate={{ 
                    scale: [1, 1.04, 1],
                    filter: ["drop-shadow(0 0 25px hsl(var(--primary-raw)/0.4))", "drop-shadow(0 0 50px hsl(var(--primary-raw)/0.8))", "drop-shadow(0 0 25px hsl(var(--primary-raw)/0.4))"]
                  }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block text-primary"
                >
                  NEED.
                </motion.span>
                <br/>
                <motion.span 
                  animate={{ 
                    y: [0, 4, 0],
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{ 
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                    backgroundPosition: { duration: 5, repeat: Infinity, ease: "linear" }
                  }}
                  style={{ backgroundSize: "250% 250%" }}
                  className="inline-block bg-gradient-to-r from-primary via-rose-500 via-amber-400 via-yellow-300 via-emerald-400 to-primary bg-clip-text text-transparent drop-shadow-md"
                >
                  NOTHING YOU DON'T.
                </motion.span>
              </h2>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl text-muted-foreground font-bold"
            >
              A complete toolkit designed to eliminate downtime, maximize asset lifespan, and empower your technicians.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              index={0}
              delay={0}
              icon={<Wrench className="w-8 h-8" />}
              cardStyle="bg-gradient-to-br from-[#e11d48]/10 via-card/90 to-card/60 border-[#e11d48]/30 hover:border-[#e11d48]/60 hover:shadow-[0_25px_60px_-15px_rgba(225,29,72,0.35)]"
              accentGlow="bg-[#e11d48]/20 group-hover:bg-[#e11d48]/40"
              badgeStyle="text-[#e11d48] bg-[#e11d48]/15 border-[#e11d48]/35 shadow-[0_0_15px_rgba(225,29,72,0.25)]"
              titleStyle="text-[#e11d48]"
              title="Work Orders"
              description="Create, assign, and track work orders in seconds. Get real-time updates when technicians complete jobs."
            />
            <FeatureCard 
              index={1}
              delay={0.1}
              icon={<BarChart3 className="w-8 h-8" />}
              cardStyle="bg-gradient-to-br from-[#0284c7]/10 via-card/90 to-card/60 border-[#0284c7]/30 hover:border-[#0284c7]/60 hover:shadow-[0_25px_60px_-15px_rgba(2,132,199,0.35)]"
              accentGlow="bg-[#0284c7]/20 group-hover:bg-[#0284c7]/40"
              badgeStyle="text-[#0284c7] bg-[#0284c7]/15 border-[#0284c7]/35 shadow-[0_0_15px_rgba(2,132,199,0.25)]"
              titleStyle="text-[#0284c7]"
              title="Preventative Maintenance"
              description="Schedule recurring tasks automatically. Catch problems before they turn into expensive emergency repairs."
            />
            <FeatureCard 
              index={2}
              delay={0.2}
              icon={<Box className="w-8 h-8" />}
              cardStyle="bg-gradient-to-br from-[#059669]/10 via-card/90 to-card/60 border-[#059669]/30 hover:border-[#059669]/60 hover:shadow-[0_25px_60px_-15px_rgba(5,150,105,0.35)]"
              accentGlow="bg-[#059669]/20 group-hover:bg-[#059669]/40"
              badgeStyle="text-[#059669] bg-[#059669]/15 border-[#059669]/35 shadow-[0_0_15px_rgba(5,150,105,0.25)]"
              titleStyle="text-[#059669]"
              title="Asset Management"
              description="A central registry for all your equipment. Track history, warranties, manuals, and total cost of ownership."
            />
            <FeatureCard 
              index={3}
              delay={0.3}
              icon={<CheckCircle2 className="w-8 h-8" />}
              cardStyle="bg-gradient-to-br from-[#d97706]/10 via-card/90 to-card/60 border-[#d97706]/30 hover:border-[#d97706]/60 hover:shadow-[0_25px_60px_-15px_rgba(217,119,6,0.35)]"
              accentGlow="bg-[#d97706]/20 group-hover:bg-[#d97706]/40"
              badgeStyle="text-[#d97706] bg-[#d97706]/15 border-[#d97706]/35 shadow-[0_0_15px_rgba(217,119,6,0.25)]"
              titleStyle="text-[#d97706]"
              title="Inventory & Parts"
              description="Never run out of critical spares. Set low-stock alerts and generate purchase orders instantly."
            />
            <FeatureCard 
              index={4}
              delay={0.4}
              icon={<Users className="w-8 h-8" />}
              cardStyle="bg-gradient-to-br from-[#9333ea]/10 via-card/90 to-card/60 border-[#9333ea]/30 hover:border-[#9333ea]/60 hover:shadow-[0_25px_60px_-15px_rgba(147,51,234,0.35)]"
              accentGlow="bg-[#9333ea]/20 group-hover:bg-[#9333ea]/40"
              badgeStyle="text-[#9333ea] bg-[#9333ea]/15 border-[#9333ea]/35 shadow-[0_0_15px_rgba(147,51,234,0.25)]"
              titleStyle="text-[#9333ea]"
              title="Team Scheduling"
              description="Drag-and-drop calendar for your entire workforce. Optimize routes and workload distribution."
            />
            <FeatureCard 
              index={5}
              delay={0.5}
              icon={<Smartphone className="w-8 h-8" />}
              cardStyle="bg-gradient-to-br from-[#4f46e5]/10 via-card/90 to-card/60 border-[#4f46e5]/30 hover:border-[#4f46e5]/60 hover:shadow-[0_25px_60px_-15px_rgba(79,70,229,0.35)]"
              accentGlow="bg-[#4f46e5]/20 group-hover:bg-[#4f46e5]/40"
              badgeStyle="text-[#4f46e5] bg-[#4f46e5]/15 border-[#4f46e5]/35 shadow-[0_0_15px_rgba(79,70,229,0.25)]"
              titleStyle="text-[#4f46e5]"
              title="Mobile First"
              description="Technicians can scan QR codes, take photos, and close out work orders right from the factory floor."
            />
          </div>
        </div>
      </section>

      {/* 7. ROI / Impact Section */}
      <section id="roi" className="py-40 px-6 relative overflow-hidden border-y border-border/50 bg-primary/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/15 blur-[200px] rounded-full mix-blend-normal pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter mb-24"
          >
            The Impact is <span className="text-primary drop-shadow-[0_0_30px_hsl(var(--primary-raw)/0.5)]">Real</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-12 lg:gap-24">
            <StatCard value="-30%" label="Equipment Downtime" delay={0} />
            <StatCard value="+45%" label="Technician Productivity" delay={0.2} />
            <StatCard value="100%" label="Paper Eliminated" delay={0.4} />
          </div>
        </div>
      </section>

      {/* 8. Pricing Section */}
      <section id="pricing" className="py-40 px-6 relative z-10 border-b border-border/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto mb-24"
          >
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6 leading-none">
              <span className="text-foreground">SIMPLE, TRANSPARENT </span>
              <span className="text-primary drop-shadow-[0_0_30px_hsl(var(--primary-raw)/0.5)]">PRICING</span>
            </h2>
            <p className="text-xl text-muted-foreground font-bold">
              Choose the perfect plan to scale your maintenance operations. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard 
              title="Starter"
              price="$49"
              period="/mo per user"
              description="Perfect for small teams transitioning from paper to digital."
              features={[
                "Up to 5 Users",
                "Basic Work Orders",
                "Asset Tracking",
                "Mobile App Access",
                "Email Support"
              ]}
              delay={0}
            />
            <PricingCard 
              title="Pro"
              price="$99"
              period="/mo per user"
              description="For growing facilities that need advanced scheduling and analytics."
              features={[
                "Unlimited Users",
                "Preventative Maintenance",
                "Inventory & Parts Management",
                "Team Scheduling",
                "Analytics Dashboard",
                "Priority 24/7 Support"
              ]}
              popular={true}
              delay={0.2}
            />
            <PricingCard 
              title="Enterprise"
              price="Custom"
              period=""
              description="For large organizations requiring custom integrations and dedicated support."
              features={[
                "Multi-site Management",
                "Custom ERP Integrations",
                "Dedicated Success Manager",
                "SSO & Advanced Security",
                "API Access",
                "Custom SLA"
              ]}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* 9. Premium CTA Card */}
      <section className="py-40 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card/70 border border-border/60 p-16 md:p-24 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-2xl ring-1 ring-white/10 dark:ring-white/5 hover:border-primary/40 transition-colors"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-primary/25 blur-[130px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-8 leading-[0.9]">
                Ready to upgrade your maintenance?
              </h2>
              <p className="text-xl text-muted-foreground font-bold mb-12 max-w-2xl mx-auto">
                Join hundreds of world-class facilities running smoother, faster, and more efficiently than ever before.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/register" className="w-full sm:w-auto h-20 px-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center gap-4 font-black uppercase tracking-widest text-[16px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 hover:shadow-primary/50">
                  Start Your Free Trial <ArrowRight className="w-6 h-6" />
                </Link>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest sm:ml-4">No credit card required</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-border/50 py-12 px-6 bg-muted/20 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 font-black italic">
              J
            </div>
            <span className="text-xl font-black italic tracking-tighter uppercase">CMMS <span className="text-primary">JURIC</span></span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact Support</a>
            <a href="#" className="hover:text-foreground transition-colors">System Status</a>
          </div>
          <div className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            © 2026 CMMS Juric. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay, 
  cardStyle,
  accentGlow,
  badgeStyle,
  titleStyle,
  index = 0
}: { 
  icon: React.ReactNode, 
  title: string, 
  description: string, 
  delay: number, 
  cardStyle?: string,
  accentGlow?: string,
  badgeStyle?: string,
  titleStyle?: string,
  index?: number
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, margin: "-50px" }}
    animate={{
      y: [0, index % 2 === 0 ? -9 : 9, 0],
    }}
    transition={{
      opacity: { duration: 0.6, delay },
      scale: { duration: 0.6, delay },
      y: {
        duration: 4.5 + (index % 3),
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: index * 0.25
      }
    }}
    whileHover={{ 
      y: -16, 
      scale: 1.03,
      transition: { duration: 0.35, ease: "easeOut" } 
    }}
    className={`p-10 rounded-[2.5rem] border backdrop-blur-md transition-colors duration-500 group relative overflow-hidden shadow-md cursor-pointer ${cardStyle || 'bg-card/60 border-border/60 hover:border-primary/50'}`}
  >
    {/* Floating Animated Corner Glow Blob */}
    <motion.div 
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-[55px] pointer-events-none ${accentGlow || 'bg-primary/10 group-hover:bg-primary/30'}`} 
    />
    
    {/* Icon Badge with micro motion */}
    <motion.div 
      whileHover={{ scale: 1.15, rotate: 8 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-8 shadow-sm relative z-10 transition-all duration-300 ${badgeStyle || 'text-primary bg-primary/10 border-primary/25'}`}
    >
      {icon}
    </motion.div>

    {/* Title */}
    <h3 className={`text-2xl font-black uppercase italic tracking-tight mb-4 transition-colors relative z-10 ${titleStyle || 'text-foreground'}`}>{title}</h3>
    
    {/* Description */}
    <p className="text-muted-foreground font-bold leading-relaxed relative z-10">{description}</p>
  </motion.div>
);

const StatCard = ({ value, label, delay }: { value: string, label: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, type: "spring" }}
    className="group"
  >
    <div className="text-8xl lg:text-9xl font-black tracking-tighter mb-6 text-foreground drop-shadow-xl group-hover:scale-105 transition-transform duration-500">
      {value}
    </div>
    <div className="text-lg font-black uppercase tracking-[0.2em] text-primary drop-shadow-[0_0_15px_hsl(var(--primary-raw)/0.4)]">
      {label}
    </div>
  </motion.div>
);

const PricingCard = ({ 
  title, 
  price, 
  period,
  description, 
  features, 
  popular = false,
  delay = 0 
}: { 
  title: string, 
  price: string, 
  period: string,
  description: string, 
  features: string[], 
  popular?: boolean,
  delay?: number 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay }}
    whileHover={{ y: -10, transition: { duration: 0.3 } }}
    className={`relative p-8 rounded-[2.5rem] border backdrop-blur-md flex flex-col h-full shadow-xl transition-all duration-300 ${
      popular 
        ? 'bg-card/90 border-primary shadow-[0_0_40px_hsl(var(--primary-raw)/0.2)] lg:scale-105 z-10' 
        : 'bg-card/60 border-border/60 hover:border-primary/50'
    }`}
  >
    {popular && (
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-gradient-to-r from-primary to-rose-500 text-white text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_0_20px_hsl(var(--primary-raw)/0.5)] whitespace-nowrap">
          Most Popular
        </div>
      </div>
    )}
    
    {popular && (
      <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-[2.5rem] pointer-events-none -z-10" />
    )}

    <div className="mb-8">
      <h3 className={`text-2xl font-black uppercase italic tracking-tight mb-2 ${popular ? 'text-primary' : 'text-foreground'}`}>
        {title}
      </h3>
      <div className="flex items-end gap-1 mb-4">
        <span className="text-5xl font-black tracking-tighter">{price}</span>
        {period && <span className="text-sm font-bold text-muted-foreground mb-2">{period}</span>}
      </div>
      <p className="text-sm text-muted-foreground font-bold">{description}</p>
    </div>

    <div className="flex-1 space-y-4 mb-8">
      {features.map((feature, i) => (
        <div key={i} className="flex items-start gap-3">
          <CheckCircle2 className={`w-5 h-5 shrink-0 ${popular ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-sm font-semibold text-foreground/90">{feature}</span>
        </div>
      ))}
    </div>

    <Link 
      to="/register" 
      className={`w-full h-14 rounded-xl flex items-center justify-center font-black uppercase tracking-widest text-[13px] transition-all duration-300 ${
        popular 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02]' 
          : 'bg-muted text-foreground hover:bg-primary hover:text-primary-foreground hover:scale-[1.02]'
      }`}
    >
      Get Started
    </Link>
  </motion.div>
);


