
import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { api, BRANDS } from '../../../services/api';
import { User, Branch, Role } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { GlassInput } from '../../../components/ui/GlassInput';
import { Users, Building, Plus, Edit, Trash2, Key, Search, MapPin, UserCheck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Tab = 'USERS' | 'BRANCHES';

export const ManagementConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('USERS');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Load Data
  const refreshData = async () => {
    setIsLoading(true);
    const [u, b] = await Promise.all([api.getUsers(), api.getBranches()]);
    setUsers(u);
    setBranches(b);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-6 min-h-[600px] flex flex-col">
       {/* Header Tabs */}
       <div className="flex bg-slate-800/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md self-start">
            <button 
                onClick={() => setActiveTab('USERS')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold ${activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Users size={18} /> إدارة المستخدمين
            </button>
            <button 
                onClick={() => setActiveTab('BRANCHES')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold ${activeTab === 'BRANCHES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Building size={18} /> إدارة الفروع
            </button>
       </div>

       {/* Content Area */}
       <div className="flex-1">
           <AnimatePresence mode="wait">
               {activeTab === 'USERS' && (
                   <UserList 
                        key="user-list"
                        users={users} 
                        branches={branches}
                        onRefresh={refreshData}
                        onAdd={() => { setEditingItem(null); setIsUserModalOpen(true); }}
                        onEdit={(u) => { setEditingItem(u); setIsUserModalOpen(true); }}
                   />
               )}
               {activeTab === 'BRANCHES' && (
                   <BranchList 
                        key="branch-list"
                        branches={branches}
                        onRefresh={refreshData}
                        onAdd={() => { setEditingItem(null); setIsBranchModalOpen(true); }}
                        onEdit={(b) => { setEditingItem(b); setIsBranchModalOpen(true); }}
                   />
               )}
           </AnimatePresence>
       </div>

       {/* Modals */}
       {isUserModalOpen && (
           <UserModal 
                isOpen={isUserModalOpen} 
                onClose={() => setIsUserModalOpen(false)} 
                user={editingItem} 
                branches={branches}
                onSave={refreshData}
           />
       )}

       {isBranchModalOpen && (
           <BranchModal 
                isOpen={isBranchModalOpen} 
                onClose={() => setIsBranchModalOpen(false)} 
                branch={editingItem}
                onSave={refreshData}
           />
       )}
    </div>
  );
};

// --- Sub-Components ---

const UserList = ({ users, branches, onRefresh, onAdd, onEdit }: any) => {
    const { manageUser } = useApp();
    const [search, setSearch] = useState('');

    const filtered = users.filter((u: User) => 
        u.name.toLowerCase().includes(search.toLowerCase()) || 
        u.role.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if(window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            await manageUser('DELETE', { id });
            onRefresh();
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute top-3 right-3 text-slate-500" size={16} />
                    <input 
                        className="bg-slate-900 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-white outline-none focus:border-indigo-500 w-64"
                        placeholder="بحث عن مستخدم..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={onAdd} icon={Plus}>إضافة مستخدم</Button>
            </div>

            <GlassCard className="overflow-hidden">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-900/50 text-slate-400">
                        <tr>
                            <th className="p-4">الاسم</th>
                            <th className="p-4">اسم الدخول</th>
                            <th className="p-4">الدور</th>
                            <th className="p-4">الفرع (إن وجد)</th>
                            <th className="p-4 text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((u: User) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-bold flex items-center gap-3">
                                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-8 h-8 rounded-full" />
                                    {u.name}
                                </td>
                                <td className="p-4 font-mono text-slate-400">{u.username || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold 
                                        ${u.role === Role.ADMIN ? 'bg-red-500/20 text-red-400' : 
                                          u.role === Role.TECHNICIAN ? 'bg-emerald-500/20 text-emerald-400' : 
                                          'bg-blue-500/20 text-blue-400'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-400">
                                    {u.branchId ? branches.find((b: Branch) => b.id === u.branchId)?.name : '-'}
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button onClick={() => onEdit(u)} className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg" title="تعديل / تغيير كلمة المرور">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg" title="حذف">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </motion.div>
    );
};

const BranchList = ({ branches, onRefresh, onAdd, onEdit }: any) => {
    const { manageBranch } = useApp();
    const [search, setSearch] = useState('');

    const filtered = branches.filter((b: Branch) => 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        b.location.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if(window.confirm('سيؤدي هذا لحذف الفرع. هل أنت متأكد؟')) {
            await manageBranch('DELETE', { id });
            onRefresh();
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <Search className="absolute top-3 right-3 text-slate-500" size={16} />
                    <input 
                        className="bg-slate-900 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-white outline-none focus:border-indigo-500 w-64"
                        placeholder="بحث عن فرع..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={onAdd} icon={Plus}>إضافة فرع جديد</Button>
            </div>

            <GlassCard className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-transparent border-0 shadow-none !p-0">
                {filtered.map((b: Branch) => (
                    <div key={b.id} className="bg-slate-800/40 border border-white/10 rounded-xl p-4 hover:border-indigo-500/50 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <Building size={24} />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => onEdit(b)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white" title="تعديل بيانات الفرع"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400" title="حذف الفرع"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <h3 className="font-bold text-lg text-white mb-1">{b.name}</h3>
                        {b.brand && (
                            <span className="inline-block mb-2 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                                {b.brand}
                            </span>
                        )}
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                            <MapPin size={14} /> {b.location}
                        </p>
                    </div>
                ))}
            </GlassCard>
        </motion.div>
    );
};

// --- Modals ---

const UserModal = ({ isOpen, onClose, user, branches, onSave }: any) => {
    const { manageUser } = useApp();
    const [form, setForm] = useState<Partial<User>>({
        name: '', username: '', password: '', role: Role.TECHNICIAN, branchId: ''
    });

    useEffect(() => {
        if(user) setForm(user);
        else setForm({ name: '', username: '', password: '', role: Role.TECHNICIAN, branchId: '' });
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.name || !form.username) return;
        await manageUser('SAVE', form);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <GlassCard className="w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">{user ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <GlassInput label="الاسم الكامل" value={form.name} onChange={v => setForm({...form, name: v})} required />
                        <GlassInput label="اسم الدخول (Login ID)" value={form.username} onChange={v => setForm({...form, username: v})} required />
                        
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
                                <Key size={14} /> كلمة المرور {user && <span className="text-xs text-slate-500 font-normal">(اتركها فارغة للإبقاء على الحالية)</span>}
                            </label>
                            <input 
                                type="password"
                                value={form.password || ''}
                                onChange={(e) => setForm({...form, password: e.target.value})}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                placeholder={user ? "********" : "كلمة مرور جديدة"}
                            />
                        </div>

                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">الدور الوظيفي</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.values(Role).map(r => (
                                    <button
                                        type="button"
                                        key={r}
                                        onClick={() => setForm({...form, role: r})}
                                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${form.role === r ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {form.role === Role.BRANCH_MANAGER && (
                            <div>
                                <label className="block text-slate-300 text-sm font-medium mb-2">تعيين للفرع</label>
                                <select 
                                    value={form.branchId || ''}
                                    onChange={(e) => setForm({...form, branchId: e.target.value})}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none"
                                >
                                    <option value="">-- اختر الفرع --</option>
                                    {branches.map((b: Branch) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <Button variant="secondary" onClick={onClose} className="flex-1" type="button">إلغاء</Button>
                            <Button variant="primary" type="submit" className="flex-1">حفظ</Button>
                        </div>
                    </div>
                </form>
            </GlassCard>
        </div>
    );
};

const BranchModal = ({ isOpen, onClose, branch, onSave }: any) => {
    const { manageBranch } = useApp();
    const [form, setForm] = useState<Partial<Branch>>({ name: '', location: '', brand: '' });

    useEffect(() => {
        if(branch) setForm(branch);
        else setForm({ name: '', location: '', brand: BRANDS[0] });
    }, [branch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.name || !form.location) return;
        
        // This persists the changes using manageBranch from AppContext
        await manageBranch('SAVE', form);
        onSave();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <GlassCard className="w-full max-w-md">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-xl font-bold">{branch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <GlassInput 
                            label="اسم الفرع" 
                            value={form.name} 
                            onChange={v => setForm({...form, name: v})} 
                            required 
                            placeholder="مثال: فرع وسط البلد"
                        />
                        
                        <div>
                            <label className="block text-slate-300 text-sm font-medium mb-2">العلامة التجارية (Brand)</label>
                            <select 
                                value={form.brand || ''}
                                onChange={(e) => setForm({...form, brand: e.target.value})}
                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-indigo-500"
                            >
                                <option value="">-- اختر العلامة --</option>
                                {BRANDS.map(brand => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                        </div>

                        <GlassInput 
                            label="الموقع / المدينة" 
                            value={form.location} 
                            onChange={v => setForm({...form, location: v})} 
                            required 
                            placeholder="مثال: القاهرة"
                        />
                        
                        <div className="flex gap-3 mt-6">
                            <Button variant="secondary" onClick={onClose} className="flex-1" type="button">إلغاء</Button>
                            <Button variant="primary" type="submit" className="flex-1">حفظ</Button>
                        </div>
                    </div>
                </form>
             </GlassCard>
        </div>
    );
};
