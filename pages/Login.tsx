
import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { ShieldCheck, Wrench, Store } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

const LoginCard = ({ role, title, icon: Icon, color, login }: any) => (
  <GlassCard 
    onClick={() => login(role)} 
    className="p-8 flex flex-col items-center justify-center gap-4 hover:border-indigo-500/50 transition-all group h-64"
    hoverEffect={true}
  >
    <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
      <Icon size={48} className="text-white" />
    </div>
    <h2 className="text-2xl font-bold mt-4">{title}</h2>
    <p className="text-slate-400 text-sm text-center">الدخول بصلاحيات {title}</p>
  </GlassCard>
);

export const Login: React.FC = () => {
  const { login, isLoading } = useApp();

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="z-10 text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
          EMS Portal
        </h1>
        <p className="text-xl text-slate-400">نظام إدارة الصيانة الذكي - النسخة المؤسسية</p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <LoginCard role={Role.ADMIN} title="الإدارة العليا" icon={ShieldCheck} color="from-red-500 to-orange-500" login={login} />
        <LoginCard role={Role.BRANCH_MANAGER} title="مدير فرع" icon={Store} color="from-blue-500 to-cyan-500" login={login} />
        <LoginCard role={Role.TECHNICIAN} title="فني ميداني" icon={Wrench} color="from-green-500 to-emerald-500" login={login} />
      </div>
    </div>
  );
};
