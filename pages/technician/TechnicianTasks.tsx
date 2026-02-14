
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { generatePartsRequestUrl } from '../../utils/whatsapp';
import { Report, ReportStatus, SparePart, PartUsage } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge, PriorityBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DynamicFormRenderer } from '../../components/form/DynamicFormRenderer';
import { 
    MapPin, 
    MessageCircle, 
    Wrench, 
    X, 
    Play, 
    CheckCircle2, 
    WifiOff, 
    Plus,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper: Haversine Distance (KM)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

export const TechnicianTasks: React.FC = () => {
  const { user, config } = useApp();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'my_tasks' | 'completed'>('my_tasks');
  const [tasks, setTasks] = useState<Report[]>([]);
  const [availableParts, setAvailableParts] = useState<SparePart[]>([]);
  const [selectedParts, setSelectedParts] = useState<PartUsage[]>([]);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [activeTask, setActiveTask] = useState<Report | null>(null);
  
  const [repairData, setRepairData] = useState<Record<string, any>>({});
  const [partsRequest, setPartsRequest] = useState({ partName: '', quantity: '1', notes: '' });

  useEffect(() => {
      loadData();
      
      // Real-time updates
      const subscription = api.subscribeToReports((payload) => {
         if (payload.new.assigned_technician_id === user?.id) {
             loadData();
             if(payload.eventType === 'INSERT') showToast('لديك مهمة جديدة!', 'info');
         }
      });

      return () => { subscription.unsubscribe(); };
  }, [user]);

  const loadData = async () => {
    const [allReports, inventory] = await Promise.all([api.getReports(), api.getInventory()]);
    const myTasks = allReports.filter(r => r.assignedTechnicianId === user?.id);
    setTasks(myTasks);
    setAvailableParts(inventory);
  };

  // --- Geofencing Logic ---
  const validateLocation = async (task: Report): Promise<boolean> => {
      // Check Admin Config for Feature Flag
      if (config?.features.requireLocationEnforcement === false) {
          // Feature disabled by admin
          return true;
      }

      if (!task.locationCoords) {
          showToast('تنبيه: هذا البلاغ لا يحتوي على إحداثيات GPS. سيتم تجاوز التحقق.', 'warning');
          return true;
      }

      return new Promise((resolve) => {
          if (!navigator.geolocation) {
              showToast('جهازك لا يدعم GPS', 'error');
              resolve(false);
              return;
          }

          setLoadingAction(true);
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  setLoadingAction(false);
                  const userLat = pos.coords.latitude;
                  const userLng = pos.coords.longitude;
                  
                  const distKm = calculateDistance(userLat, userLng, task.locationCoords!.lat, task.locationCoords!.lng);
                  const distMeters = distKm * 1000;
                  
                  console.log(`Distance: ${distMeters.toFixed(2)}m`);

                  if (distMeters <= 500) {
                      resolve(true);
                  } else {
                      showToast(`أنت بعيد جداً عن الموقع! المسافة: ${(distKm).toFixed(2)} كم. يجب أن تكون داخل نطاق 500 متر.`, 'error');
                      resolve(false);
                  }
              },
              (err) => {
                  setLoadingAction(false);
                  showToast('فشل في تحديد موقعك. تأكد من تفعيل GPS.', 'error');
                  resolve(false);
              }
          );
      });
  };

  const handleStartTask = async (task: Report) => {
    const allowed = await validateLocation(task);
    if (!allowed) return;

    const updated = { ...task, status: ReportStatus.IN_PROGRESS };
    await api.saveReport(updated);
    showToast('تم بدء المهمة وتأكيد الموقع.', 'success');
    loadData();
  };

  const handleCompleteSubmit = async () => {
      if (!activeTask || !config) return;
      
      const allowed = await validateLocation(activeTask);
      if (!allowed) return;

      setLoadingAction(true);

      const partsCost = selectedParts.reduce((acc, curr) => acc + curr.totalCost, 0);
      const laborCost = repairData['cost'] ? Number(repairData['cost']) : 0;

      // Collect Images from dynamic form
      let afterImages: string[] = [];
      config.repairFields.forEach(f => {
          if (f.type === 'image' && repairData[f.id]) {
              afterImages = [...afterImages, ...repairData[f.id]];
          }
      });

      const updatedReport: Report = {
          ...activeTask,
          status: ReportStatus.COMPLETED,
          cost: partsCost + laborCost,
          partsUsageList: selectedParts,
          imagesAfter: afterImages,
          dynamicData: { ...activeTask.dynamicData, ...repairData },
          // Note: In real app, we'd map repairData to dynamicAnswers too
      };

      await api.saveReport(updatedReport);
      
      showToast('تم إغلاق البلاغ بنجاح!', 'success');
      setLoadingAction(false);
      setShowCompleteForm(false);
      setActiveTask(null);
      setSelectedParts([]);
      loadData();
  };

  // ... (Inventory Handlers: handleAddPart, updatePartRow, removePartRow - same as before)
  const handleAddPart = () => setSelectedParts([...selectedParts, { partId: '', partName: '', quantity: 1, unitPrice: 0, totalCost: 0 }]);
  const updatePartRow = (index: number, field: any, value: any) => {
      const updated = [...selectedParts];
      if (field === 'partId') {
          const part = availableParts.find(p => p.id === value);
          if (part) {
              updated[index].partId = part.id;
              updated[index].partName = part.name;
              updated[index].unitPrice = part.price;
              updated[index].totalCost = part.price * updated[index].quantity;
          }
      } else if (field === 'quantity') {
          updated[index].quantity = Number(value);
          updated[index].totalCost = updated[index].unitPrice * Number(value);
      }
      setSelectedParts(updated);
  };
  const removePartRow = (index: number) => setSelectedParts(selectedParts.filter((_, i) => i !== index));

  const sendWhatsApp = () => {
      if (!activeTask) return;
      const note = `الصنف: ${partsRequest.partName} - الكمية: ${partsRequest.quantity} - ${partsRequest.notes}`;
      const url = generatePartsRequestUrl(activeTask, note);
      window.open(url, '_blank');
      setShowPartsModal(false);
      const updated = { ...activeTask, status: ReportStatus.PENDING_PARTS };
      api.saveReport(updated).then(loadData);
  };

  const displayedTasks = tasks.filter(t => activeTab === 'my_tasks' ? t.status !== ReportStatus.COMPLETED && t.status !== ReportStatus.CLOSED : t.status === ReportStatus.COMPLETED || t.status === ReportStatus.CLOSED);

  return (
    <div className="max-w-xl mx-auto pb-24">
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md pt-4 pb-2 border-b border-white/5 mb-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 px-1"><Wrench className="text-indigo-400" /> منصة الفنيين</h2>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('my_tasks')} className={`py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my_tasks' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>مهامي الحالية</button>
            <button onClick={() => setActiveTab('completed')} className={`py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>السجل المكتمل</button>
        </div>
      </div>
      
      <div className="space-y-4">
        {displayedTasks.map(task => (
            <GlassCard key={task.id} className="overflow-hidden group border-l-4 border-l-indigo-500">
                <div className="p-4 flex justify-between items-start border-b border-white/5 bg-slate-800/30">
                    <div>
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-slate-500">#{task.id.split('-')[1]}</span><PriorityBadge priority={task.priority} /></div>
                        <h3 className="font-bold text-lg">{task.machineType}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1 mt-1"><MapPin size={14} className="text-indigo-400" /> {task.branchName}</p>
                    </div>
                    <StatusBadge status={task.status} />
                </div>
                <div className="p-4">
                    <p className="text-sm text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-lg border border-white/5 leading-relaxed">{task.description}</p>
                    {activeTab === 'my_tasks' && (
                        <div className="flex gap-2 mt-4">
                            {task.status === ReportStatus.ASSIGNED || task.status === ReportStatus.NEW ? (
                                <Button onClick={() => handleStartTask(task)} className="w-full bg-indigo-600" isLoading={loadingAction} icon={Play}>تأكيد الوصول وبدء العمل</Button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button onClick={() => { setActiveTask(task); setShowPartsModal(true); }} className="flex items-center justify-center gap-2 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/30 py-3 rounded-xl font-bold text-sm"><MessageCircle size={18} /> طلب قطع</button>
                                    <Button onClick={() => { setActiveTask(task); setShowCompleteForm(true); setSelectedParts([]); }} variant="primary" className="bg-emerald-600">إنهاء العمل <CheckCircle2 size={18} /></Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </GlassCard>
        ))}
        {displayedTasks.length === 0 && <div className="text-center text-slate-500 mt-10">لا توجد مهام حالياً</div>}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompleteForm && activeTask && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4">
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="w-full max-w-lg bg-slate-900 border border-white/10 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                        <h3 className="font-bold text-lg flex items-center gap-2"><CheckCircle2 size={20} /> إثبات الإصلاح</h3>
                        <button onClick={() => setShowCompleteForm(false)}><X size={24} className="text-slate-400" /></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Dynamic Fields */}
                        {config?.repairFields && (
                             <DynamicFormRenderer 
                                fields={config.repairFields.filter(f => f.id !== 'partsUsed' && f.id !== 'cost')}
                                formData={repairData}
                                onChange={(id, val) => setRepairData(prev => ({...prev, [id]: val}))}
                                watermarkInfo={{
                                    location: `${activeTask.branchName}`,
                                    timestamp: new Date().toLocaleString()
                                }}
                             />
                        )}

                        {/* Parts Inventory Section */}
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                            <label className="text-slate-300 text-sm font-bold mb-3 block">قطع الغيار (تخصم من المخزون)</label>
                            {selectedParts.map((part, index) => (
                                <div key={index} className="flex gap-2 mb-2 items-center">
                                    <select 
                                        value={part.partId}
                                        onChange={(e) => updatePartRow(index, 'partId', e.target.value)}
                                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white"
                                    >
                                        <option value="">-- اختر --</option>
                                        {availableParts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="number" value={part.quantity} onChange={(e) => updatePartRow(index, 'quantity', e.target.value)} className="w-16 bg-slate-900 border border-white/10 rounded-lg p-2 text-center text-white" min="1" />
                                    <button onClick={() => removePartRow(index)} className="p-2 text-red-400"><Trash2 size={16} /></button>
                                </div>
                            ))}
                            <button onClick={handleAddPart} className="mt-2 text-xs text-indigo-400 flex items-center gap-1"><Plus size={14}/> إضافة صنف</button>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10 bg-slate-900">
                        <Button 
                            onClick={handleCompleteSubmit} 
                            isLoading={loadingAction}
                            className="w-full py-4 text-lg bg-emerald-600"
                            variant="primary"
                            icon={CheckCircle2}
                        >
                           تأكيد وإغلاق البلاغ
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};
