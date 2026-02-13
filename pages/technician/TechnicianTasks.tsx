
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { generatePartsRequestUrl } from '../../utils/whatsapp';
import { Report, ReportStatus } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { DynamicFormRenderer } from '../../components/form/DynamicFormRenderer';
import { 
    MapPin, 
    CheckSquare, 
    MessageCircle, 
    Wrench, 
    X, 
    Play, 
    ClipboardList, 
    CheckCircle2, 
    WifiOff, 
    RefreshCw,
    PackageSearch,
    Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Helper: Offline Queue Management ---
const saveOfflineQueue = (queue: any[]) => localStorage.setItem('ems_offline_queue', JSON.stringify(queue));
const getOfflineQueue = () => JSON.parse(localStorage.getItem('ems_offline_queue') || '[]');

export const TechnicianTasks: React.FC = () => {
  const { user, config } = useApp();
  const { showToast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'completed'>('my_tasks');
  const [tasks, setTasks] = useState<Report[]>([]);
  const [offlineTasks, setOfflineTasks] = useState<any[]>([]); // Track offline completions
  const [activeTask, setActiveTask] = useState<Report | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Forms State
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  
  // Data State
  const [repairData, setRepairData] = useState<Record<string, any>>({});
  const [partsRequest, setPartsRequest] = useState({ partName: '', quantity: '1', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Network Listener ---
  useEffect(() => {
      const handleStatusChange = () => {
          setIsOnline(navigator.onLine);
          if (navigator.onLine) {
              syncOfflineTasks(); // Try to sync when back online
          }
      };
      window.addEventListener('online', handleStatusChange);
      window.addEventListener('offline', handleStatusChange);
      
      // Initial Load
      setOfflineTasks(getOfflineQueue());
      loadTasks();

      return () => {
          window.removeEventListener('online', handleStatusChange);
          window.removeEventListener('offline', handleStatusChange);
      };
  }, [user]);

  // --- Sync Logic ---
  const syncOfflineTasks = async () => {
      const queue = getOfflineQueue();
      if (queue.length === 0) return;

      showToast(`جاري مزامنة ${queue.length} عمليات مخزنة...`, 'info');
      
      const newQueue = [...queue];
      for (let i = 0; i < queue.length; i++) {
          try {
              const item = queue[i];
              await api.saveReport(item); // Actually save to backend
              newQueue.shift(); // Remove from queue if successful
          } catch (e) {
              console.error("Sync failed for item", i);
              break; // Stop syncing on error
          }
      }
      
      saveOfflineQueue(newQueue);
      setOfflineTasks(newQueue);
      loadTasks(); // Refresh list
      
      if (newQueue.length === 0) showToast('تمت المزامنة بنجاح!', 'success');
  };

  const loadTasks = async () => {
    // If online, fetch from API. If offline, rely on cached reports if we had them (simplified here to always fetch from "mock" api which is localstorage anyway)
    // But to simulate "Offline Mode", we will visually merge offline queue updates.
    const all = await api.getReports();
    const myTasks = all.filter(r => r.assignedTechnicianId === user?.id);
    setTasks(myTasks);
  };

  const verifyLocation = (): Promise<boolean> => {
      return new Promise((resolve) => {
          if (!navigator.geolocation) {
              showToast('المتصفح لا يدعم تحديد الموقع', 'error');
              resolve(false);
              return;
          }
          setLoadingGPS(true);
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  setLoadingGPS(false);
                  resolve(true); 
              },
              (err) => {
                  setLoadingGPS(false);
                  // In Offline Mode, we might skip strict GPS check or allow manual override
                  if (!navigator.onLine) {
                      showToast('تنبيه: تعذر تحديد الموقع بدقة (وضع الأوفلاين)', 'warning');
                      resolve(true);
                  } else {
                      showToast('يجب تفعيل الـ GPS للتأكد من تواجدك في الفرع', 'error');
                      resolve(false);
                  }
              }
          );
      });
  };

  // --- Actions ---

  const handleStartTask = async (task: Report) => {
    const atBranch = await verifyLocation();
    if (!atBranch) return;

    const updated = { ...task, status: ReportStatus.IN_PROGRESS };
    
    if (isOnline) {
        await api.saveReport(updated);
        showToast('تم بدء المهمة. بالتوفيق!', 'success');
        loadTasks();
    } else {
        showToast('لا يوجد انترنت. لا يمكن بدء مهام جديدة، لكن يمكنك إنهاء المهام الجارية.', 'error');
    }
  };

  const openPartsModal = (task: Report) => {
      setActiveTask(task);
      setShowPartsModal(true);
      setPartsRequest({ partName: '', quantity: '1', notes: '' });
  };

  const sendWhatsApp = () => {
      if (!activeTask) return;
      if (!partsRequest.partName) {
          showToast('يرجى كتابة اسم القطعة', 'error');
          return;
      }
      
      const note = `
- الصنف: ${partsRequest.partName}
- الكمية: ${partsRequest.quantity}
- ملاحظات: ${partsRequest.notes || 'لا يوجد'}
      `.trim();

      const url = generatePartsRequestUrl(activeTask, note);
      window.open(url, '_blank');
      setShowPartsModal(false);
      
      // Update status to PENDING_PARTS locally/remotely
      const updated = { ...activeTask, status: ReportStatus.PENDING_PARTS };
      if(isOnline) {
          api.saveReport(updated).then(loadTasks);
      }
  };

  const handleCompleteSubmit = async () => {
      if (!activeTask || !config) return;
      
      // 1. Verify Location
      const atBranch = await verifyLocation();
      if (!atBranch) return;

      setIsSubmitting(true);

      // 2. Process Data
      const repairAnswers = Object.entries(repairData).map(([key, value]) => {
          const fieldDef = config.repairFields.find(f => f.id === key);
          return fieldDef ? {
              fieldId: key,
              labelAr: fieldDef.labelAr,
              value: value,
              type: fieldDef.type
          } : null;
      }).filter(Boolean);

      const imageFields = config.repairFields.filter(f => f.type === 'image');
      let afterImages: string[] = [];
      imageFields.forEach(f => {
          if(repairData[f.id] && Array.isArray(repairData[f.id])) {
            afterImages = [...afterImages, ...repairData[f.id]];
          }
      });

      const updatedReport: Report = {
          ...activeTask,
          status: ReportStatus.COMPLETED,
          cost: repairData['cost'] || 0,
          partsUsed: repairData['partsUsed'] || '',
          imagesAfter: afterImages,
          dynamicData: { ...activeTask.dynamicData, ...repairData },
          dynamicAnswers: [...activeTask.dynamicAnswers, ...repairAnswers as any]
      };

      // 3. Save (Online vs Offline)
      if (isOnline) {
          await api.saveReport(updatedReport);
          showToast('تم إغلاق البلاغ بنجاح! عمل رائع.', 'success');
      } else {
          const queue = getOfflineQueue();
          queue.push(updatedReport);
          saveOfflineQueue(queue);
          setOfflineTasks(queue);
          showToast('تم الحفظ محلياً (أوفلاين). سيتم الرفع عند عودة الإنترنت.', 'warning');
      }

      setIsSubmitting(false);
      setShowCompleteForm(false);
      setActiveTask(null);
      loadTasks();
  };

  // --- Render Helpers ---

  // Merge live tasks with offline updates for display
  const getMergedTasks = () => {
      // Create a map of offline updates by ID
      const offlineMap = new Map(offlineTasks.map(t => [t.id, t]));
      
      return tasks.map(t => {
          if (offlineMap.has(t.id)) return offlineMap.get(t.id);
          return t;
      });
  };

  const displayedTasks = getMergedTasks().filter(t => 
      activeTab === 'my_tasks' ? t.status !== ReportStatus.COMPLETED && t.status !== ReportStatus.CLOSED 
      : t.status === ReportStatus.COMPLETED || t.status === ReportStatus.CLOSED
  );

  return (
    <div className="max-w-xl mx-auto pb-24">
      
      {/* Offline Banner */}
      <AnimatePresence>
          {!isOnline && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="bg-red-500/10 border-b border-red-500/20 text-red-200 text-xs p-2 text-center font-bold flex items-center justify-center gap-2"
              >
                  <WifiOff size={14} /> أنت تعمل في وضع الأوفلاين. سيتم حفظ البيانات في جهازك.
              </motion.div>
          )}
          {isOnline && offlineTasks.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-200 text-xs p-2 flex items-center justify-between px-4"
              >
                  <span className="flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> جاري مزامنة {offlineTasks.length} عمليات...</span>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Header & Tabs */}
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md pt-4 pb-2 border-b border-white/5 mb-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 px-1">
            <Wrench className="text-indigo-400" />
            منصة الفنيين
        </h2>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/10">
            <button 
                onClick={() => setActiveTab('my_tasks')}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my_tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                مهامي الحالية ({getMergedTasks().filter(t => t.status !== ReportStatus.COMPLETED && t.status !== ReportStatus.CLOSED).length})
            </button>
            <button 
                onClick={() => setActiveTab('completed')}
                className={`py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                السجل المكتمل
            </button>
        </div>
      </div>
      
      {/* Task List */}
      <div className="space-y-4">
        {displayedTasks.length === 0 ? (
            <div className="text-center py-20 opacity-50 bg-slate-800/20 rounded-2xl border border-dashed border-white/10 m-2">
                <CheckSquare size={64} className="mx-auto mb-4 text-slate-600" />
                <p>لا توجد مهام في هذه القائمة.</p>
            </div>
        ) : (
            displayedTasks.map(task => (
                <GlassCard key={task.id} className="overflow-hidden group border-l-4 border-l-indigo-500">
                    <div className="p-4 flex justify-between items-start border-b border-white/5 bg-slate-800/30">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-slate-500">#{task.id.split('-')[1]}</span>
                                <PriorityBadge priority={task.priority} />
                            </div>
                            <h3 className="font-bold text-lg">{task.machineType}</h3>
                            <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                                <MapPin size={14} className="text-indigo-400" /> {task.branchName}
                            </p>
                        </div>
                        <StatusBadge status={task.status} />
                    </div>

                    <div className="p-4">
                        <p className="text-sm text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-lg border border-white/5 leading-relaxed">
                            {task.description}
                        </p>
                        
                        {/* Offline Queued Badge */}
                        {offlineTasks.some(ot => ot.id === task.id) && (
                            <div className="mb-4 text-xs bg-yellow-500/10 text-yellow-400 p-2 rounded border border-yellow-500/20 flex items-center gap-2">
                                <WifiOff size={12} /> تم الحفظ محلياً - بانتظار المزامنة
                            </div>
                        )}

                        {activeTab === 'my_tasks' && (
                            <div className="flex gap-2 mt-4">
                                {task.status === ReportStatus.ASSIGNED || task.status === ReportStatus.NEW ? (
                                    <Button 
                                        onClick={() => handleStartTask(task)}
                                        className="w-full bg-indigo-600"
                                        isLoading={loadingGPS}
                                        icon={Play}
                                        disabled={!isOnline} // Prevent starting new tasks offline for safety, or allow if desired
                                    >
                                        تأكيد الوصول وبدء العمل
                                    </Button>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <button 
                                            onClick={() => openPartsModal(task)}
                                            className="flex items-center justify-center gap-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 py-3 rounded-xl transition-all font-bold text-sm"
                                        >
                                            <MessageCircle size={18} /> طلب قطع
                                        </button>
                                        <Button 
                                            onClick={() => { setActiveTask(task); setShowCompleteForm(true); }}
                                            variant="primary"
                                            className="bg-emerald-600"
                                        >
                                            إنهاء العمل <CheckCircle2 size={18} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'completed' && (
                            <div className="flex justify-end">
                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 size={14} /> تم الإنجاز في {new Date(task.createdAt).toLocaleDateString('ar-EG')}
                                </span>
                            </div>
                        )}
                    </div>
                </GlassCard>
            ))
        )}
      </div>

      {/* --- Modals --- */}

      {/* 1. Parts Request Modal (WhatsApp) */}
      <AnimatePresence>
          {showPartsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-4 bg-green-900/20 border-b border-green-500/20 flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-green-400">
                            <MessageCircle /> طلب قطع غيار (واتساب)
                        </h3>
                        <button onClick={() => setShowPartsModal(false)}><X className="text-slate-400" /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <GlassInput 
                            label="اسم القطعة / الصنف" 
                            value={partsRequest.partName} 
                            onChange={(v) => setPartsRequest({...partsRequest, partName: v})} 
                            placeholder="مثال: كومبريسور 1.5 حصان"
                        />
                        <GlassInput 
                            label="الكمية" 
                            type="number"
                            value={partsRequest.quantity} 
                            onChange={(v) => setPartsRequest({...partsRequest, quantity: v})} 
                        />
                        <GlassInput 
                            label="ملاحظات إضافية" 
                            type="textarea"
                            rows={2}
                            value={partsRequest.notes} 
                            onChange={(v) => setPartsRequest({...partsRequest, notes: v})} 
                        />
                        <Button variant="primary" onClick={sendWhatsApp} icon={Send} className="w-full !bg-green-600 hover:!bg-green-500">
                            فتح واتساب وإرسال الطلب
                        </Button>
                    </div>
                </motion.div>
            </div>
          )}
      </AnimatePresence>

      {/* 2. Completion Form Modal (Dynamic + Offline Capable) */}
      <AnimatePresence>
        {showCompleteForm && activeTask && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4">
                <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 500 }}
                    className="w-full max-w-lg bg-slate-900 border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><ClipboardList size={20} /></div>
                             <h3 className="font-bold text-lg">إثبات الإصلاح {activeTask.id.split('-')[1]}#</h3>
                        </div>
                        <button onClick={() => setShowCompleteForm(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1">
                        {!isOnline && (
                             <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl text-xs text-yellow-200 flex items-center gap-2">
                                 <WifiOff size={14} /> سيتم حفظ التقرير محلياً حتى يعود الإنترنت.
                             </div>
                        )}

                        <div className="mb-6 bg-slate-800/50 border border-white/5 p-4 rounded-xl">
                            <p className="text-xs text-slate-400 mb-1">العملية:</p>
                            <p className="font-bold text-white text-lg">{activeTask.machineType}</p>
                        </div>

                        {config?.repairFields ? (
                             <DynamicFormRenderer 
                                fields={config.repairFields}
                                formData={repairData}
                                onChange={(id, val) => setRepairData(prev => ({...prev, [id]: val}))}
                                watermarkInfo={{
                                    location: activeTask.branchName, // Simulated Location
                                    timestamp: new Date().toLocaleString('ar-EG') // Live Timestamp
                                }}
                             />
                        ) : (
                            <div className="py-10 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-indigo-500 rounded-full mx-auto"></div></div>
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-slate-900 pb-8 sm:pb-4">
                        <Button 
                            onClick={handleCompleteSubmit} 
                            isLoading={isSubmitting || loadingGPS}
                            className={`w-full py-4 text-lg ${!isOnline ? '!bg-yellow-600' : '!bg-emerald-600'}`}
                            variant="primary"
                            icon={!isOnline ? SaveLocalIcon : CheckCircle2}
                        >
                            {loadingGPS ? 'جاري التحقق من الموقع...' : (isOnline ? 'تأكيد وإغلاق البلاغ' : 'حفظ محلي (أوفلاين)')}
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SaveLocalIcon = () => <WifiOff size={18} />;
