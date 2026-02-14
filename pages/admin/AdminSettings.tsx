
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DynamicField, FieldType, SystemConfig } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { Plus, Trash2, GripVertical, Settings2, Smartphone, Wrench, Package, Database, FileSpreadsheet, Upload, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataImporter } from './components/DataImporter';

export const AdminSettings: React.FC = () => {
  const { config, updateField, addField, updateFeature } = useApp();
  const [activeTab, setActiveTab] = useState<'report' | 'repair' | 'data'>('report');
  const [showImporter, setShowImporter] = useState(false);
  
  if (!config) return <div className="p-10 text-center text-slate-400">جاري تحميل إعدادات النظام...</div>;

  const currentSection = activeTab === 'report' ? 'reportQuestions' : 'repairFields';
  const currentFields = config[currentSection] || [];

  const handleAddField = async () => {
    const newField: DynamicField = {
      id: `field_${Date.now()}`,
      labelAr: 'حقل جديد',
      type: 'text',
      required: false,
      step: 1,
      order: currentFields.length + 1
    };
    await addField(currentSection, newField);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-indigo-400 to-cyan-400 flex items-center gap-2">
                <Settings2 /> إعدادات النظام
            </h2>
            <p className="text-slate-400 mt-1">التحكم المركزي في النماذج، البيانات، والميزات.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
         {/* Features Toggles */}
         <GlassCard className="p-6">
             <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">الميزات العامة</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.keys(config.features).map(key => (
                     <div key={key} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-white/5">
                         <span className="text-slate-300 font-medium">
                             {key === 'enableWhatsApp' && 'تفعيل واتساب للمخازن'}
                             {key === 'requireEvidenceBefore' && 'إلزامية تصوير العطل'}
                             {key === 'requireEvidenceAfter' && 'إلزامية تصوير الإصلاح'}
                             {key === 'autoAssign' && 'التعيين التلقائي للفنيين'}
                         </span>
                         <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={key === 'enableWhatsApp' ? true : (config.features as any)[key]} 
                                onChange={(e) => updateFeature(key, e.target.checked)}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                     </div>
                 ))}
             </div>
         </GlassCard>

         {/* Configuration Tabs */}
         <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-2 bg-slate-800/50 p-1 rounded-xl border border-white/10">
                <button 
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Smartphone size={18} /> تطبيق الفرع
                </button>
                <button 
                    onClick={() => setActiveTab('repair')}
                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold ${activeTab === 'repair' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Wrench size={18} /> تطبيق الفني
                </button>
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all font-bold ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <Database size={18} /> إدارة البيانات
                </button>
            </div>

            {/* Tab Content: Data Management */}
            {activeTab === 'data' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard className="p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                            <FileSpreadsheet /> استيراد بيانات (Excel/CSV)
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 flex-1">
                            لتحديث قاعدة بيانات الفروع أو الفنيين دفعة واحدة. يرجى التأكد من مطابقة أسماء الأعمدة للقالب القياسي.
                        </p>
                        <div 
                            onClick={() => setShowImporter(true)}
                            className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                        >
                            <Upload className="mx-auto text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" size={32} />
                            <span className="text-sm text-slate-300 font-bold">اضغط لرفع الملف أو اسحبه هنا</span>
                            <p className="text-xs text-slate-500 mt-2">يدعم .xlsx, .csv</p>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 h-full flex flex-col">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-400">
                            <Download /> النسخ الاحتياطي والتصدير
                        </h3>
                         <p className="text-slate-400 text-sm mb-6 flex-1">
                            تحميل نسخة كاملة من سجل البلاغات، أداء الفنيين، وهيكلية النظام الحالية بصيغة JSON أو Excel للتحليل.
                        </p>
                        <div className="space-y-3">
                            <Button variant="secondary" className="w-full justify-between group" icon={FileText}>
                                تصدير سجل البلاغات (Excel)
                                <Download size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                            <Button variant="secondary" className="w-full justify-between group" icon={Database}>
                                تصدير قاعدة البيانات كاملة (JSON)
                                <Download size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </div>
                    </GlassCard>
                </motion.div>
            )}

            {/* Tab Content: Field Editors */}
            {(activeTab === 'report' || activeTab === 'repair') && (
                 <div className="space-y-3">
                     <AnimatePresence mode="popLayout">
                        {currentFields.sort((a,b) => a.order - b.order).map((field, idx) => (
                            <motion.div 
                                key={field.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-start group border-l-4 border-l-indigo-500 hover:border-indigo-400">
                                    <div className="pt-4 text-slate-600 cursor-move">
                                        <GripVertical size={20} />
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-slate-500 mb-1 block">عنوان الحقل</label>
                                            <input 
                                                value={field.labelAr}
                                                onChange={(e) => updateField(currentSection, field.id, { labelAr: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none transition-colors"
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-1">
                                            <label className="text-xs text-slate-500 mb-1 block">نوع الإدخال</label>
                                            <select 
                                                value={field.type}
                                                onChange={(e) => updateField(currentSection, field.id, { type: e.target.value as FieldType })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                                            >
                                                 <option value="text">نص (Text)</option>
                                                 <option value="textarea">مقال (TextArea)</option>
                                                 <option value="number">رقم (Number)</option>
                                                 <option value="select">قائمة (Select)</option>
                                                 <option value="image">كاميرا (Image)</option>
                                                 <option value="gps">موقع (GPS)</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-1">
                                            <label className="text-xs text-slate-500 mb-1 block">تلميح (Placeholder)</label>
                                            <input 
                                                value={field.placeholder || ''}
                                                onChange={(e) => updateField(currentSection, field.id, { placeholder: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                         <div className="md:col-span-1 flex items-center gap-3 pt-6">
                                            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={field.required}
                                                    onChange={(e) => updateField(currentSection, field.id, { required: e.target.checked })}
                                                    className="w-4 h-4 rounded accent-indigo-500"
                                                />
                                                مطلوب
                                            </label>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('حذف هذا الحقل نهائياً؟')) updateField(currentSection, field.id, null as any)
                                                }}
                                                className="mr-auto p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {field.type === 'select' && (
                                            <div className="md:col-span-4 animate-in fade-in">
                                                 <label className="text-xs text-slate-500 mb-1 block">الخيارات (مفصولة بفاصلة)</label>
                                                 <input 
                                                    value={field.options?.join(', ')}
                                                    onChange={(e) => updateField(currentSection, field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                    className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-3 py-2 text-slate-300 text-sm"
                                                    placeholder="مثال: خيار 1, خيار 2"
                                                 />
                                            </div>
                                        )}
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))}
                     </AnimatePresence>

                     <Button variant="secondary" onClick={handleAddField} icon={Plus} className="w-full border-dashed py-4 opacity-70 hover:opacity-100">
                         إضافة سؤال / حقل جديد
                     </Button>
                 </div>
            )}
         </div>

         {/* Modals */}
         <AnimatePresence>
            {showImporter && (
                <DataImporter onClose={() => setShowImporter(false)} />
            )}
         </AnimatePresence>
      </div>
    </div>
  );
};
