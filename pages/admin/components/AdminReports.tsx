
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { api } from '../../../services/api';
import { Report, ReportStatus, ReportPriority, User, Role } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { StatusBadge, PriorityBadge } from '../../../components/ui/StatusBadge';
import { Edit3, Lock, Save, X, Eye, Database, AlertTriangle, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { GlassInput } from '../../../components/ui/GlassInput';
import { Button } from '../../../components/ui/Button';

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [reviewingReport, setReviewingReport] = useState<Report | null>(null);

  // Auto-open ref
  const hasAutoOpened = useRef(false);

  // --- Pagination & Filter States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  // Auto-open rep-203 when reports are loaded
  useEffect(() => {
    if (reports.length > 0 && !hasAutoOpened.current) {
        const target = reports.find(r => r.id === 'rep-203');
        if (target) {
            setReviewingReport(target);
            hasAutoOpened.current = true;
        }
    }
  }, [reports]);

  const loadData = async () => {
    const [r, u] = await Promise.all([api.getReports(), api.getUsers()]);
    setReports(r);
    setTechnicians(u.filter(user => user.role === Role.TECHNICIAN));
  };

  const handleSaveReport = async (updatedReport: Report) => {
    await api.saveReport(updatedReport);
    setEditingReport(null);
    setReviewingReport(null);
    loadData();
  };

  const handleQuickAssign = async (report: Report, techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    const updatedReport = {
        ...report,
        assignedTechnicianId: tech?.id,
        assignedTechnicianName: tech?.name,
        // Auto-update status to ASSIGNED if currently NEW and a tech is selected
        status: (report.status === ReportStatus.NEW && tech) ? ReportStatus.ASSIGNED : report.status
    };
    await api.saveReport(updatedReport);
    loadData();
  };

  // --- Filtering Logic ---
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            report.id.toLowerCase().includes(searchLower) ||
            report.branchName.toLowerCase().includes(searchLower) ||
            report.description.toLowerCase().includes(searchLower) ||
            (report.assignedTechnicianName && report.assignedTechnicianName.toLowerCase().includes(searchLower));

        const matchesStatus = filterStatus === 'ALL' || report.status === filterStatus;
        const matchesPriority = filterPriority === 'ALL' || report.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [reports, searchTerm, filterStatus, filterPriority]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, currentPage]);

  // Reset page on filter change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, filterStatus, filterPriority]);

  return (
    <GlassCard className="overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Header & Tools */}
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/20 gap-4">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Database className="text-indigo-400" size={20} />
                سجل البلاغات المركزي
            </h2>
            <p className="text-slate-400 text-sm mt-1">مراقبة، تحرير، وإسناد المهام (Reality Editor)</p>
        </div>
        
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="relative group">
                <Filter className="absolute top-2.5 right-3 text-slate-500 group-hover:text-indigo-400 transition-colors" size={16} />
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm text-white outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer hover:bg-slate-800"
                >
                    <option value="ALL">كل الحالات</option>
                    {Object.values(ReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute top-2.5 right-3 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="بحث في البلاغات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg pr-9 pl-3 py-2 text-sm text-white outline-none focus:border-indigo-500 w-full md:w-64 transition-all focus:w-full md:focus:w-80"
                />
            </div>
        </div>
      </div>
      
      {/* Table Container */}
      <div className="flex-1 overflow-x-auto relative min-h-[400px]">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-900/80 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="p-4 whitespace-nowrap">ID</th>
              <th className="p-4 whitespace-nowrap">الفرع</th>
              <th className="p-4 w-1/3 min-w-[200px]">وصف المشكلة</th>
              <th className="p-4 whitespace-nowrap">الحالة / الأولوية</th>
              <th className="p-4 whitespace-nowrap">الفني المسؤول</th>
              <th className="p-4 text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedReports.length > 0 ? (
                paginatedReports.map(report => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-mono text-indigo-300 whitespace-nowrap">
                        #{report.id.split('-')[1]}
                        {report.adminNotes && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 mr-2" title="توجد ملاحظات سرية">
                                <Lock size={12} />
                            </span>
                        )}
                    </td>
                    <td className="p-4 font-bold text-slate-200">{report.branchName}</td>
                    <td className="p-4">
                        <p className="truncate max-w-[250px] text-slate-400 group-hover:text-slate-200 transition-colors" title={report.description}>
                            {report.description}
                        </p>
                    </td>
                    <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                            <StatusBadge status={report.status} /> 
                            <PriorityBadge priority={report.priority} />
                        </div>
                    </td>
                    
                    {/* Inline Technician Assignment */}
                    <td className="p-4">
                        <select
                            value={report.assignedTechnicianId || ''}
                            onChange={(e) => handleQuickAssign(report, e.target.value)}
                            className="bg-transparent border-b border-white/10 hover:border-indigo-500 text-slate-200 text-sm py-1 outline-none w-full max-w-[150px] cursor-pointer focus:bg-slate-900 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="" className="bg-slate-900 text-slate-500">-- غير معين --</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </td>
                    
                    <td className="p-4">
                        <div className="flex justify-center gap-2">
                            {/* Review Button for Completed */}
                            {report.status === ReportStatus.COMPLETED && (
                                <button 
                                    onClick={() => setReviewingReport(report)}
                                    className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                    title="مراجعة الإغلاق"
                                >
                                    <Eye size={16} />
                                </button>
                            )}

                            {/* God Mode Edit Button */}
                            <button 
                                onClick={() => setEditingReport(report)}
                                className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                                title="تعديل الواقع (God Mode)"
                            >
                                <Edit3 size={16} />
                            </button>
                        </div>
                    </td>
                </tr>
                ))
            ) : (
                <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                        لا توجد نتائج مطابقة للبحث
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="border-t border-white/10 p-4 bg-slate-900/30 flex justify-between items-center">
          <div className="text-xs text-slate-400">
              عرض <span className="text-white font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> إلى <span className="text-white font-mono">{Math.min(currentPage * itemsPerPage, filteredReports.length)}</span> من أصل <span className="text-white font-mono">{filteredReports.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-300"
              >
                  <ChevronRight size={18} />
              </button>
              
              <div className="px-4 py-1.5 bg-white/5 rounded-lg text-sm font-mono text-indigo-300 border border-white/5">
                  {currentPage} / {totalPages || 1}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-slate-300"
              >
                  <ChevronLeft size={18} />
              </button>
          </div>
      </div>

      {/* --- Modals --- */}
      
      {/* 1. Reality Editor (God Mode) */}
      {editingReport && (
        <EditRealityModal 
            report={editingReport} 
            technicians={technicians}
            onClose={() => setEditingReport(null)}
            onSave={handleSaveReport}
        />
      )}

      {/* 2. Review Modal */}
      {reviewingReport && (
          <ReportReviewModal 
            report={reviewingReport}
            onClose={() => setReviewingReport(null)}
            onSave={handleSaveReport}
          />
      )}
    </GlassCard>
  );
};

