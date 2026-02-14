
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Report, ReportStatus, ReportPriority, SparePart } from '../../types';
import { AdminMap } from './AdminMap';
import { SystemDesigner } from './SystemDesigner';
import { AdminReports } from './components/AdminReports';
import { ManagementConsole } from './components/ManagementConsole';
import { InventoryManager } from './components/InventoryManager';
import { BarChart2, Map as MapIcon, Settings, FileText, Activity, AlertTriangle, X, Users, Package, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GlassCard } from '../../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'reports' | 'management' | 'inventory' | 'config'>('overview');
  const [reports, setReports] = useState<Report[]>([]);
  const [lowStockParts, setLowStockParts] = useState<SparePart[]>([]);
  const [analytics, setAnalytics] = useState({ mttrHours: 0, completedCount: 0 });

  useEffect(() => {
    // Initial Load
    loadDashboardData();

    // Subscribe to updates
    const sub = api.subscribeToReports(() => {
        loadDashboardData();
    });

    return () => { sub.unsubscribe(); };
  }, []);

  const loadDashboardData = async () => {
      const [r, low, stats] = await Promise.all([
          api.getReports(),
          api.getLowStockItems(),
          api.getAnalytics()
      ]);
      setReports(r);
      setLowStockParts(low);
      setAnalytics(stats);
  };

  // --- Chart Logic ---
  const branchStats = reports.reduce((acc, curr) => {
      acc[curr.branchName] = (acc[curr.branchName] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const branchChartData = Object.entries(branchStats)
      .map(([name, count]) => ({ name: name.replace('فرع ', ''), count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

  const activeCriticalCount = reports.filter(r => r.priority === ReportPriority.CRITICAL && r.status !== ReportStatus.CLOSED && r.status !== ReportStatus.COMPLETED).length;

  const updateRoute = (tab: any) => setActiveTab(tab);

  return (
    <div className="space-y-6 pb-20">
      {/* Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <NavButton active={activeTab === 'overview'} onClick={() => updateRoute('overview')} icon={Activity} label="لوحة القيادة" />
          <NavButton active={activeTab === 'map'} onClick={() => updateRoute('map')} icon={MapIcon} label="غرفة التتبع" />
          <NavButton active={activeTab === 'reports'} onClick={() => updateRoute('reports')} icon={FileText} label="البلاغات" />
          <NavButton active={activeTab === 'management'} onClick={() => updateRoute('management')} icon={Users} label="الموارد" />
          <NavButton active={activeTab === 'inventory'} onClick={() => updateRoute('inventory')} icon={Package} label="المخزون" />
          <NavButton active={activeTab === 'config'} onClick={() => updateRoute('config')} icon={Settings} label="النظام" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'overview' && (
              <div className="space-y-6">
                  {/* Alerts */}
                  <div className="space-y-2">
                    {activeCriticalCount > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                            <div className="p-2 bg-red-600 text-white rounded-full"><AlertTriangle size={24} /></div>
                            <div>
                                <h3 className="font-bold text-red-100">تنبيه حرج: {activeCriticalCount} بلاغات نشطة</h3>
                                <p className="text-red-300 text-sm">يتطلب التدخل الفوري.</p>
                            </div>
                        </div>
                    )}
                    {lowStockParts.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-4">
                            <Package className="text-yellow-500" />
                            <div className="flex-1">
                                <h3 className="font-bold text-yellow-100">تنبيه مخزون: {lowStockParts.length} أصناف</h3>
                            </div>
                            <button onClick={() => updateRoute('inventory')} className="text-sm underline text-yellow-400">إدارة</button>
                        </div>
                    )}
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <KPICard title="إجمالي البلاغات" value={reports.length} color="text-white" />
                      <KPICard title="متوسط زمن الإصلاح (MTTR)" value={`${analytics.mttrHours} س`} color="text-indigo-400" icon={Clock} />
                      <KPICard title="تم الإنجاز" value={analytics.completedCount} color="text-green-400" />
                      <KPICard title="تحت الإجراء" value={reports.filter(r => r.status === ReportStatus.IN_PROGRESS).length} color="text-blue-400" />
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <GlassCard className="p-6 h-[400px]">
                          <h3 className="font-bold mb-4 text-indigo-300">أكثر الفروع طلباً للصيانة</h3>
                          <ResponsiveContainer width="100%" height="90%">
                              <BarChart data={branchChartData} layout="vertical">
                                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                                  <XAxis type="number" stroke="#94a3b8" />
                                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' }} />
                                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                              </BarChart>
                          </ResponsiveContainer>
                      </GlassCard>
                  </div>
              </div>
          )}

          {activeTab === 'map' && <AdminMap />}
          {activeTab === 'reports' && <AdminReports />}
          {activeTab === 'management' && <ManagementConsole />}
          {activeTab === 'inventory' && <InventoryManager />}
          {activeTab === 'config' && <SystemDesigner />}
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium
          ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}
    >
        <Icon size={18} /> {label}
    </button>
);

const KPICard = ({ title, value, color, icon: Icon }: any) => (
    <GlassCard className="p-6">
        <div className="flex justify-between items-start">
            <h3 className="text-slate-400 text-sm mb-2">{title}</h3>
            {Icon && <Icon size={16} className="text-slate-500" />}
        </div>
        <p className={`text-4xl font-bold ${color}`}>{value}</p>
    </GlassCard>
);
