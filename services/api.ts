
import { Report, Branch, User, Role, ReportStatus, ReportPriority, SystemConfig } from '../types';

const STORAGE_KEYS = {
  REPORTS: 'ems_reports_v2',
  USERS: 'ems_users_v1',
  BRANCHES: 'ems_branches_v1',
  CONFIG: 'ems_config_v4', // Incremented for schema change
  INIT: 'ems_init_done_v7'
};

// --- Default Configuration (The "Seed") ---

const DEFAULT_CONFIG: SystemConfig = {
  features: {
    enableWhatsApp: true,
    requireEvidenceBefore: true,
    requireEvidenceAfter: true,
    autoAssign: false
  },
  // Fields for Branch Manager (Wizard)
  reportQuestions: [
    {
      id: 'machineType',
      labelAr: 'نوع الجهاز',
      type: 'select',
      required: true,
      options: ['ماكينة قهوة', 'تكييف مركزي', 'بوابة أمنية', 'نظام إضاءة', 'سير متحرك', 'أخرى'],
      step: 2,
      order: 1
    },
    {
      id: 'serialNumber',
      labelAr: 'الرقم التسلسلي (إن وجد)',
      type: 'text',
      required: false,
      placeholder: 'مثال: SN-123456',
      step: 2,
      order: 2
    },
    {
      id: 'description',
      labelAr: 'وصف المشكلة الدقيق',
      type: 'textarea',
      required: true,
      placeholder: 'اشرح العطل بالتفصيل...',
      step: 2,
      order: 3
    },
    {
      id: 'evidence',
      labelAr: 'صور العطل',
      type: 'image',
      required: true,
      step: 3,
      order: 4
    },
    {
      id: 'location',
      labelAr: 'الموقع الجغرافي',
      type: 'gps',
      required: true,
      step: 3,
      order: 5
    }
  ],
  // Fields for Technician (repairFields)
  repairFields: [
    {
      id: 'partsUsed',
      labelAr: 'قطع الغيار المستخدمة',
      type: 'textarea',
      required: true,
      placeholder: 'اذكر القطع التي تم استبدالها...',
      step: 1,
      order: 1
    },
    {
      id: 'cost',
      labelAr: 'التكلفة التقديرية (ج.م)',
      type: 'number',
      required: true,
      placeholder: '0.00',
      step: 1,
      order: 2
    },
    {
      id: 'afterPhoto',
      labelAr: 'صورة بعد الإصلاح',
      type: 'image',
      required: true,
      step: 1,
      order: 3
    }
  ]
};

// --- Mock Generators ---

const generateBranches = (): Branch[] => {
  const branches: Branch[] = [];
  const cities = ['القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة'];
  for (let i = 1; i <= 20; i++) {
    const city = cities[i % cities.length];
    branches.push({
      id: `br-${i}`,
      name: `فرع ${city} ${i}`,
      location: `${city}, مصر`
    });
  }
  return branches;
};

const generateUsers = (branches: Branch[]): User[] => {
  return [
    { id: 'admin-1', name: 'المدير العام', role: Role.ADMIN, avatar: 'https://picsum.photos/200' },
    { id: 'tech-1', name: 'محمد الفني (ميكانيكا)', role: Role.TECHNICIAN, avatar: 'https://picsum.photos/201' },
    { id: 'mgr-br-1', name: 'مدير فرع القاهرة', role: Role.BRANCH_MANAGER, branchId: 'br-1', avatar: 'https://picsum.photos/202' }
  ];
};

const initData = () => {
  if (localStorage.getItem(STORAGE_KEYS.INIT)) return;
  
  const branches = generateBranches();
  const users = generateUsers(branches);

  localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(branches));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
  localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INIT, 'true');
};

initData();

// --- API Service ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Configuration
  getSystemConfig: async (): Promise<SystemConfig> => {
    await delay(100);
    const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  },

  saveSystemConfig: async (config: SystemConfig): Promise<SystemConfig> => {
    await delay(300);
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.CONFIG }));
    return config;
  },

  // Users & Branches
  getUsers: async (): Promise<User[]> => {
    await delay(200);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  },

  getBranches: async (): Promise<Branch[]> => {
    await delay(200);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BRANCHES) || '[]');
  },

  // Reports
  getReports: async (): Promise<Report[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
  },

  saveReport: async (report: Report): Promise<Report> => {
    await delay(400);
    const reports = JSON.parse(localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]');
    const index = reports.findIndex((r: Report) => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.unshift(report);
    }
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    return report;
  },

  // Utility
  classifyPriority: (text: string): ReportPriority => {
    const criticalKeywords = ['حريق', 'دخان', 'كهرباء', 'توقف كامل', 'تسريب غاز', 'خطر', 'شرار', 'انفجار'];
    const highKeywords = ['تكييف', 'سيرفر', 'بوابة', 'تعطل', 'حرارة'];
    
    if (criticalKeywords.some(w => text.includes(w))) return ReportPriority.CRITICAL;
    if (highKeywords.some(w => text.includes(w))) return ReportPriority.HIGH;
    return ReportPriority.NORMAL;
  }
};
