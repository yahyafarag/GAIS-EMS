
import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { SystemConfig, DynamicField, FieldType } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { GlassInput } from '../../../components/ui/GlassInput';
import { Plus, Trash2, Save, GripVertical, FileText, Wrench, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ConfigManager: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'repair'>('report');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const c = await api.getSystemConfig();
      setConfig(c);
    };
    load();
  }, []);

  const handleAddField = () => {
    if (!config) return;
    const newField: DynamicField = {
      id: `field_${Date.now()}`,
      labelAr: 'حقل جديد',
      type: 'text',
      required: false,
      step: 1,
      order: 99
    };
    
    if (activeTab === 'report') {
        setConfig({ ...config, reportQuestions: [...config.reportQuestions, newField] });
    } else {
        setConfig({ ...config, repairFields: [...config.repairFields, newField] });
    }
  };

  const updateField = (id: string, updates: Partial<DynamicField>) => {
    if (!config) return;
    const updateList = (list: DynamicField[]) => list.map(f => f.id === id ? { ...f, ...updates } : f);
    
    if (activeTab === 'report') {
        setConfig({ ...config, reportQuestions: updateList(config.reportQuestions) });
    } else {
        setConfig({ ...config, repairFields: updateList(config.repairFields) });
    }
  };

  const deleteField = (id: string) => {
    if (!config) return;
    if (!window.confirm('هل أنت متأكد؟')) return;
    
    if (activeTab === 'report') {
        setConfig({ ...config, reportQuestions: config.reportQuestions.filter(f => f.id !== id) });
    } else {
        setConfig({ ...config, repairFields: config.repairFields.filter(f => f.id !== id) });
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setIsLoading(true);
    await api.saveSystemConfig(config);
    setIsLoading(false);
    // Visual feedback handled by button state usually, or toast
    alert("تم تحديث النظام بنجاح! ستظهر التعديلات فوراً لدى جميع المستخدمين.");
  };

  if (!config) return <div className="p-10 text-center">جاري تحميل إعدادات النظام...</div>;

  const currentFields = activeTab === 'report' ? config.reportQuestions : config.repairFields;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setActiveTab('report')}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <Smartphone size={18} /> تطبيق الفرع
              </button>
              <button 
                onClick={() => setActiveTab('repair')}
                className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${activeTab === 'repair' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                  <Wrench size={18} /> تطبيق الفني
              </button>
          </div>
          
          <Button onClick={handleSave} isLoading={isLoading} icon={Save} className="w-full md:w-auto">
              نشر التعديلات
          </Button>
      </div>

      {/* Fields List */}
      <div className="space-y-3">
          <AnimatePresence>
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
                            <span className="text-xs font-mono opacity-50">#{idx + 1}</span>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                            <div className="md:col-span-1">
                                <label className="text-xs text-slate-500 mb-1 block">عنوان الحقل</label>
                                <input 
                                    value={field.labelAr}
                                    onChange={(e) => updateField(field.id, { labelAr: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                />
                            </div>
                            
                            <div className="md:col-span-1">
                                <label className="text-xs text-slate-500 mb-1 block">النوع</label>
                                <select 
                                    value={field.type}
                                    onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
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
                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                             <div className="md:col-span-1 flex items-center gap-3 pt-6">
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={field.required}
                                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                        className="w-4 h-4 rounded accent-indigo-500"
                                    />
                                    مطلوب
                                </label>
                                <button 
                                    onClick={() => deleteField(field.id)}
                                    className="mr-auto p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {field.type === 'select' && (
                                <div className="md:col-span-4">
                                     <label className="text-xs text-slate-500 mb-1 block">الخيارات (مفصولة بفاصلة)</label>
                                     <input 
                                        value={field.options?.join(', ')}
                                        onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
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

          <button 
            onClick={handleAddField}
            className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
          >
              <Plus size={20} /> إضافة حقل جديد
          </button>
      </div>
    </div>
  );
};
