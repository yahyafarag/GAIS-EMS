
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DynamicField, FieldType } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Type, 
  Image as ImageIcon, 
  MapPin, 
  List, 
  AlignLeft, 
  Hash, 
  LayoutTemplate,
  CheckCircle2,
  Smartphone,
  Wrench,
  GripVertical
} from 'lucide-react';

// --- Components ---

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all duration-300 overflow-hidden rounded-xl group
      ${active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
    `}
  >
    {active && (
      <motion.div
        layoutId="activeTabBg"
        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-100"
        initial={false}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <span className="relative z-10 flex items-center gap-2">
      <Icon size={18} /> {label}
    </span>
  </button>
);

// Wrapper for Drag Logic
const DraggableFieldItem = ({ field, index, onDelete, onUpdate }: any) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={field}
            id={field.id}
            dragListener={false} // Disable default drag to use handle
            dragControls={dragControls}
            whileDrag={{ scale: 1.02, zIndex: 100 }}
            className="mb-3 relative"
        >
            <FieldEditorItem 
                field={field} 
                index={index} 
                dragControls={dragControls}
                onDelete={onDelete} 
                onUpdate={onUpdate} 
            />
        </Reorder.Item>
    );
};

const FieldEditorItem: React.FC<any> = ({ field, index, dragControls, onDelete, onUpdate }) => {
    
    const getIcon = (type: string) => {
        switch(type) {
            case 'text': return Type;
            case 'textarea': return AlignLeft;
            case 'number': return Hash;
            case 'select': return List;
            case 'image': return ImageIcon;
            case 'gps': return MapPin;
            default: return Type;
        }
    };

    const TypeIcon = getIcon(field.type);

    return (
        <GlassCard className="p-4 border-l-4 border-l-indigo-500 hover:border-indigo-400 transition-colors shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                
                {/* Drag Handle */}
                <div 
                    className="flex flex-col items-center justify-center gap-2 mt-2 text-slate-500 cursor-grab active:cursor-grabbing hover:text-indigo-400 transition-colors"
                    onPointerDown={(e) => dragControls.start(e)}
                    title="اسحب لإعادة الترتيب"
                >
                    <GripVertical size={24} />
                    <span className="text-[10px] font-mono font-bold bg-slate-800 px-1.5 rounded text-slate-400">
                        {index + 1}
                    </span>
                </div>

                {/* Icon */}
                <div className="mt-2 text-slate-400">
                     <TypeIcon size={20} />
                </div>

                {/* Main Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
                    
                    {/* Label */}
                    <div className="md:col-span-4">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">عنوان السؤال (بالعربية)</label>
                        <input 
                            value={field.labelAr}
                            onChange={(e) => onUpdate({ labelAr: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none transition-colors font-bold"
                        />
                    </div>

                    {/* Type */}
                    <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">نوع الإجابة</label>
                        <div className="relative">
                            <select 
                                value={field.type}
                                onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-slate-300 outline-none appearance-none cursor-pointer"
                            >
                                <option value="text">نص قصير</option>
                                <option value="textarea">نص طويل</option>
                                <option value="number">رقم</option>
                                <option value="select">قائمة خيارات</option>
                                <option value="image">صورة (كاميرا)</option>
                                <option value="gps">موقع جغرافي</option>
                            </select>
                        </div>
                    </div>

                    {/* Placeholder */}
                    <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">تلميح (Placeholder)</label>
                        <input 
                            value={field.placeholder || ''}
                            onChange={(e) => onUpdate({ placeholder: e.target.value })}
                            disabled={field.type === 'image' || field.type === 'gps'}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-slate-400 focus:text-white outline-none disabled:opacity-50"
                        />
                    </div>

                    {/* Toggles */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2 pt-5">
                        <button 
                            onClick={() => onUpdate({ required: !field.required })}
                            className={`p-2 rounded-lg transition-colors border ${field.required ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-800 text-slate-500 border-white/5'}`}
                            title="إلزامي؟"
                        >
                            <CheckCircle2 size={18} />
                        </button>
                        <button 
                            onClick={onDelete}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors"
                            title="حذف"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>

                    {/* Options for Select */}
                    {field.type === 'select' && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="md:col-span-12"
                        >
                            <label className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider mb-1 block">الخيارات (افصل بينها بفاصلة)</label>
                            <input 
                                value={field.options?.join(', ')}
                                onChange={(e) => onUpdate({ options: e.target.value.split(',').map(s => s.trim()) })}
                                className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-3 py-2 text-indigo-100 placeholder-indigo-300/30 outline-none"
                                placeholder="مثال: عطل كهربائي, عطل ميكانيكي, أخرى"
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}

// --- Main Page ---

export const SystemDesigner: React.FC = () => {
  const { config, addField, removeField, updateField, reorderFields } = useApp();
  const [activeTab, setActiveTab] = useState<'report' | 'repair'>('report');

  if (!config) return <div className="p-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div></div>;

  const currentSection = activeTab === 'report' ? 'reportQuestions' : 'repairFields';
  // We make a copy and sort by order to display, but Reorder.Group needs strict state control
  const displayFields = config[currentSection].sort((a,b) => a.order - b.order);

  const handleAddField = async () => {
    const newField: DynamicField = {
      id: `f_${Date.now()}`,
      labelAr: 'سؤال جديد',
      type: 'text',
      required: true,
      step: 1,
      order: displayFields.length + 1
    };
    await addField(currentSection, newField);
  };

  const handleReorder = (newOrder: DynamicField[]) => {
      // Reorder.Group returns the new array. We pass this directly to AppContext to save.
      reorderFields(currentSection, newOrder);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-4 border-b border-white/10">
            <div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-cyan-400 mb-2">
                    مصمم النظام
                </h2>
                <p className="text-slate-400">التحكم المركزي في هيكلية البلاغات ودورة العمل</p>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                <TabButton 
                    active={activeTab === 'report'} 
                    onClick={() => setActiveTab('report')} 
                    icon={Smartphone} 
                    label="تصميم بلاغ العطل" 
                />
                <TabButton 
                    active={activeTab === 'repair'} 
                    onClick={() => setActiveTab('repair')} 
                    icon={Wrench} 
                    label="تصميم إثبات الإصلاح" 
                />
            </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="space-y-4">
                        {/* Header for List */}
                        <div className="flex justify-between items-center px-4 mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                {activeTab === 'report' ? 'أسئلة مدير الفرع (The Wizard)' : 'حقول الفني (Proof of Repair)'}
                            </span>
                            <span className="text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded border border-white/5">
                                {displayFields.length} حقول نشطة
                            </span>
                        </div>

                        {/* Draggable List */}
                        <Reorder.Group 
                            axis="y" 
                            values={displayFields} 
                            onReorder={handleReorder}
                            className="space-y-4"
                        >
                            {displayFields.map((field, index) => (
                                <DraggableFieldItem 
                                    key={field.id}
                                    index={index}
                                    field={field}
                                    onUpdate={(updates: any) => updateField(currentSection, field.id, updates)}
                                    onDelete={() => {
                                        if(window.confirm('هل أنت متأكد من حذف هذا الحقل؟')) 
                                            removeField(currentSection, field.id);
                                    }}
                                />
                            ))}
                        </Reorder.Group>

                        {/* Empty State */}
                        {displayFields.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl">
                                <LayoutTemplate className="mx-auto text-slate-600 mb-4" size={48} />
                                <p className="text-slate-500">لا توجد حقول مضافة في هذا القسم</p>
                            </div>
                        )}

                        {/* Add Button */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleAddField}
                            className="w-full py-6 rounded-2xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 group mt-4"
                        >
                            <div className="p-2 bg-indigo-500 rounded-full text-white shadow-lg group-hover:scale-110 transition-transform">
                                <Plus size={20} />
                            </div>
                            <span className="font-bold">إضافة سؤال / حقل جديد</span>
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    </div>
  );
};
