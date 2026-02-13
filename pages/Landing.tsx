
import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { ShieldCheck, Wrench, Store, ArrowLeft, Activity, Lock, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export const Landing: React.FC = () => {
  const { login, isLoading } = useApp();

  const handleLogin = (role: Role) => {
    login(role);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.3)]"></div>
            <span className="text-indigo-400 font-bold tracking-widest animate-pulse">EMS LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* --- Dynamic Background --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col justify-center items-center">
        
        {/* --- Hero Section --- */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-md mb-4 group cursor-default hover:bg-indigo-500/20 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-indigo-300 text-xs font-bold tracking-wide">النسخة المؤسسية V2.0</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-2xl">
            نظام إدارة الصيانة
          </h1>
          
          <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto leading-relaxed font-light">
            بوابة مركزية توحد عمليات <span className="text-indigo-400 font-bold">100+ فرع</span> مع فرق الصيانة الميدانية في زمن حقيقي.
          </p>
        </motion.div>

        {/* --- Role Cards (The Gateway) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
          
          <GatewayCard 
            role={Role.ADMIN}
            title="الإدارة المركزية"
            subtitle="Admin Console"
            desc="التحكم الشامل، الخرائط الحية، تحليل البيانات، وتعديل الواقع."
            icon={ShieldCheck}
            color="from-rose-500 to-orange-600"
            delay={0.2}
            onClick={() => handleLogin(Role.ADMIN)}
          />

          <GatewayCard 
            role={Role.BRANCH_MANAGER}
            title="بوابة الفروع"
            subtitle="Branch Portal"
            desc="نظام البلاغات الذكي، متابعة الحالة، والتواصل مع الإدارة."
            icon={Store}
            color="from-indigo-500 to-cyan-600"
            delay={0.3}
            onClick={() => handleLogin(Role.BRANCH_MANAGER)}
          />

          <GatewayCard 
            role={Role.TECHNICIAN}
            title="العمليات الميدانية"
            subtitle="Tech Field App"
            desc="إدارة المهام، التوجيه الجغرافي، إثبات الإصلاح، ووضع الأوفلاين."
            icon={Wrench}
            color="from-emerald-500 to-teal-600"
            delay={0.4}
            onClick={() => handleLogin(Role.TECHNICIAN)}
          />

        </div>

        {/* --- Footer Stats --- */}
        <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 1 }}
           className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 text-slate-500"
        >
            <StatItem icon={Activity} label="99.9% جاهزية" />
            <StatItem icon={Lock} label="تشفير تام" />
            <StatItem icon={Cpu} label="مدعوم بالذكاء الاصطناعي" />
        </motion.div>

        <div className="mt-12 text-center text-slate-700 text-sm font-mono">
          &copy; 2024 EMS Platform. Enterprise Grade Solution.
        </div>
      </div>
    </div>
  );
};

const GatewayCard = ({ role, title, subtitle, desc, icon: Icon, color, delay, onClick }: any) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col h-[380px] rounded-[2.5rem] p-1 overflow-hidden transition-all duration-300 shadow-2xl"
    >
        {/* Border Gradient Container */}
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-100 transition-opacity duration-500`}></div>
        
        {/* Inner Content Container */}
        <div className="relative h-full w-full bg-[#0f172a] rounded-[2.3rem] p-8 flex flex-col justify-between overflow-hidden">
            
            {/* Glossy Top Overlay */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            {/* Icon Blob */}
            <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${color} rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>

            <div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                    <Icon size={32} className="text-white drop-shadow-md" />
                </div>
                
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{subtitle}</h3>
                <h2 className="text-3xl font-bold text-white mb-4 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                    {desc}
                </p>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4">
                <span className="text-xs font-mono text-slate-500 group-hover:text-white transition-colors">SECURE LOGIN</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors`}>
                    <ArrowLeft size={18} className={`text-slate-300 group-hover:text-white group-hover:-translate-x-1 transition-transform`} />
                </div>
            </div>
        </div>
    </motion.button>
  );
};

const StatItem = ({ icon: Icon, label }: any) => (
    <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <Icon size={16} />
        <span className="text-xs font-bold tracking-wide">{label}</span>
    </div>
);
