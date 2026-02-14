
import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { SparePart } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { GlassInput } from '../../../components/ui/GlassInput';
import { Package, Plus, Search, AlertTriangle, Trash2, Edit, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InventoryManager: React.FC = () => {
    const [parts, setParts] = useState<SparePart[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<Partial<SparePart>>({});

    const loadParts = async () => {
        setIsLoading(true);
        const data = await api.getInventory();
        setParts(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadParts();
    }, []);

    const filteredParts = parts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSave = async () => {
        if (!editingPart.name || !editingPart.price) return;
        await api.saveSparePart(editingPart as SparePart);
        setIsModalOpen(false);
        loadParts();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
            await api.deleteSparePart(id);
            loadParts();
        }
    };

    const openModal = (part?: SparePart) => {
        setEditingPart(part || { name: '', sku: '', quantity: 0, price: 0, minLevel: 5, category: '' });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute top-3 right-3 text-slate-500" size={18} />
                    <input 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-white outline-none focus:border-indigo-500"
                        placeholder="بحث باسم القطعة أو الكود (SKU)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button onClick={() => openModal()} icon={Plus} className="w-full md:w-auto">
                    إضافة صنف جديد
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">إجمالي الأصناف</p>
                        <h3 className="text-2xl font-bold text-white">{parts.length}</h3>
                    </div>
                    <Package className="text-indigo-500" size={28} />
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">قيمة المخزون</p>
                        <h3 className="text-2xl font-bold text-emerald-400">
                            {parts.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString()} ج.م
                        </h3>
                    </div>
                    <span className="text-emerald-500 font-bold">$</span>
                </div>
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-red-300 text-xs font-bold uppercase">نواقص (Low Stock)</p>
                        <h3 className="text-2xl font-bold text-red-100">
                            {parts.filter(p => p.quantity <= p.minLevel).length}
                        </h3>
                    </div>
                    <AlertTriangle className="text-red-500" size={28} />
                </div>
            </div>

            <GlassCard className="flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                        <thead className="bg-slate-900/50 text-slate-400 font-bold">
                            <tr>
                                <th className="p-4">SKU</th>
                                <th className="p-4">اسم الصنف</th>
                                <th className="p-4">السعر</th>
                                <th className="p-4">الكمية</th>
                                <th className="p-4">حد الطلب</th>
                                <th className="p-4 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredParts.map(part => (
                                <tr key={part.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-slate-400">{part.sku}</td>
                                    <td className="p-4 font-bold text-white">{part.name}</td>
                                    <td className="p-4 text-emerald-400">{part.price} ج.م</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${part.quantity <= part.minLevel ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                                            {part.quantity}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500">{part.minLevel}</td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => openModal(part)} className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(part.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg"
                        >
                            <GlassCard>
                                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                    <h3 className="font-bold text-lg">{editingPart.id ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
                                    <button onClick={() => setIsModalOpen(false)}><X className="text-slate-400" /></button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassInput label="اسم القطعة" value={editingPart.name} onChange={v => setEditingPart({...editingPart, name: v})} />
                                        <GlassInput label="كود (SKU)" value={editingPart.sku} onChange={v => setEditingPart({...editingPart, sku: v})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <GlassInput label="السعر (ج.م)" type="number" value={editingPart.price} onChange={v => setEditingPart({...editingPart, price: parseFloat(v)})} />
                                        <GlassInput label="التصنيف" value={editingPart.category} onChange={v => setEditingPart({...editingPart, category: v})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                        <GlassInput label="الكمية الحالية" type="number" value={editingPart.quantity} onChange={v => setEditingPart({...editingPart, quantity: parseFloat(v)})} />
                                        <GlassInput label="حد إعادة الطلب (Min)" type="number" value={editingPart.minLevel} onChange={v => setEditingPart({...editingPart, minLevel: parseFloat(v)})} />
                                    </div>
                                    <Button onClick={handleSave} className="w-full mt-4" icon={Save}>حفظ البيانات</Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