// --- Helper Components Moved Outside ---

const EditRealityModal: React.FC<{ report: Report, technicians: User[], onClose: () => void, onSave: (r: Report) => void }> = ({ report, technicians, onClose, onSave }) => {
    // Lazy initialize state to avoid potential issues with stale props
    const [data, setData] = useState<Report>(() => ({ ...report }));
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'dynamic'>('basic');

    const update = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));

    // Handler for raw JSON editing
    const handleJsonChange = (json: string) => {
        try {
            const parsed = JSON.parse(json);
            update('dynamicData', parsed);
            setJsonError(null);
        } catch (e) {
            setJsonError('تنسيق JSON غير صحيح');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                <div className="p-6 bg-slate-900 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg text-red-400 border border-red-500/50"><Edit3 size={24} /></div>
                        <div>
                            <h2 className="text-xl font-bold text-red-100">تعديل الواقع (God Mode)</h2>
                            <p className="text-xs text-red-400">تحذير: أنت تملك صلاحية تجاوز قواعد النظام.</p>
                        </div>
                    </div>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-900 border-b border-white/10 shrink-0">
                    <button 
                        onClick={() => setActiveTab('basic')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'basic' ? 'bg-white/10 text-white border-b-2 border-red-500' : 'text-slate-400'}`}
                    >
                        البيانات الأساسية
                    </button>
                    <button 
                        onClick={() => setActiveTab('dynamic')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'dynamic' ? 'bg-white/10 text-white border-b-2 border-red-500' : 'text-slate-400'}`}
                    >
                        البيانات الديناميكية (Raw Data)
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'basic' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-500 border-b border-white/10 pb-2">التفاصيل العامة</h3>
                                <GlassInput label="وصف العطل" type="textarea" value={data.description} onChange={(v) => update('description', v)} />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">الحالة</label>
                                        <select value={data.status} onChange={(e) => update('status', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white">
                                            {Object.values(ReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">الأولوية</label>
                                        <select value={data.priority} onChange={(e) => update('priority', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white">
                                            {Object.values(ReportPriority).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                     <label className="text-xs text-slate-400 mb-1 block">تعيين فني</label>
                                     <select 
                                        value={data.assignedTechnicianId || ''} 
                                        onChange={(e) => {
                                            const tech = technicians.find(t => t.id === e.target.value);
                                            setData(prev => ({ ...prev, assignedTechnicianId: tech?.id, assignedTechnicianName: tech?.name }));
                                        }} 
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white"
                                     >
                                        <option value="">-- غير معين --</option>
                                        {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                 <h3 className="text-sm font-bold text-slate-500 border-b border-white/10 pb-2">بيانات حساسة & سرية</h3>
                                 
                                 <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-1 bg-red-500/20 rounded-bl-lg border-b border-l border-red-500/20">
                                         <Lock size={12} className="text-red-400" />
                                     </div>
                                     <label className="text-sm font-bold text-red-200 mb-2 block">ملاحظات الإدارة السرية</label>
                                     <textarea 
                                        value={data.adminNotes || ''}
                                        onChange={(e) => update('adminNotes', e.target.value)}
                                        className="w-full bg-slate-950/50 border border-red-500/20 rounded-lg p-3 text-red-100 placeholder-red-800/50 outline-none h-32"
                                        placeholder="اكتب ملاحظات لا يراها إلا المدراء..."
                                     />
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                     <GlassInput label="التكلفة" type="number" value={data.cost} onChange={(v) => update('cost', parseFloat(v))} />
                                     <GlassInput label="قطع الغيار" value={data.partsUsed} onChange={(v) => update('partsUsed', v)} />
                                 </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="mb-4 flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg shrink-0">
                                <AlertTriangle className="text-yellow-400 shrink-0" size={20} />
                                <div className="text-xs text-yellow-200">
                                    <strong className="block mb-1">تحرير الهيكل الديناميكي (JSON)</strong>
                                    هنا يمكنك تعديل الإجابات التي أدخلها الفرع أو الفني مباشرة. استخدم هذا بحذر شديد لتصحيح الأخطاء التقنية.
                                </div>
                            </div>
                            <div className="relative flex-1 min-h-[300px]">
                                <textarea 
                                    defaultValue={JSON.stringify(data.dynamicData, null, 2)}
                                    onChange={(e) => handleJsonChange(e.target.value)}
                                    className="w-full h-full bg-slate-950 font-mono text-sm text-green-400 p-4 rounded-xl border border-white/10 outline-none focus:border-red-500 transition-colors"
                                    spellCheck={false}
                                />
                                {jsonError && (
                                    <div className="absolute bottom-4 right-4 bg-red-600 text-white text-xs px-3 py-1 rounded shadow-lg">
                                        {jsonError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-900 border-t border-white/10 flex justify-end gap-3 shrink-0">
                    <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                    <Button 
                        variant="danger" 
                        icon={Save} 
                        onClick={() => onSave(data)}
                        disabled={!!jsonError}
                    >
                        حفظ وتعديل الواقع
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
};

const ReportReviewModal: React.FC<any> = ({ report, onClose, onSave }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-2xl bg-slate-900 border-emerald-500/30">
                <div className="p-6">
                    <h2 className="text-xl font-bold mb-4">مراجعة سريعة</h2>
                    <p className="text-slate-400 mb-6">هل تود اعتماد هذا البلاغ وإغلاقه؟</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={onClose}>إلغاء</Button>
                        <Button variant="primary" onClick={() => onSave({...report, status: ReportStatus.CLOSED})}>اعتماد وإغلاق</Button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};
