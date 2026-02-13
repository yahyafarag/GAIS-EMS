
import React from 'react';
import { useApp } from '../context/AppContext';
import { Role } from '../types';
import { 
  LayoutDashboard, 
  PlusCircle, 
  ClipboardList, 
  Settings, 
  LogOut, 
  Menu,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
      ${active 
        ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
  >
    <Icon size={20} className={active ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
    <span className="font-medium text-lg">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex overflow-hidden bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-fixed">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-0" />

      {/* Sidebar */}
      <aside 
        className={`relative z-20 transition-all duration-500 ease-out border-l border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col
          ${isSidebarOpen ? 'w-72' : 'w-20'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              EMS <span className="text-xs text-slate-500 block font-normal">نظام إدارة الصيانة</span>
            </h1>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg">
            <Menu className="text-white" />
          </button>
        </div>

        <div className="flex-1 px-4 space-y-2 mt-4">
            {/* Logic to change hash based on click */}
          {user.role === Role.ADMIN && (
            <>
              <NavItem icon={LayoutDashboard} label={isSidebarOpen ? "لوحة التحكم" : ""} active={window.location.hash === '#/admin'} onClick={() => window.location.hash = '#/admin'} />
              <NavItem icon={Settings} label={isSidebarOpen ? "الإعدادات" : ""} active={window.location.hash === '#/admin/settings'} onClick={() => window.location.hash = '#/admin/settings'} />
            </>
          )}

          {user.role === Role.BRANCH_MANAGER && (
            <>
               <NavItem icon={PlusCircle} label={isSidebarOpen ? "بلاغ جديد" : ""} active={window.location.hash === '#/branch/new'} onClick={() => window.location.hash = '#/branch/new'} />
               <NavItem icon={ClipboardList} label={isSidebarOpen ? "سجل البلاغات" : ""} active={window.location.hash === '#/branch/history'} onClick={() => window.location.hash = '#/branch/history'} />
            </>
          )}

          {user.role === Role.TECHNICIAN && (
            <>
               <NavItem icon={ClipboardList} label={isSidebarOpen ? "مهامي" : ""} active={window.location.hash === '#/technician'} onClick={() => window.location.hash = '#/technician'} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${!isSidebarOpen && 'justify-center'}`}>
            <img src={user.avatar || "https://picsum.photos/200"} className="w-10 h-10 rounded-full border-2 border-indigo-500" alt="User" />
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs text-indigo-400 truncate">{user.role}</p>
              </div>
            )}
          </div>
          <button onClick={logout} className="w-full mt-3 flex items-center justify-center gap-2 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={18} />
            {isSidebarOpen && <span>تسجيل خروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 overflow-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};
