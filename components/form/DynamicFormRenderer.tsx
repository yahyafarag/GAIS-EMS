
import React from 'react';
import { DynamicField } from '../../types';
import { GlassInput } from '../ui/GlassInput';
import { Camera, MapPin, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicFormRendererProps {
  fields: DynamicField[];
  formData: Record<string, any>;
  onChange: (id: string, value: any) => void;
  watermarkInfo?: { // New prop for watermark
    location: string;
    timestamp: string;
  };
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  formData,
  onChange,
  watermarkInfo
}) => {

  const handleAddPhoto = (fieldId: string) => {
    const mockPhoto = `https://picsum.photos/400/300?random=${Date.now()}`;
    const currentImages = formData[fieldId] || [];
    onChange(fieldId, [...currentImages, mockPhoto]);
  };

  const handleRemovePhoto = (fieldId: string, index: number) => {
      const currentImages = formData[fieldId] || [];
      const newImages = currentImages.filter((_: any, i: number) => i !== index);
      onChange(fieldId, newImages);
  }

  const handleGetLocation = (fieldId: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        // Save as strict object structure
        onChange(fieldId, { lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => {
          alert('تعذر تحديد الموقع. يرجى التأكد من تفعيل GPS.');
      });
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {fields.map((field) => (
          <motion.div
            key={field.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Render standard inputs using GlassInput */}
            {(field.type === 'text' || field.type === 'textarea' || field.type === 'select') && (
              <GlassInput
                type={field.type as any}
                label={field.labelAr}
                required={field.required}
                placeholder={field.placeholder}
                options={field.options}
                value={formData[field.id]}
                onChange={(val) => onChange(field.id, val)}
              />
            )}
            
            {/* Strict Number Handling */}
            {field.type === 'number' && (
              <GlassInput
                type="number"
                label={field.labelAr}
                required={field.required}
                placeholder={field.placeholder}
                value={formData[field.id]}
                onChange={(val) => onChange(field.id, val === '' ? '' : Number(val))}
              />
            )}

            {/* Custom UI for Image Upload */}
            {field.type === 'image' && (
              <div className="mb-4">
                <label className="block text-slate-300 text-sm font-medium mb-3">
                  {field.labelAr} {field.required && <span className="text-red-400">*</span>}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAddPhoto(field.id)}
                    className="h-40 rounded-xl border-2 border-dashed border-white/20 hover:border-indigo-500 hover:bg-indigo-500/10 flex flex-col items-center justify-center gap-2 transition-all group"
                  >
                    <div className="p-3 bg-slate-800 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <Camera className="text-slate-400 group-hover:text-white" />
                    </div>
                    <span className="text-sm text-slate-400 font-bold">التقاط صورة حية</span>
                    {watermarkInfo && <span className="text-[10px] text-slate-500">سيتم إضافة الختم تلقائياً</span>}
                  </button>
                  
                  <AnimatePresence>
                    {(formData[field.id] || []).map((img: string, i: number) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="h-40 rounded-xl overflow-hidden relative group border border-white/10"
                        >
                        <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                        
                        {/* Watermark Overlay */}
                        {watermarkInfo && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px] p-2 flex flex-col items-start z-10 pointer-events-none">
                                <span className="text-[10px] text-yellow-400 font-mono flex items-center gap-1">
                                    <MapPin size={8} /> {watermarkInfo.location}
                                </span>
                                <span className="text-[10px] text-white font-mono">
                                    {watermarkInfo.timestamp}
                                </span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                            <button 
                                onClick={() => handleRemovePhoto(field.id, i)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition-colors border border-red-500/30"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Custom UI for GPS */}
            {field.type === 'gps' && (
              <div className="mb-4 p-4 rounded-xl bg-slate-900/50 border border-white/10 flex items-center justify-between backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${formData[field.id] ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]' : 'bg-slate-700 text-slate-400'}`}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <label className="font-medium block text-slate-200">{field.labelAr}</label>
                    <p className="text-xs text-slate-500">
                      {formData[field.id] ? 
                          `تم التحديد: ${Number(formData[field.id].lat).toFixed(5)}, ${Number(formData[field.id].lng).toFixed(5)}` 
                          : 'مطلوب لتوجيه الفني للموقع الدقيق'}
                    </p>
                  </div>
                </div>
                {!formData[field.id] && (
                  <button
                    onClick={() => handleGetLocation(field.id)}
                    className="px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white text-sm transition-all"
                  >
                    تحديد الآن
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
