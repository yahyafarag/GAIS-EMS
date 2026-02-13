
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report, ReportStatus, ReportPriority } from '../../types';
import { AdminMap } from './AdminMap';
import { SystemDesigner } from './SystemDesigner';
import { AdminReports } from './components/AdminReports';
import { BarChart2, Map as MapIcon, Settings, FileText, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GlassCard } from '../../components/ui/GlassCard';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'reports' | 'config'>('overview');
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    // Handle Hash Navigation
    const handleHash = () => {
        const hash = window.location.hash;
        if (hash.includes('/admin/map')) setActiveTab('map');
        else if (hash.includes('/admin/reports')) setActiveTab('reports');
        else if (hash.includes('/admin/settings')) setActiveTab('config');
        else setActiveTab('overview');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);

    api.getReports().then(setReports);

    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const updateRoute = (tab: string) => {
      let hash = '#/admin';
      if (tab === 'map') hash = '#/admin/map';
      if (tab === 'reports') hash = '#/admin/reports';
      if (tab === 'config') hash = '#/admin/settings';
      window.location.hash = hash;
  };

  // --- Chart Data Preparation ---
  const branchStats = reports.reduce((acc, curr) => {
      acc[curr.branchName] = (acc[curr.branchName] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const branchChartData = Object.entries(branchStats)
      .map(([name, count]) => ({ name: name.replace('فرع ', ''), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

  const techStats = reports.reduce((acc, curr) => {
      if(curr.assignedTechnicianName && curr.status === ReportStatus.COMPLETED) {
          acc[curr.assignedTechnicianName] = (acc[curr.assignedTechnicianName] || 0) + 1;
      }
      return acc;
  }, {} as Record<string, number>);

  const techChartData = Object.entries(techStats)
      .map(([name, completed]) => ({ name, completed }))
      .slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation Header */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <NavButton 
            active={activeTab === 'overview'} 
            onClick={() => updateRoute('overview')} 
            icon={Activity} 
            label="لوحة القيادة" 
          />
          <NavButton 
            active={activeTab === 'map'} 
            onClick={() => updateRoute('map')} 
            icon={MapIcon} 
            label="غرفة التتبع الحية" 
          />
          <NavButton 
            active={activeTab === 'reports'} 
            onClick={() => updateRoute('reports')} 
            icon={FileText} 
            label="سجل البلاغات & تعديل الواقع" 
          />
          <NavButton 
            active={activeTab === 'config'} 
            onClick={() => updateRoute('config')} 
            icon={Settings} 
            label="مصمم النظام" 
          />
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {activeTab === 'overview' && (
              <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <KPICard title="إجمالي البلاغات" value={reports.length} color="text-white" />
                      <KPICard title="حالات حرجة" value={reports.filter(r => r.priority === ReportPriority.CRITICAL).length} color="text-red-400" border="border-red-500/30" />
                      <KPICard title="تم الإنجاز" value={reports.filter(r => r.status === ReportStatus.COMPLETED).length} color="text-green-400" />
                      <KPICard title="تحت الإجراء" value={reports.filter(r => r.status === ReportStatus.IN_PROGRESS).length} color="text-blue-400" />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <GlassCard className="p-6 h-[400px]">
                          <h3 className="font-bold mb-4 text-indigo-300">أكثر الفروع طلباً للصيانة</h3>
                          <ResponsiveContainer width="100%" height="90%">
                              <BarChart data={branchChartData} layout="vertical" margin={{ left: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                  <XAxis type="number" stroke="#94a3b8" />
                                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }}
                                    cursor={{fill: '#ffffff05'}}
                                  />
                                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                              </BarChart>
                          </ResponsiveContainer>
                      </GlassCard>

                      <GlassCard className="p-6 h-[400px]">
                          <h3 className="font-bold mb-4 text-emerald-300">أداء الفنيين (الأكثر إنجازاً)</h3>
                          <ResponsiveContainer width="100%" height="90%">
                              <BarChart data={techChartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                  <XAxis dataKey="name" stroke="#94a3b8" />
                                  <YAxis stroke="#94a3b8" />
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                              </BarChart>
                          </ResponsiveContainer>
                      </GlassCard>
                  </div>
              </div>
          )}

          {activeTab === 'map' && <AdminMap />}
          {activeTab === 'reports' && <AdminReports />}
          {activeTab === 'config' && <SystemDesigner />}

      </div>
    </div>
  );
};

// --- Helper Components ---

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium
          ${active 
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
    >
        <Icon size={18} /> {label}
    </button>
);

const KPICard = ({ title, value, color, border }: any) => (
    <GlassCard className={`p-6 ${border || ''}`}>
        <h3 className="text-slate-400 text-sm mb-2">{title}</h3>
        <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </GlassCard>
);
