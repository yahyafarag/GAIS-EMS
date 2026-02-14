
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { DynamicFormRenderer } from '../../components/form/DynamicFormRenderer';
import { 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Siren, 
  Zap, 
  Flame, 
  MapPin, 
  Camera, 
  Send 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReportPriority, Branch } from '../../types';

export const BranchWizard: React.FC = () => {
  const { user, config, createReport } = useApp();
  const { showToast } = useToast();
  
  // --- State ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  
  // Form Data
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // AI Logic State
  const [detectedPriority, setDetectedPriority] = useState<ReportPriority>(ReportPriority.NORMAL);
  const [aiReason, setAiReason] = useState<string>('');

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      const b = await api.getBranches();
      setBranches(b);
      // Pre-select if manager is linked to branch
      if (user?.branchId) setSelectedBranchId(user.branchId);
    };
    init();

    // Initialize form data structure from config
    if (config) {
      const initialData: Record<string, any> = {};
      config.reportQuestions.forEach(field => {
        if (field.type === 'image') initialData[field.id] = [];
        if (field.type === 'gps') initialData[field.id] = null;
      });
      setFormData(prev => ({ ...initialData, ...prev }));
    }
  }, [config, user]);

  // --- AI Smart Detection Engine ---
  useEffect(() => {
    // Combine all string inputs to analyze context
    const textValues = Object.values(formData)
        .filter(v => typeof v === 'string')
        .join(' ')
        .toLowerCase();
    
    const criticalKeywords = ['حريق', 'نار', 'دخان', 'انفجار', 'كهرباء عارية', 'ماس', 'تسريب غاز', 'خطر', 'صعق', 'إغماء'];
    const highKeywords = ['تكييف', 'سيرفر', 'ثلاجة', 'تعطل كامل', 'بوابة', 'مصعد'];

    const foundCritical = criticalKeywords.find(k => textValues.includes(k));
    const foundHigh = highKeywords.find(k => textValues.includes(k));

    if (foundCritical) {
        if (detectedPriority !== ReportPriority.CRITICAL) {
            setDetectedPriority(ReportPriority.CRITICAL);
            setAiReason(`⚠️ تم اكتشاف كلمة خطرة: "${foundCritical}"`);
            showToast('تم تفعيل وضع الطوارئ تلقائياً بناءً على وصف المشكلة!', 'warning');
            
            // Auto-scroll to top to see alert
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (foundHigh) {
        setDetectedPriority(ReportPriority.HIGH);
        setAiReason(`⚡ تم اكتشاف معدة حيوية: "${foundHigh}"`);
    } else {
        setDetectedPriority(ReportPriority.NORMAL);
        setAiReason('');
    }
  }, [formData]);

  // --- Helpers ---
  
  if (!config) return <div className="text-center p-20 text-slate-400 flex flex-col items-center gap-4"><div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent"></div>جاري تحميل معالج البلاغات...</div>;

  // Split questions into logical steps (Simulated paging based on config "step" property if exists, else chunk it)
  // Note: The previous SystemConfig types had a 'step' property. We use that.
  const getFieldsForStep = (currentStep: number) => {
      // Step 1 is always Branch Selection
      // Step 2 is Text/Info inputs
      // Step 3 is Evidence (Image/GPS)
      // Step 4 is Review
      
      if (currentStep === 2) {
          return config.reportQuestions
            .filter(f => f.type !== 'image' && f.type !== 'gps')
            .sort((a, b) => a.order - b.order);
      }
      if (currentStep === 3) {
          return config.reportQuestions
            .filter(f => f.type === 'image' || f.type === 'gps')
            .sort((a, b) => a.order - b.order);
      }
      return [];
  };

  const handleInputChange = (id: string, value: any) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // --- Validation Logic ---
  const validateStep = () => {
      if (step === 1) return !!selectedBranchId;
      
      if (step === 2) {
          const fields = getFieldsForStep(2);
          for (const f of fields) {
              if (f.required && !formData[f.id]) return false;
          }
          return true;
      }

      if (step === 3) {
          // Strict Validation for Evidence
          const imageFields = config.reportQuestions.filter(f => f.type === 'image');
          const gpsFields = config.reportQuestions.filter(f => f.type === 'gps');

          // Check Images
          for (const f of imageFields) {
              const images = formData[f.id];
              if (f.required && (!images || images.length === 0)) return false;
          }

          // Check GPS
          for (const f of gpsFields) {
               if (f.required && !formData[f.id]) return false;
          }
          return true;
      }

      return true;
  };

  const nextStep = () => {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const prevStep = () => setStep(s => s - 1);

  // --- Submission ---
  const handleSubmit = async () => {
    setLoading(true);
    try {
        const selectedBranch = branches.find(b => b.id === selectedBranchId);
        
        // Extract specialized data
        let allImages: string[] = [];
        let locationData: any = null;

        config.reportQuestions.forEach(f => {
            if (f.type === 'image' && formData[f.id]) allImages = [...allImages, ...formData[f.id]];
            if (f.type === 'gps' && formData[f.id]) locationData = formData[f.id];
        });

        await createReport({
            branchId: selectedBranchId,
            branchName: selectedBranch?.name || 'Unknown',
            createdByUserId: user?.id || 'unknown',
            createdByName: user?.name || 'Unknown',
            priority: detectedPriority,
            imagesBefore: allImages,
            locationCoords: locationData
        }, formData);

        showToast('تم إرسال البلاغ بنجاح! جاري إسناد الفني...', 'success');
        
        // Reset or Redirect
        window.location.hash = '#/branch/history'; // Redirect to history
    } catch (e) {
        showToast('حدث خطأ أثناء الإرسال', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 relative">
      
      {/* --- Emergency Pulse Effect Background --- */}
      <AnimatePresence>
        {detectedPriority === ReportPriority.CRITICAL && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[-1] pointer-events-none"
            >
                <div className="absolute inset-0 bg-red-900/10 animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-[shimmer_2s_infinite]"></div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Progress Header --- */}
      <div className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md py-4 mb-6 border-b border-white/5">
         <div className="flex justify-between items-center mb-2">
             <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-indigo-400 to-cyan-400">
                 بلاغ صيانة جديد
             </h2>
             <div className="text-xs font-mono text-slate-500">
                 Step {step} / 4
             </div>
         </div>
         {/* Progress Bar */}
         <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
             {[1,2,3,4].map(i => (
                 <motion.div 
                    key={i}
                    layout
                    className={`h-full flex-1 border-r border-slate-900 transition-colors duration-500 
                        ${i <= step 
                            ? (detectedPriority === ReportPriority.CRITICAL ? 'bg-red-500' : 'bg-indigo-500') 
                            : 'bg-transparent'
                        }`}
                 />
             ))}
         </div>
      </div>

      <GlassCard className={`
            min-h-[500px] flex flex-col relative overflow-visible transition-all duration-500
            ${detectedPriority === ReportPriority.CRITICAL ? 'border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]' : 'border-white/10'}
      `}>
        
        {/* Critical Alert Banner */}
        <AnimatePresence>
            {detectedPriority === ReportPriority.CRITICAL && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-red-500/20 border-b border-red-500/30"
                >
                    <div className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/40">
                            <Flame className="text-white" size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-red-100">حالة طوارئ قصوى</h4>
                            <p className="text-xs text-red-300 font-mono mt-0.5">{aiReason}</p>
                        </div>
                        <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold animate-pulse">CRITICAL</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="p-6 md:p-8 flex-1">
            
            {/* --- Step 1: Branch Selection --- */}
            {step === 1 && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                    className="flex flex-col h-full justify-center"
                >
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                            <MapPin size={48} className="text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">تحديد الموقع</h3>
                        <p className="text-slate-400">من أين يتم الإبلاغ عن العطل؟</p>
                    </div>

                    <div className="max-w-md mx-auto w-full">
                        <label className="block text-sm text-slate-300 mb-2 font-bold">الفرع</label>
                        <select 
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            className="w-full bg-slate-900 border border-white/20 rounded-xl p-4 text-white text-lg outline-none focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
                        >
                            <option value="">-- اختر الفرع --</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </motion.div>
            )}

            {/* --- Step 2: Details Form (Dynamic) --- */}
            {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                     <div className="mb-6 pb-4 border-b border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Zap size={24} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">تفاصيل المشكلة</h3>
                            <p className="text-xs text-slate-400">صف العطل بدقة لمساعدة النظام في تحديد الأولوية</p>
                        </div>
                     </div>
                     
                     <DynamicFormRenderer 
                        fields={getFieldsForStep(2)}
                        formData={formData}
                        onChange={handleInputChange}
                     />
                </motion.div>
            )}

            {/* --- Step 3: Evidence (Dynamic) --- */}
            {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                     <div className="mb-6 pb-4 border-b border-white/5 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Siren size={24} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-white">التوثيق والموقع</h3>
                            <p className="text-xs text-slate-400">إلزامية رفع الصور وتحديد الموقع لضمان المصداقية</p>
                        </div>
                     </div>
                     
                     <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mb-6 flex gap-3">
                         <AlertTriangle className="text-blue-400 shrink-0" size={20} />
                         <p className="text-xs text-blue-200 leading-relaxed">
                             يجب تفعيل الـ GPS والتقاط صورة حية للعطل. لا يمكن تخطي هذه الخطوة لضمان وصول الفني للمكان الصحيح وتجهيز القطع المناسبة.
                         </p>
                     </div>

                     <DynamicFormRenderer 
                        fields={getFieldsForStep(3)}
                        formData={formData}
                        onChange={handleInputChange}
                     />
                </motion.div>
            )}

            {/* --- Step 4: Review --- */}
            {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="text-center">
                        <div className="inline-block p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                            <CheckCircle2 size={40} className="text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">جاهز للإرسال؟</h3>
                        <p className="text-slate-400 text-sm">راجع البيانات قبل التأكيد النهائي</p>
                    </div>

                    <div className="bg-slate-950/50 rounded-xl border border-white/10 overflow-hidden">
                        {/* Priority Banner in Review */}
                        <div className={`p-3 flex justify-between items-center ${detectedPriority === ReportPriority.CRITICAL ? 'bg-red-600/20' : 'bg-slate-800'}`}>
                             <span className="text-xs text-slate-400 font-bold uppercase">تصنيف النظام (AI)</span>
                             <span className={`px-2 py-1 rounded text-xs font-bold ${detectedPriority === ReportPriority.CRITICAL ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                 {detectedPriority}
                             </span>
                        </div>

                        <div className="p-6 space-y-4">
                            <ReviewItem label="الفرع" value={branches.find(b => b.id === selectedBranchId)?.name} />
                            
                            {config.reportQuestions.map(f => {
                                if (f.type === 'image' || f.type === 'gps') return null;
                                return <ReviewItem key={f.id} label={f.labelAr} value={formData[f.id]} />;
                            })}

                            <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                    <Camera className="mx-auto mb-1 text-slate-400" size={16} />
                                    <span className="text-xs text-slate-300">تم إرفاق الصور</span>
                                </div>
                                <div className="text-center p-3 bg-white/5 rounded-lg">
                                    <MapPin className="mx-auto mb-1 text-emerald-400" size={16} />
                                    <span className="text-xs text-slate-300">تم تحديد الموقع</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>

        {/* --- Footer Actions --- */}
        <div className="p-6 border-t border-white/10 bg-slate-900/50 backdrop-blur-md flex justify-between gap-4">
            {step > 1 ? (
                <Button variant="glass" onClick={prevStep} icon={ArrowRight} className="px-6">
                    رجوع
                </Button>
            ) : <div />}

            {step < 4 ? (
                <Button 
                    variant="primary" 
                    onClick={nextStep} 
                    disabled={!validateStep()}
                    className="px-8"
                >
                   {step === 1 ? 'ابدأ البلاغ' : 'التالي'} <ArrowLeft size={18} />
                </Button>
            ) : (
                <Button 
                    variant={detectedPriority === ReportPriority.CRITICAL ? 'danger' : 'primary'} 
                    onClick={handleSubmit} 
                    isLoading={loading}
                    className="flex-1 shadow-xl"
                    icon={Send}
                >
                    تأكيد وإرسال البلاغ
                </Button>
            )}
        </div>
      </GlassCard>
    </div>
  );
};

// Simple helper for review items
const ReviewItem: React.FC<{ label: string, value: any }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start border-b border-white/5 pb-2 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-sm text-white font-medium max-w-[60%] text-left">{value}</span>
        </div>
    );
}
