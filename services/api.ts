
import { supabase } from '../lib/supabase';
import { Report, Branch, User, ReportStatus, SystemConfig, SparePart, ReportPriority, Role } from '../types';

// --- Static Data for Brands ---
export const BRANDS = [
  "بلبن",
  "وهمى برجر",
  "عم شلتت",
  "بهيج",
  "كنافة وبسبوسة",
  "مصرى اصلى",
  "بلالم",
  "اكس حلال"
];

// --- Static Data for Branches (Updated with Brands) ---
const MOCK_BRANCHES: Branch[] = [
  // --- B.Laban (Default Brand) ---
  { id: 'br-mns-1', name: 'المنصورة المشايه- ب لبن', location: 'المنصوره شارع المشايه السفليه امام بوابه نادي جزيره الورد', lat: 31.0409, lng: 31.3785, brand: 'بلبن' },
  { id: 'br-cai-3', name: 'طلعت حرب - ب لبن', location: '٤٠ ش طلعت حرب القاهره', lat: 30.0480, lng: 31.2390, brand: 'بلبن' },
  { id: 'br-alx-1', name: 'سموحة - ب لبن', location: '22 أبراج القطن ش مسجد حاتم ميدان فيكتور عمانويل سموحة', lat: 31.2156, lng: 29.9431, brand: 'بلبن' },
  
  // --- Wahamy Burger (New) ---
  { id: 'br-whm-1', name: 'وهمي برجر - التجمع', location: 'التجمع الخامس - مول سبوت', lat: 30.0250, lng: 31.4500, brand: 'وهمى برجر' },
  { id: 'br-whm-2', name: 'وهمي برجر - زايد', location: 'الشيخ زايد - امريكان بلازا', lat: 30.0400, lng: 30.9700, brand: 'وهمى برجر' },

  // --- Amo Shaltout (New) ---
  { id: 'br-slt-1', name: 'عم شلتت - المعادي', location: 'المعادي شارع 9', lat: 29.9600, lng: 31.2500, brand: 'عم شلتت' },

  // --- Bahig (New) ---
  { id: 'br-bhg-1', name: 'بهيج - الإسكندرية', location: 'محطة الرمل', lat: 31.2000, lng: 29.9000, brand: 'بهيج' },

  // --- Kunafa & Basbousa (New) ---
  { id: 'br-knf-1', name: 'كنافة وبسبوسة - وسط البلد', location: 'شارع فؤاد', lat: 30.0500, lng: 31.2400, brand: 'كنافة وبسبوسة' },

  // --- Masry Asli (New) ---
  { id: 'br-msr-1', name: 'مصري أصلي - الدقي', location: 'ميدان المساحة', lat: 30.0380, lng: 31.2100, brand: 'مصرى اصلى' },

  // --- Blalem (New) ---
  { id: 'br-blm-1', name: 'بلالم - مدينة نصر', location: 'عباس العقاد', lat: 30.0600, lng: 31.3300, brand: 'بلالم' },

  // --- X Halal (New) ---
  { id: 'br-xhl-1', name: 'اكس حلال - أكتوبر', location: 'ميدان الحصري', lat: 29.9700, lng: 30.9400, brand: 'اكس حلال' },

  // ... (Adding existing branches with default brand)
  { id: 'br-mns-2', name: 'المنصورة الجزيرة - ب لبن', location: 'المشايه السفليه', lat: 31.0420, lng: 31.3790, brand: 'بلبن' },
  { id: 'br-tnt-1', name: 'طنطا الاستاذ - ب لبن', location: 'طنطا شارع الاستاد', lat: 30.7950, lng: 30.9990, brand: 'بلبن' },
  { id: 'br-lxr-1', name: 'الاقصر - ب لبن', location: 'شارع المحطة', lat: 25.6960, lng: 32.6420, brand: 'بلبن' },
  { id: 'br-mat-1', name: 'مطروح - ب لبن', location: 'شارع اسكندرية', lat: 31.3520, lng: 27.2350, brand: 'بلبن' },
  { id: 'br-cai-32', name: 'مدينه نصر - ب لبن', location: '6 شارع مهدي عرفه', lat: 30.0450, lng: 31.3650, brand: 'بلبن' },
  { id: 'br-ras-1', name: 'راس البر - ب لبن', location: 'شارع النيل', lat: 31.5126, lng: 31.8394, brand: 'بلبن' },
  { id: 'br-ism-1', name: 'الاسماعيلية - ب لبن', location: 'شارع السلطان حسين', lat: 30.5900, lng: 32.2680, brand: 'بلبن' },
  { id: 'br-zag-1', name: 'الزقازيق - ب لبن', location: 'ميدان القوميه', lat: 30.5877, lng: 31.5020, brand: 'بلبن' },
  { id: 'br-giz-3', name: 'الشيخ زايد - ب لبن', location: 'الشيخ زايد', lat: 30.0450, lng: 30.9700, brand: 'بلبن' },
  { id: 'br-ast-1', name: 'اسيوط - ب لبن', location: 'امام ماكدونالدز', lat: 27.1820, lng: 31.1850, brand: 'بلبن' },
  { id: 'br-cai-22', name: 'شيراتون - ب لبن', location: 'شارع البحر', lat: 30.1000, lng: 31.3800, brand: 'بلبن' },
  { id: 'br-alx-11', name: 'حلقة السمك - ب لبن', location: 'الانفوشي', lat: 31.2050, lng: 29.8820, brand: 'بلبن' },
];

// --- DEMO DATA CONSTANTS (Fallback) ---

// Real Technician Data from Spreadsheet
const DEMO_USERS: User[] = [
    // --- Admins ---
    { id: 'adm-1', name: 'م. أحمد المدير', username: 'admin', role: Role.ADMIN, avatar: 'https://ui-avatars.com/api/?name=Admin&background=random' },
    { id: 'br-mgr-1', name: 'مدير فرع عام', username: 'branch', role: Role.BRANCH_MANAGER, branchId: 'br-mns-1', avatar: 'https://ui-avatars.com/api/?name=Manager&background=random' },

    // --- Support / Delta ---
    { id: 'tech-6089', name: 'عاطف محمد احمد محمد (مشرف صيانة)', username: '6089', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Atef+Mohamed&background=random', phone: '' },
    { id: 'tech-6200', name: 'جابر محمد على حسين (حداد)', username: '6200', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Gaber+Mohamed&background=random' },
    { id: 'tech-54799', name: 'اسامه فوزي عبدالعزيز (فني حداد)', username: '54799', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Osama+Fawzy&background=random' },
    { id: 'tech-6084', name: 'محمود حمدى سعيد (رئيس قسم تبريد)', username: '6084', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mahmoud+Hamdy&background=random' },
    { id: 'tech-5953', name: 'احمد صبحى السيد (فني تبريد)', username: '5953', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Sobhy&background=random' },
    { id: 'tech-9069', name: 'احمد احمد علي (فني كهرباء)', username: '9069', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Ali&background=random' },

    // --- Cairo ---
    { id: 'tech-55270', name: 'سيد محمد جبريل (مشرف تبريد)', username: '55270', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Sayed+Mohamed&background=random' },
    { id: 'tech-54712', name: 'مصطفى محمد رجب (مشرف تبريد)', username: '54712', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mostafa+Ragab&background=random' },
    { id: 'tech-55541', name: 'امير ايمن بشندي (فني تبريد)', username: '55541', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Amir+Ayman&background=random' },
    { id: 'tech-53735', name: 'احمد رجب عواد (فني تبريد)', username: '53735', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Ragab&background=random' },
    { id: 'tech-61037', name: 'احمد بدر عبدالجابر (فني تبريد)', username: '61037', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Badr&background=random' },
    { id: 'tech-58101', name: 'احمد حسنى على (فني حداد)', username: '58101', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Hosny&background=random' },
    { id: 'tech-51709', name: 'تامر اسامة حلمي (فني كلادينك)', username: '51709', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Tamer+Osama&background=random' },
    { id: 'tech-59733', name: 'شريف فتحي جمعه (مشرف سباكه)', username: '59733', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Sherif+Fathy&background=random' },
    { id: 'tech-57177', name: 'احمد راتب عبدالحى (فني سباكة)', username: '57177', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Rateb&background=random' },
    { id: 'tech-59948', name: 'احمد محمد علي (فني سباكة)', username: '59948', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Mohamed&background=random' },
    { id: 'tech-58404', name: 'محمد ابراهيم عبدالعزيز (مشرف كهرباء)', username: '58404', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mohamed+Ibrahim&background=random' },
    { id: 'tech-59727', name: 'محمد حمدي محمد (فني كهرباء)', username: '59727', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mohamed+Hamdy&background=random' },
    { id: 'tech-60419', name: 'يوسف سمير يوسف (فني كهرباء)', username: '60419', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Youssef+Samir&background=random' },
    { id: 'tech-63853', name: 'احمد عبدالعزيز حسين (فني كهرباء)', username: '63853', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Abdelaziz&background=random' },
    { id: 'tech-6801', name: 'ايمن عادل محمود (فني كهرباء)', username: '6801', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ayman+Adel&background=random' },
    { id: 'tech-60606', name: 'علي محمد احمد (فني كهرباء)', username: '60606', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ali+Mohamed&background=random' },
    { id: 'tech-58087', name: 'مصطفى محمد احمد (فني صيانة)', username: '58087', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mostafa+Mohamed&background=random' },
    { id: 'tech-56972', name: 'ابراهيم ربيع ابراهيم (كهرباء وأبواب)', username: '56972', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ibrahim+Rabie&background=random' },
    { id: 'tech-60046', name: 'محمد علي محمد (مساعد فني)', username: '60046', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mohamed+Ali&background=random' },
    { id: 'tech-56478', name: 'عمرو عيد احمد (مساعد فني)', username: '56478', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Amr+Eid&background=random' },

    // --- Alexandria ---
    { id: 'tech-3368', name: 'احمد سعيد رفاعى (فني صيانة)', username: '3368', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Saeed&background=random' },
    { id: 'tech-11029', name: 'محمد احمد الرشيدي (فني غاز)', username: '11029', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mohamed+Rashidi&background=random' },
    { id: 'tech-11197', name: 'ابو بكر سعيد (سباك)', username: '11197', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Abu+Bakr&background=random' },
    { id: 'tech-4046', name: 'بهاء عبدالرؤف محمد (ميكانيكا)', username: '4046', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Bahaa+Abdelraouf&background=random' },
    { id: 'tech-11751', name: 'محمد محمد على (مدير المكتب الفني)', username: '11751', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mohamed+Mohamed&background=random' },
    { id: 'tech-5843', name: 'عماد محمود سيد (مدير صيانة الفروع)', username: '5843', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Emad+Mahmoud&background=random' },
    { id: 'tech-294', name: 'مصطفى احمد الرشيدى (فني غاز)', username: '294', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mostafa+Rashidi&background=random' },
    { id: 'tech-7276', name: 'يسرى محمد احمد (فني كهرباء)', username: '7276', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Yousry+Mohamed&background=random' },
    { id: 'tech-10839', name: 'رامي مجدي محى الدين (فني كهرباء)', username: '10839', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ramy+Magdy&background=random' },
    { id: 'tech-8572', name: 'محمد نصر سليمان (فني كهرباء)', username: '8572', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mohamed+Nasr&background=random' },
    { id: 'tech-9245', name: 'مصطفي ابراهيم فرج (مشرف تبريد)', username: '9245', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Mostafa+Ibrahim&background=random' },
    { id: 'tech-6709', name: 'اسلام جابر محمد (فني تبريد)', username: '6709', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Islam+Gaber&background=random' },
    { id: 'tech-5895', name: 'وجدى محمد بسطاوى (فني تبريد)', username: '5895', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Wagdy+Mohamed&background=random' },
    { id: 'tech-4206', name: 'حسني ناجي سعد (فني معدات)', username: '4206', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Hosny+Nagy&background=random' },
    { id: 'tech-11187', name: 'احمد عاطف محمد (حداد)', username: '11187', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Ahmed+Atef&background=random' },
    { id: 'tech-3743', name: 'صبحى منصور عبد الرحيم (سباك)', username: '3743', role: Role.TECHNICIAN, avatar: 'https://ui-avatars.com/api/?name=Sobhy+Mansour&background=random' },
];

const DEMO_PARTS: SparePart[] = [
    // --- HVAC / Cooling (تبريد) ---
    { id: 'p-cool-01', name: 'تكيف كوسلد 5 حصان', sku: 'AC-KOS-5HP', price: 42000, quantity: 2, minLevel: 1, category: 'تبريد' },
    { id: 'p-cool-02', name: 'تكيف سبليت 2.25 حصان كاريير', sku: 'AC-CAR-2.25', price: 28500, quantity: 3, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-03', name: 'اسطوانة فريون 290', sku: 'GAS-290', price: 3500, quantity: 2, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-04', name: 'اسطوانة فريون 410', sku: 'GAS-410', price: 4200, quantity: 5, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-05', name: 'اسطوانة فريون 404', sku: 'GAS-404', price: 4500, quantity: 3, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-06', name: 'اسطوانة فريون 22', sku: 'GAS-22', price: 3800, quantity: 1, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-07', name: '34R كباس 0.5 حصان سكوب', sku: 'COMP-SCOP-0.5', price: 4500, quantity: 4, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-08', name: 'كباس 1/2 حصان', sku: 'COMP-GEN-0.5', price: 3800, quantity: 2, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-09', name: 'كباس ٣/١ حصان', sku: 'COMP-GEN-0.33', price: 3200, quantity: 6, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-10', name: 'مجموعة كباس (كباستر + ريلاي)', sku: 'COMP-KIT', price: 450, quantity: 29, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-11', name: 'فان كويل 34*34 هندي', sku: 'FAN-COIL-IND', price: 1800, quantity: 1, minLevel: 1, category: 'تبريد' },
    { id: 'p-cool-12', name: 'كويل 2 مروحة', sku: 'COIL-2FAN', price: 2200, quantity: 2, minLevel: 1, category: 'تبريد' },
    { id: 'p-cool-13', name: 'مروحة كويل بوكس 12*12 صيني', sku: 'FAN-BOX-12-CN', price: 850, quantity: 59, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-14', name: 'مروحة كويل بوكس 12*12 هندي', sku: 'FAN-BOX-12-IND', price: 1100, quantity: 8, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-15', name: 'مروحة كويل بوكس 17*17 صيني', sku: 'FAN-BOX-17-CN', price: 1200, quantity: 58, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-16', name: 'ترموستات 902', sku: 'THERM-902', price: 650, quantity: 15, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-17', name: 'ترموستات 974', sku: 'THERM-974', price: 750, quantity: 8, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-18', name: 'ترموستات هوائي 300.50 تسفين', sku: 'THERM-AIR', price: 450, quantity: 42, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-19', name: 'ترموستات 110/30', sku: 'THERM-110', price: 350, quantity: 50, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-20', name: 'ترموستات 901', sku: 'THERM-901', price: 600, quantity: 15, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-21', name: 'هيتر درين', sku: 'HEAT-DRAIN', price: 250, quantity: 4, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-22', name: 'عداد حرارة صغير', sku: 'TEMP-METER-S', price: 150, quantity: 36, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-23', name: 'عداد تبريد اتونيكس', sku: 'TEMP-METER-AUTO', price: 1200, quantity: 10, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-24', name: 'هاي بريشر دانفوس كنترول', sku: 'HI-PRESS-DAN', price: 1400, quantity: 8, minLevel: 3, category: 'تبريد' },
    { id: 'p-cool-25', name: 'بلف شحن', sku: 'CHG-VALVE', price: 45, quantity: 33, minLevel: 10, category: 'تبريد' },
    { id: 'p-cool-26', name: 'زيت تبريد مكن', sku: 'OIL-REF', price: 200, quantity: 10, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-27', name: 'فلتر 1/4 × كابلوي', sku: 'FILT-CAP', price: 85, quantity: 20, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-28', name: 'فلتر دانفوس 3/8 لحام', sku: 'FILT-DAN-3/8', price: 350, quantity: 4, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-29', name: 'فلتر دانفوس 1/4 لحام', sku: 'FILT-DAN-1/4', price: 300, quantity: 13, minLevel: 5, category: 'تبريد' },
    { id: 'p-cool-30', name: 'سلونيد فالف دانفوس', sku: 'SOL-VALVE-DAN', price: 1800, quantity: 7, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-31', name: 'مواسير نحاس 1/4', sku: 'PIPE-COP-1/4', price: 1200, quantity: 4, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-32', name: 'مواسير نحاس 3/8', sku: 'PIPE-COP-3/8', price: 1800, quantity: 3, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-33', name: 'مواسير نحاس 5/8', sku: 'PIPE-COP-5/8', price: 2400, quantity: 3, minLevel: 2, category: 'تبريد' },
    { id: 'p-cool-34', name: 'عزل ابيض', sku: 'INSUL-WHT', price: 50, quantity: 7.5, minLevel: 5, category: 'تبريد' },

    // --- Electrical / Lighting (كهرباء) ---
    { id: 'p-elec-01', name: 'كشاف 100 وات ليد', sku: 'LED-FLOOD-100', price: 850, quantity: 18, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-02', name: 'كشاف 200 وات ليد', sku: 'LED-FLOOD-200', price: 1400, quantity: 21, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-03', name: 'كشاف 36 وات خارجى', sku: 'LED-OUT-36', price: 350, quantity: 32, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-04', name: 'كشاف 36 وات داخلي', sku: 'LED-IN-36', price: 300, quantity: 37, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-05', name: 'كشاف داخلي 40 وات', sku: 'LED-IN-40', price: 320, quantity: 181, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-06', name: 'كشاف ليد داخل 10 وات بلفونيره ابيض', sku: 'LED-IN-10', price: 120, quantity: 108, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-07', name: 'كشاف مسطره 30 وات', sku: 'LED-BAR-30', price: 150, quantity: 10, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-08', name: 'كشاف 60 * 60 بلاطة السويدي', sku: 'LED-PANEL-60', price: 950, quantity: 2, minLevel: 2, category: 'كهرباء' },
    { id: 'p-elec-09', name: 'لمبة 120 سم ليد', sku: 'LAMP-120', price: 85, quantity: 160, minLevel: 30, category: 'كهرباء' },
    { id: 'p-elec-10', name: 'لمبه سويدى 40 وات', sku: 'LAMP-40W', price: 65, quantity: 42, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-11', name: 'لمبة بيان اصفر معدن', sku: 'IND-LAMP-YEL', price: 45, quantity: 18, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-12', name: 'سبوت 30 وات', sku: 'SPOT-30W', price: 180, quantity: 96, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-13', name: 'مفتاح احادي 20 امبير', sku: 'MCB-1P-20A', price: 85, quantity: 12, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-14', name: 'مفتاح احادي 32 امبير', sku: 'MCB-1P-32A', price: 95, quantity: 24, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-15', name: 'مفتاح احادي 63 امبير', sku: 'MCB-1P-63A', price: 120, quantity: 10, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-16', name: 'مفتاح ثلاثي 63امبير', sku: 'MCB-3P-63A', price: 450, quantity: 15, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-17', name: 'مفتاح 32 امبير ثلاثى', sku: 'MCB-3P-32A', price: 350, quantity: 8, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-18', name: 'مفتاح 100A احادي شنايدر', sku: 'MCCB-SCH-100', price: 850, quantity: 8, minLevel: 2, category: 'كهرباء' },
    { id: 'p-elec-19', name: 'مفتاح 40A احادي شنايدر', sku: 'MCCB-SCH-40', price: 650, quantity: 18, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-20', name: 'مفتاح 100 امبير 36 ك وات', sku: 'MCCB-100-36K', price: 1200, quantity: 3, minLevel: 1, category: 'كهرباء' },
    { id: 'p-elec-21', name: 'كونتاكتور 25', sku: 'CONT-25A', price: 550, quantity: 9, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-22', name: 'كونتاكتور 18', sku: 'CONT-18A', price: 450, quantity: 12, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-23', name: 'اوفر لود', sku: 'OVERLOAD', price: 350, quantity: 40, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-24', name: 'تايمر 2 زمن', sku: 'TIMER-2T', price: 250, quantity: 11, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-25', name: 'تايمر ديلاي', sku: 'TIMER-DELAY', price: 180, quantity: 26, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-26', name: 'تايمر 8 رجل بالقاعده', sku: 'TIMER-8PIN', price: 300, quantity: 13, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-27', name: 'تايمر شيندر 24 ساعه', sku: 'TIMER-SCH-24', price: 650, quantity: 8, minLevel: 2, category: 'كهرباء' },
    { id: 'p-elec-28', name: 'مكثف 1.5 مايكروفارات', sku: 'CAP-1.5UF', price: 35, quantity: 20, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-29', name: 'مكثف 300 ميكروفراد', sku: 'CAP-300UF', price: 120, quantity: 10, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-30', name: 'سلك ترمو 4 ملى * 4 طرف', sku: 'WIRE-THERM-4X4', price: 85, quantity: 791, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-31', name: 'سلك ترمو 6 ملى * 4 طرف', sku: 'WIRE-THERM-6X4', price: 120, quantity: 179, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-32', name: 'سلك شعر 4 م', sku: 'WIRE-FLEX-4', price: 25, quantity: 400, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-33', name: 'سلك شعر 6 م', sku: 'WIRE-FLEX-6', price: 35, quantity: 484, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-34', name: 'سلك شعر 3 م', sku: 'WIRE-FLEX-3', price: 18, quantity: 600, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-35', name: 'سلك شعر 2 م', sku: 'WIRE-FLEX-2', price: 12, quantity: 400, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-36', name: 'سلك شعر 1 مم', sku: 'WIRE-FLEX-1', price: 8, quantity: 131, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-37', name: 'سلك ترمو 7*1', sku: 'WIRE-THERM-7X1', price: 45, quantity: 130, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-38', name: 'سلك ترمو 2*4', sku: 'WIRE-THERM-2X4', price: 30, quantity: 391, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-39', name: 'سلك ترمو 2*2', sku: 'WIRE-THERM-2X2', price: 15, quantity: 347.5, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-40', name: 'سلك 2*3', sku: 'WIRE-2X3', price: 20, quantity: 287, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-41', name: 'سلك 3*3', sku: 'WIRE-3X3', price: 28, quantity: 413, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-42', name: 'سلك حرارى 6 م', sku: 'WIRE-HEAT-6', price: 40, quantity: 1, minLevel: 1, category: 'كهرباء' },
    { id: 'p-elec-43', name: 'سلك حراري 4 م', sku: 'WIRE-HEAT-4', price: 30, quantity: 0.5, minLevel: 1, category: 'كهرباء' },
    { id: 'p-elec-44', name: 'سلك 35*1 مم السويدي', sku: 'WIRE-SWD-35', price: 150, quantity: 50, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-45', name: 'سلك 4*25 م شعر نحاس السويدي', sku: 'WIRE-SWD-4X25', price: 350, quantity: 55, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-46', name: 'سلك 1*25 م شعر نحاس السويدي', sku: 'WIRE-SWD-1X25', price: 120, quantity: 55, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-47', name: 'لفة سلك 2*3 السويدي ترمو', sku: 'ROLL-SWD-2X3', price: 2500, quantity: 100, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-48', name: 'لفة سلك 2*1 ترمو السويدي', sku: 'ROLL-SWD-2X1', price: 1200, quantity: 100, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-49', name: 'فيشه دكر', sku: 'PLUG-MALE', price: 15, quantity: 15, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-50', name: 'فيشه نتايه', sku: 'PLUG-FEMALE', price: 15, quantity: 37, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-51', name: 'بريزة فينوس', sku: 'SOCK-VENUS', price: 35, quantity: 43, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-52', name: 'شاسيه فينوس', sku: 'CHAS-VENUS', price: 15, quantity: 31, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-53', name: 'وش فينوس', sku: 'FACE-VENUS', price: 20, quantity: 73, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-54', name: 'سدادات فينوس', sku: 'BLNK-VENUS', price: 5, quantity: 25, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-55', name: 'بريزه مجوفه فينوس', sku: 'SOCK-DEEP-VEN', price: 40, quantity: 46, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-56', name: 'مفتاح جيوس', sku: 'SW-GEO', price: 25, quantity: 122, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-57', name: 'وش جيوش', sku: 'FACE-GEO', price: 20, quantity: 157, minLevel: 30, category: 'كهرباء' },
    { id: 'p-elec-58', name: 'بريزه مجوفه جيوس', sku: 'SOCK-DEEP-GEO', price: 35, quantity: 19, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-59', name: 'بريزه عاديه جيوش', sku: 'SOCK-GEO', price: 30, quantity: 31, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-60', name: 'سداده جيوس', sku: 'BLNK-GEO', price: 5, quantity: 388, minLevel: 50, category: 'كهرباء' },
    { id: 'p-elec-61', name: 'شاسيه سانشى', sku: 'CHAS-SANCH', price: 18, quantity: 31, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-62', name: 'وش سانشي', sku: 'FACE-SANCH', price: 22, quantity: 8, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-63', name: 'بريزه سانشى', sku: 'SOCK-SANCH', price: 38, quantity: 59, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-64', name: 'بريزه مجوفه سانشى', sku: 'SOCK-DEEP-SANCH', price: 42, quantity: 22, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-65', name: 'سداده سانشى', sku: 'BLNK-SANCH', price: 6, quantity: 31, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-66', name: 'لقمه نت سانشى', sku: 'NET-SANCH', price: 65, quantity: 25, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-67', name: 'مفتاح off/on ايطالى', sku: 'SW-ONOFF-IT', price: 45, quantity: 71, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-68', name: 'علبة خارج ماجيك', sku: 'BOX-MAGIC', price: 12, quantity: 115, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-69', name: 'بواط 10*10 ووتر بروف', sku: 'BOX-WP-10', price: 55, quantity: 140, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-70', name: 'بلجة 32 امبير 5 بولة نتاية', sku: 'PLUG-32A-5P', price: 180, quantity: 107, minLevel: 20, category: 'كهرباء' },
    { id: 'p-elec-71', name: '(طقم كامل دكر + نتايه ) بلجه 4 بوله 32 امبير تركى', sku: 'PLUG-SET-32A', price: 350, quantity: 51, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-72', name: 'بازر 22ملي 220 فولت', sku: 'BUZZER-220', price: 60, quantity: 6, minLevel: 2, category: 'كهرباء' },
    { id: 'p-elec-73', name: 'ريكم 8 مل', sku: 'SHRINK-8', price: 5, quantity: 50, minLevel: 10, category: 'كهرباء' },
    { id: 'p-elec-74', name: 'ريكم 10 مل', sku: 'SHRINK-10', price: 7, quantity: 10, minLevel: 5, category: 'كهرباء' },
    { id: 'p-elec-75', name: 'ترملة شوكة', sku: 'TERM-FORK', price: 1, quantity: 500, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-76', name: 'ترامل حلقه', sku: 'TERM-RING', price: 1, quantity: 422, minLevel: 100, category: 'كهرباء' },
    { id: 'p-elec-77', name: 'ترامل كلبس', sku: 'TERM-CLIP', price: 1, quantity: 853, minLevel: 200, category: 'كهرباء' },

    // --- Plumbing (سباكة) ---
    { id: 'p-plumb-01', name: 'كوع 20 ملى بيت هندسه', sku: 'ELBOW-20', price: 15, quantity: 127, minLevel: 30, category: 'سباكة' },
    { id: 'p-plumb-02', name: 'جلبه 20 ملى بيت هندسه', sku: 'COUP-20', price: 12, quantity: 603, minLevel: 100, category: 'سباكة' },
    { id: 'p-plumb-03', name: 'كوع 25 ملى بيت هندسه', sku: 'ELBOW-25', price: 18, quantity: 138, minLevel: 30, category: 'سباكة' },
    { id: 'p-plumb-04', name: 'جلبه 25 ملى بيت هندسه', sku: 'COUP-25', price: 15, quantity: 16, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-05', name: 'كوع كيسل مفتوح 50 مل', sku: 'ELBOW-KES-50', price: 25, quantity: 19, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-06', name: 'كوع كيسل عاده 50 مل', sku: 'ELBOW-NORM-50', price: 20, quantity: 16, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-07', name: 'جلبه كيسل 50 مل', sku: 'COUP-KES-50', price: 18, quantity: 11, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-08', name: 'جلبه 1.5 بوصه سن داخلي', sku: 'COUP-1.5-IN', price: 45, quantity: 3, minLevel: 2, category: 'سباكة' },
    { id: 'p-plumb-09', name: 'T-نحاس', sku: 'TEE-COPPER', price: 85, quantity: 20, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-10', name: 'حنفية نصف بوصة نحاس', sku: 'TAP-0.5-COP', price: 120, quantity: 27, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-11', name: 'خلاط شجرة', sku: 'MIXER-TREE', price: 650, quantity: 19, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-12', name: 'محبس فلاش', sku: 'VALVE-FLUSH', price: 150, quantity: 14, minLevel: 5, category: 'سباكة' },
    { id: 'p-plumb-13', name: 'خرطوم فليكسبل 20 ملى', sku: 'HOSE-FLEX-20', price: 35, quantity: 3, minLevel: 2, category: 'سباكة' },

    // --- Tools & Mechanical (عدد وميكانيكا) ---
    { id: 'p-tool-01', name: 'صاروخ اصفر 5 بوصة', sku: 'GRIND-YEL-5', price: 1800, quantity: 1, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-02', name: 'صاروخ كرون 5 بوصة', sku: 'GRIND-CRN-5', price: 2200, quantity: 4, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-03', name: 'صاروخ كرون 7 بوصة', sku: 'GRIND-CRN-7', price: 2800, quantity: 5, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-04', name: 'صاروخ بوصه بوش 900 وات', sku: 'GRIND-BOSCH-900', price: 3200, quantity: 3, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-05', name: 'شنيور بوش 13 م', sku: 'DRILL-BOSCH-13', price: 2500, quantity: 7, minLevel: 2, category: 'عدد' },
    { id: 'p-tool-06', name: 'هيلتى بوش 720 وات', sku: 'HILTI-BOSCH-720', price: 4500, quantity: 11, minLevel: 2, category: 'عدد' },
    { id: 'p-tool-07', name: 'ماكينه لحام بولى 2 بوصه تركى', sku: 'WELD-POLY-2', price: 1500, quantity: 4, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-08', name: 'ماكينة برشام كبيره', sku: 'RIVET-BIG', price: 450, quantity: 1, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-09', name: 'مقص صاج', sku: 'SHEAR-MTL', price: 180, quantity: 1, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-10', name: 'مكبس كابلات 300 م', sku: 'CABLE-PRESS', price: 1200, quantity: 2, minLevel: 1, category: 'عدد' },
    { id: 'p-tool-11', name: 'اسطوانه قطعيه بسكوته 9 بوصه', sku: 'DISC-CUT-9', price: 45, quantity: 7, minLevel: 5, category: 'عدد' },
    { id: 'p-tool-12', name: 'اسطوانه بسكوته 5 بوصه', sku: 'DISC-CUT-5', price: 30, quantity: 259, minLevel: 50, category: 'عدد' },
    { id: 'p-tool-13', name: 'اسطوانه غاز لحام سريع', sku: 'GAS-TORCH', price: 65, quantity: 24, minLevel: 10, category: 'عدد' },
    { id: 'p-tool-14', name: 'بشبورى', sku: 'BLOWTORCH', price: 250, quantity: 2, minLevel: 1, category: 'عدد' },

    // --- Equipment & Motors (معدات) ---
    { id: 'p-equip-01', name: 'خلاط كاتم للصوت CKP -3018', sku: 'BLEND-CKP', price: 4500, quantity: 1, minLevel: 1, category: 'معدات' },
    { id: 'p-equip-02', name: 'ماتور 2 حصان مياة', sku: 'PUMP-2HP', price: 6500, quantity: 3, minLevel: 1, category: 'معدات' },
    { id: 'p-equip-03', name: 'ماتور 1 حصان مياة', sku: 'PUMP-1HP', price: 3500, quantity: 5, minLevel: 1, category: 'معدات' },
    { id: 'p-equip-04', name: 'مروحة تورنيدو سقف', sku: 'FAN-CEIL-TOR', price: 850, quantity: 3, minLevel: 1, category: 'معدات' },
    { id: 'p-equip-05', name: 'موتور دوار 15 لفه', sku: 'MTR-ROT-15', price: 450, quantity: 32, minLevel: 5, category: 'معدات' },
    { id: 'p-equip-06', name: 'ماتور دوار 30 لف', sku: 'MTR-ROT-30', price: 550, quantity: 12, minLevel: 5, category: 'معدات' },
    { id: 'p-equip-07', name: 'ماتور مروحة 16W', sku: 'MTR-FAN-16W', price: 250, quantity: 35, minLevel: 5, category: 'معدات' },
    { id: 'p-equip-08', name: 'ماتور مروحة 10W', sku: 'MTR-FAN-10W', price: 200, quantity: 19, minLevel: 5, category: 'معدات' },
    { id: 'p-equip-09', name: 'ماتور مروحة 25W', sku: 'MTR-FAN-25W', price: 300, quantity: 12, minLevel: 5, category: 'معدات' },
    { id: 'p-equip-10', name: 'هيتر الترا المانى ماكينه كريب', sku: 'HEAT-CREPE', price: 850, quantity: 19, minLevel: 5, category: 'معدات' },
    { id: 'p-equip-11', name: 'هيتر 50 سم', sku: 'HEAT-50', price: 150, quantity: 6, minLevel: 2, category: 'معدات' },
    { id: 'p-equip-12', name: 'هيتر 100 سم', sku: 'HEAT-100', price: 250, quantity: 6, minLevel: 2, category: 'معدات' },
    { id: 'p-equip-13', name: 'هيتر 120 سم', sku: 'HEAT-120', price: 300, quantity: 6, minLevel: 2, category: 'معدات' },
    { id: 'p-equip-14', name: 'هيتر بان ماري', sku: 'HEAT-BM', price: 450, quantity: 5, minLevel: 2, category: 'معدات' },
    { id: 'p-equip-15', name: 'سخان سفنديش', sku: 'HEAT-CHAF', price: 550, quantity: 10, minLevel: 2, category: 'معدات' },

    // --- Consumables & Accessories (مستهلكات واكسسوارات) ---
    { id: 'p-acc-01', name: 'مفصلة باب ثلاجه', sku: 'HINGE-FRIDGE', price: 85, quantity: 147, minLevel: 20, category: 'اكسسوار' },
    { id: 'p-acc-02', name: 'مقبض باب ثلاجة عرض', sku: 'HNDL-DISP', price: 120, quantity: 30, minLevel: 10, category: 'اكسسوار' },
    { id: 'p-acc-03', name: 'مقبض ديب فريزر', sku: 'HNDL-FREEZ', price: 95, quantity: 64, minLevel: 10, category: 'اكسسوار' },
    { id: 'p-acc-04', name: 'مقبض غاز الومنيوم بالمسمار', sku: 'HNDL-GAS', price: 45, quantity: 41, minLevel: 10, category: 'اكسسوار' },
    { id: 'p-acc-05', name: 'طقم كالون اكره باب', sku: 'LOCK-SET', price: 250, quantity: 5, minLevel: 2, category: 'اكسسوار' },
    { id: 'p-acc-06', name: 'افيز هندسي كبير', sku: 'CLMP-ENG', price: 5, quantity: 499, minLevel: 100, category: 'اكسسوار' },
    { id: 'p-acc-07', name: 'كيس حزام 30 سم (افيز)', sku: 'ZIP-30', price: 65, quantity: 8, minLevel: 2, category: 'اكسسوار' },
    { id: 'p-acc-08', name: 'كيس حزام 20 سم', sku: 'ZIP-20', price: 55, quantity: 4, minLevel: 2, category: 'اكسسوار' },
    { id: 'p-acc-09', name: 'روزتة 6 مم', sku: 'ROSET-6', price: 10, quantity: 3, minLevel: 5, category: 'اكسسوار' },
    { id: 'p-acc-10', name: 'زجاجة بيان', sku: 'SIGHT-GLASS', price: 120, quantity: 22, minLevel: 5, category: 'اكسسوار' },
    { id: 'p-acc-11', name: 'كلبش انبوبة', sku: 'CLMP-CYL', price: 25, quantity: 2, minLevel: 1, category: 'اكسسوار' },
    { id: 'p-acc-12', name: 'خرطوم غاز', sku: 'HOSE-GAS', price: 40, quantity: 25, minLevel: 5, category: 'اكسسوار' },
    { id: 'p-acc-13', name: 'شريط لحام', sku: 'TAPE-ELEC', price: 15, quantity: 49, minLevel: 10, category: 'مستهلكات' },
    { id: 'p-acc-14', name: 'بكرة تيفلون كبيرة', sku: 'TAPE-TEFLON', price: 25, quantity: 34, minLevel: 10, category: 'مستهلكات' },
    { id: 'p-acc-15', name: 'مجموعة اللاصق تركى', sku: 'ADHESIVE-SET', price: 85, quantity: 6, minLevel: 2, category: 'مستهلكات' },
    { id: 'p-acc-16', name: 'انبوبة سيليكون حراري', sku: 'SILIC-HEAT', price: 65, quantity: 24, minLevel: 5, category: 'مستهلكات' },
    { id: 'p-acc-17', name: 'عبوه فوم', sku: 'FOAM-CAN', price: 95, quantity: 60, minLevel: 10, category: 'مستهلكات' },
    { id: 'p-acc-18', name: 'مزيل صدأ', sku: 'WD40', price: 85, quantity: 42, minLevel: 10, category: 'مستهلكات' },
    { id: 'p-acc-19', name: 'دوكو اسود مط', sku: 'SPRAY-BLK', price: 45, quantity: 14, minLevel: 5, category: 'مستهلكات' },
    { id: 'p-acc-20', name: 'دوكو ابيض مط', sku: 'SPRAY-WHT', price: 45, quantity: 15, minLevel: 5, category: 'مستهلكات' },
    { id: 'p-acc-21', name: 'غيار رولة', sku: 'ROLL-RF', price: 25, quantity: 15, minLevel: 5, category: 'مستهلكات' },
    { id: 'p-acc-22', name: 'فرخ صنفرة 120', sku: 'SAND-120', price: 10, quantity: 37, minLevel: 10, category: 'مستهلكات' },
    { id: 'p-acc-23', name: 'عود فضة', sku: 'ROD-SLV', price: 150, quantity: 2.5, minLevel: 1, category: 'مستهلكات' },
    { id: 'p-acc-24', name: 'عود مكرونة', sku: 'ROD-MAC', price: 15, quantity: 26, minLevel: 5, category: 'مستهلكات' },
    { id: 'p-acc-25', name: 'عجل 2 بوصه', sku: 'WHEEL-2', price: 45, quantity: 11, minLevel: 5, category: 'اكسسوار' },
    { id: 'p-acc-26', name: 'مسمار سن صاج 6 مللي اطوال', sku: 'SCRW-6MM', price: 1, quantity: 5, minLevel: 10, category: 'اكسسوار' },
    { id: 'p-acc-27', name: 'مسمار تك 1 سم', sku: 'SCRW-TEK-1', price: 1, quantity: 1, minLevel: 10, category: 'اكسسوار' },
];

const DEMO_REPORTS: Report[] = [
    // 1. Critical Fire Issue
    {
        id: 'rep-201',
        branchId: 'br-cai-3',
        branchName: 'طلعت حرب - ب لبن',
        createdByUserId: 'br-mgr-3',
        createdByName: 'مدير فرع طلعت حرب',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        status: ReportStatus.IN_PROGRESS,
        priority: ReportPriority.CRITICAL,
        machineType: 'لوحة الكهرباء الرئيسية',
        description: 'انبعاث دخان من القاطع الرئيسي وانقطاع التيار عن نصف الفرع. يوجد خطر حريق.',
        assignedTechnicianId: 'tech-58404',
        assignedTechnicianName: 'محمد ابراهيم عبدالعزيز (مشرف كهرباء)',
        locationCoords: { lat: 30.0480, lng: 31.2390 },
        imagesBefore: ['https://picsum.photos/400/300?random=101'],
        imagesAfter: [],
        dynamicData: { type: 'electric' },
        dynamicAnswers: [],
        logs: []
    },
    // 2. High Priority Fridge
    {
        id: 'rep-202',
        branchId: 'br-mns-1',
        branchName: 'المنصورة المشايه- ب لبن',
        createdByUserId: 'br-mgr-1',
        createdByName: 'أ. محمد مدير الفرع',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: ReportStatus.ASSIGNED,
        priority: ReportPriority.HIGH,
        machineType: 'ثلاجة عرض أيس كريم',
        description: 'الثلاجة لا تفصل وتكون ثلج كثيف على المبخر، ودرجة الحرارة +5 بدل -18.',
        assignedTechnicianId: 'tech-6084',
        assignedTechnicianName: 'محمود حمدى سعيد (رئيس قسم تبريد)',
        locationCoords: { lat: 31.0409, lng: 31.3785 },
        imagesBefore: ['https://picsum.photos/400/300?random=102'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 3. Completed Plumbing
    {
        id: 'rep-203',
        branchId: 'br-alx-11',
        branchName: 'حلقة السمك - ب لبن',
        createdByUserId: 'br-mgr-x',
        createdByName: 'مدير فرع بحري',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        status: ReportStatus.COMPLETED,
        priority: ReportPriority.NORMAL,
        machineType: 'صرف صحي',
        description: 'انسداد في حوض الغسيل بالمطبخ وتسريب مياه على الأرض.',
        assignedTechnicianId: 'tech-11197',
        assignedTechnicianName: 'ابو بكر سعيد (سباك)',
        cost: 150,
        partsUsageList: [],
        locationCoords: { lat: 31.2050, lng: 29.8820 },
        imagesBefore: ['https://picsum.photos/400/300?random=103'],
        imagesAfter: ['https://picsum.photos/400/300?random=104'],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 4. Oven Issue Pending Parts
    {
        id: 'rep-204',
        branchId: 'br-tnt-1',
        branchName: 'طنطا الاستاذ - ب لبن',
        createdByUserId: 'br-mgr-tnt',
        createdByName: 'مدير فرع طنطا',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: ReportStatus.PENDING_PARTS,
        priority: ReportPriority.HIGH,
        machineType: 'فرن تسوية (أم علي)',
        description: 'الفرن لا يصل لدرجة الحرارة المطلوبة (180). تم الكشف وتبين تلف السخان السفلي.',
        assignedTechnicianId: 'tech-5953',
        assignedTechnicianName: 'احمد صبحى السيد (فني تبريد)',
        adminNotes: 'تم طلب السخان من المورد، متوقع الوصول غداً.',
        locationCoords: { lat: 30.7950, lng: 30.9990 },
        imagesBefore: ['https://picsum.photos/400/300?random=105'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 5. AC Issue - New
    {
        id: 'rep-205',
        branchId: 'br-lxr-1',
        branchName: 'الاقصر - ب لبن',
        createdByUserId: 'br-mgr-lxr',
        createdByName: 'مدير فرع الأقصر',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        status: ReportStatus.NEW,
        priority: ReportPriority.HIGH,
        machineType: 'تكييف كاريير 5 حصان',
        description: 'صوت عالي جداً من الوحدة الخارجية وتوقف التبريد نهائياً.',
        assignedTechnicianId: 'tech-6089',
        assignedTechnicianName: 'عاطف محمد احمد محمد (مشرف صيانة)',
        locationCoords: { lat: 25.6960, lng: 32.6420 },
        imagesBefore: ['https://picsum.photos/400/300?random=106'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 6. Signboard - Low Priority
    {
        id: 'rep-206',
        branchId: 'br-mat-1',
        branchName: 'مطروح - ب لبن',
        createdByUserId: 'br-mgr-mat',
        createdByName: 'مدير فرع مطروح',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        status: ReportStatus.ASSIGNED,
        priority: ReportPriority.LOW,
        machineType: 'يافطة خارجية',
        description: 'حرف الباء في الاسم مضئ بشكل متقطع (رعشة).',
        assignedTechnicianId: 'tech-10839',
        assignedTechnicianName: 'رامي مجدي محى الدين (فني كهرباء)',
        locationCoords: { lat: 31.3520, lng: 27.2350 },
        imagesBefore: ['https://picsum.photos/400/300?random=107'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 7. POS System - Critical
    {
        id: 'rep-207',
        branchId: 'br-cai-32',
        branchName: 'مدينه نصر - ب لبن',
        createdByUserId: 'br-mgr-nasr',
        createdByName: 'مدير فرع م.نصر',
        createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
        status: ReportStatus.NEW,
        priority: ReportPriority.CRITICAL,
        machineType: 'نظام الكاشير (POS)',
        description: 'الجهاز الرئيسي لا يعمل والسيستم متوقف بالكامل. لا يمكن إصدار فواتير.',
        locationCoords: { lat: 30.0450, lng: 31.3650 },
        imagesBefore: ['https://picsum.photos/400/300?random=108'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 8. Blender - In Progress
    {
        id: 'rep-208',
        branchId: 'br-ras-1',
        branchName: 'راس البر - ب لبن',
        createdByUserId: 'br-mgr-ras',
        createdByName: 'مدير فرع راس البر',
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        status: ReportStatus.IN_PROGRESS,
        priority: ReportPriority.NORMAL,
        machineType: 'خلاط عصائر صناعي',
        description: 'صوت خشونة عالي بالموتور واهتزاز أثناء التشغيل.',
        assignedTechnicianId: 'tech-4206',
        assignedTechnicianName: 'حسني ناجي سعد (فني معدات)',
        locationCoords: { lat: 31.5126, lng: 31.8394 },
        imagesBefore: ['https://picsum.photos/400/300?random=109'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 9. Door - Completed
    {
        id: 'rep-209',
        branchId: 'br-ism-1',
        branchName: 'الاسماعيلية - ب لبن',
        createdByUserId: 'br-mgr-ism',
        createdByName: 'مدير فرع الإسماعيلية',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        completedAt: new Date(Date.now() - 86400000 * 3.5).toISOString(),
        status: ReportStatus.COMPLETED,
        priority: ReportPriority.NORMAL,
        machineType: 'باب سيكوريت',
        description: 'الباب يحتك بالأرضية ويحتاج ضبط مفصلات.',
        assignedTechnicianId: 'tech-56972',
        assignedTechnicianName: 'ابراهيم ربيع ابراهيم (كهرباء وأبواب)',
        cost: 0,
        partsUsageList: [],
        locationCoords: { lat: 30.5900, lng: 32.2680 },
        imagesBefore: ['https://picsum.photos/400/300?random=110'],
        imagesAfter: ['https://picsum.photos/400/300?random=111'],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 10. Fryer - Pending Parts
    {
        id: 'rep-210',
        branchId: 'br-zag-1',
        branchName: 'الزقازيق - ب لبن',
        createdByUserId: 'br-mgr-zag',
        createdByName: 'مدير فرع الزقازيق',
        createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        status: ReportStatus.PENDING_PARTS,
        priority: ReportPriority.HIGH,
        machineType: 'قلاية بطاطس',
        description: 'الثرموستات لا يفصل الزيت يغلي بشدة.',
        assignedTechnicianId: 'tech-55541',
        assignedTechnicianName: 'امير ايمن بشندي (فني تبريد)',
        adminNotes: 'جاري البحث عن ثرموستات EGO إيطالي أصلي.',
        locationCoords: { lat: 30.5877, lng: 31.5020 },
        imagesBefore: ['https://picsum.photos/400/300?random=112'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 11. Coffee Machine
    {
        id: 'rep-211',
        branchId: 'br-giz-3',
        branchName: 'الشيخ زايد - ب لبن',
        createdByUserId: 'br-mgr-zyd',
        createdByName: 'مدير فرع زايد',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: ReportStatus.NEW,
        priority: ReportPriority.NORMAL,
        machineType: 'ماكينة قهوة اسبريسو',
        description: 'تسريب مياه من الجروب هيد الأيمن.',
        locationCoords: { lat: 30.0450, lng: 30.9700 },
        imagesBefore: ['https://picsum.photos/400/300?random=113'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
    // 12. Upper Egypt Fridge
    {
        id: 'rep-212',
        branchId: 'br-ast-1',
        branchName: 'اسيوط - ب لبن',
        createdByUserId: 'br-mgr-ast',
        createdByName: 'مدير فرع أسيوط',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: ReportStatus.ASSIGNED,
        priority: ReportPriority.CRITICAL,
        machineType: 'غرفة تجميد',
        description: 'درجة الحرارة ترتفع بسرعة (وصلت -5)، والمروحة الداخلية متوقفة.',
        assignedTechnicianId: 'tech-54712',
        assignedTechnicianName: 'مصطفى محمد رجب (مشرف تبريد)',
        locationCoords: { lat: 27.1820, lng: 31.1850 },
        imagesBefore: ['https://picsum.photos/400/300?random=114'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    },
     // 13. Lighting
    {
        id: 'rep-213',
        branchId: 'br-cai-22',
        branchName: 'شيراتون - ب لبن',
        createdByUserId: 'br-mgr-sher',
        createdByName: 'مدير فرع شيراتون',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        status: ReportStatus.COMPLETED,
        priority: ReportPriority.LOW,
        machineType: 'إضاءة الصالة',
        description: 'تغيير 10 سبوتات ليد محروقة.',
        assignedTechnicianId: 'tech-63853',
        assignedTechnicianName: 'احمد عبدالعزيز حسين (فني كهرباء)',
        completedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        cost: 500,
        partsUsageList: [],
        locationCoords: { lat: 30.1000, lng: 31.3800 },
        imagesBefore: ['https://picsum.photos/400/300?random=115'],
        imagesAfter: [],
        dynamicData: {},
        dynamicAnswers: [],
        logs: []
    }
];

export const api = {
  // --- System Configuration ---
  getSystemConfig: async (): Promise<SystemConfig | null> => {
    try {
        const { data, error } = await supabase.from('system_config').select('config').eq('id', 1).single();
        if (error || !data) return null; 
        return data.config as SystemConfig;
    } catch (e) {
        return null; // Safe fallback
    }
  },

  saveSystemConfig: async (config: SystemConfig): Promise<SystemConfig> => {
    const { data, error } = await supabase
      .from('system_config')
      .upsert({ id: 1, config, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data.config;
  },

  // --- Users ---
  getUsers: async (): Promise<User[]> => {
    try {
        const { data, error } = await supabase.from('users').select('*');
        if (error || !data || data.length === 0) throw new Error("No users found");
        
        return data.map((u: any) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role,
            branchId: u.branch_id,
            avatar: u.avatar,
            phone: u.phone,
            password: u.password 
        }));
    } catch (e) {
        // Fallback to DEMO USERS
        return DEMO_USERS;
    }
  },

  saveUser: async (user: User): Promise<User> => {
    const dbUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        branch_id: user.branchId,
        avatar: user.avatar,
        phone: user.phone
    };
    
    const { data, error } = await supabase.from('users').upsert(dbUser).select().single();
    if (error) throw error;
    return user;
  },

  deleteUser: async (id: string): Promise<void> => {
    await supabase.from('users').delete().eq('id', id);
  },

  // --- Branches ---
  getBranches: async (): Promise<Branch[]> => {
    try {
        const { data, error } = await supabase.from('branches').select('*');
        if (data && data.length > 0) {
            return data.map((b: any) => ({
                id: b.id,
                name: b.name,
                location: b.location,
                brand: b.brand, // Map brand from DB
                managerId: b.manager_id,
                phone: b.phone,
                lat: b.lat,
                lng: b.lng
            }));
        }
    } catch (e) {
        // Fallback to static list if DB is empty or fails
    }
    return MOCK_BRANCHES;
  },

  saveBranch: async (branch: Branch): Promise<Branch> => {
    const dbBranch = {
        id: branch.id,
        name: branch.name,
        location: branch.location,
        brand: branch.brand, // Save brand to DB
        manager_id: branch.managerId,
        phone: branch.phone,
        lat: branch.lat,
        lng: branch.lng
    };

    const { data, error } = await supabase.from('branches').upsert(dbBranch).select().single();
    if (error) throw error;

    return {
        id: data.id,
        name: data.name,
        location: data.location,
        brand: data.brand,
        managerId: data.manager_id,
        phone: data.phone,
        lat: data.lat,
        lng: data.lng
    };
  },

  deleteBranch: async (id: string): Promise<void> => {
    await supabase.from('branches').delete().eq('id', id);
  },

  // --- Inventory ---
  getInventory: async (): Promise<SparePart[]> => {
    try {
        const { data, error } = await supabase.from('spare_parts').select('*');
        if (error || !data || data.length === 0) throw new Error("No parts");
        return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            price: p.price,
            quantity: p.quantity,
            minLevel: p.min_level,
            category: p.category
        }));
    } catch (e) {
        return DEMO_PARTS;
    }
  },

  saveSparePart: async (part: SparePart): Promise<SparePart> => {
    const dbPart = {
        id: part.id,
        name: part.name,
        sku: part.sku,
        price: part.price,
        quantity: part.quantity,
        min_level: part.minLevel,
        category: part.category
    };
    const { error } = await supabase.from('spare_parts').upsert(dbPart);
    if (error) throw error;
    return part;
  },

  deleteSparePart: async (id: string): Promise<void> => {
    await supabase.from('spare_parts').delete().eq('id', id);
  },

  getLowStockItems: async (): Promise<SparePart[]> => {
    try {
        const { data, error } = await supabase.from('spare_parts').select('*');
        if (error) throw error;
        
        return data
            .filter((p: any) => p.quantity <= p.min_level)
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: p.price,
                quantity: p.quantity,
                minLevel: p.min_level,
                category: p.category
            }));
    } catch (e) {
        return DEMO_PARTS.filter(p => p.quantity <= p.minLevel);
    }
  },

  // --- Reports (Maintenance Requests) ---
  getReports: async (): Promise<Report[]> => {
    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error || !data || data.length === 0) throw new Error("No reports");

        return data.map((r: any) => ({
            id: r.id,
            branchId: r.branch_id,
            branchName: r.branch_name,
            createdByUserId: r.created_by_user_id,
            createdByName: r.created_by_name,
            createdAt: r.created_at,
            status: r.status,
            priority: r.priority,
            machineType: r.machine_type,
            description: r.description,
            assignedTechnicianId: r.assigned_technician_id,
            assignedTechnicianName: r.assigned_technician_name,
            dynamicAnswers: r.dynamic_answers || [],
            dynamicData: r.dynamic_data || {},
            locationCoords: r.location_coords,
            imagesBefore: r.images_before || [],
            imagesAfter: r.images_after || [],
            cost: r.cost,
            partsUsageList: r.parts_usage_list || [],
            adminNotes: r.admin_notes,
            logs: [],
            completedAt: r.completed_at
        }));
    } catch (e) {
        return DEMO_REPORTS;
    }
  },

  saveReport: async (report: Report): Promise<Report> => {
    const dbReport = {
        id: report.id,
        branch_id: report.branchId,
        branch_name: report.branchName,
        created_by_user_id: report.createdByUserId,
        created_by_name: report.createdByName,
        status: report.status,
        priority: report.priority,
        machine_type: report.machineType,
        description: report.description,
        location_coords: report.locationCoords,
        images_before: report.imagesBefore,
        images_after: report.imagesAfter,
        assigned_technician_id: report.assignedTechnicianId,
        assigned_technician_name: report.assignedTechnicianName,
        cost: report.cost,
        parts_usage_list: report.partsUsageList,
        dynamic_data: report.dynamicData,
        dynamic_answers: report.dynamicAnswers,
        admin_notes: report.adminNotes,
        updated_at: new Date().toISOString(),
        ...(report.status === ReportStatus.COMPLETED ? { completed_at: new Date().toISOString() } : {})
    };

    const { error } = await supabase.from('reports').upsert(dbReport);
    if (error) throw error;

    if (report.status === ReportStatus.COMPLETED && report.partsUsageList) {
        for (const usage of report.partsUsageList) {
            const { data: part } = await supabase.from('spare_parts').select('quantity').eq('id', usage.partId).single();
            if (part) {
                const newQty = Math.max(0, part.quantity - usage.quantity);
                await supabase.from('spare_parts').update({ quantity: newQty }).eq('id', usage.partId);
            }
        }
    }

    return report;
  },

  // --- Real-time Subscription ---
  subscribeToReports: (callback: (payload: any) => void) => {
    return supabase
      .channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, callback)
      .subscribe();
  },

  // --- Analytics (MTTR) ---
  getAnalytics: async () => {
    try {
        const { data: reports } = await supabase
            .from('reports')
            .select('created_at, completed_at, priority, branch_name')
            .eq('status', 'COMPLETED')
            .not('completed_at', 'is', null);

        if (!reports || reports.length === 0) {
             // Calculate demo analytics if no DB
             const demoCompleted = DEMO_REPORTS.filter(r => r.status === ReportStatus.COMPLETED);
             return {
                 mttrHours: 24.5,
                 completedCount: demoCompleted.length
             };
        }

        let totalDurationMinutes = 0;
        
        reports.forEach((r: any) => {
            const start = new Date(r.created_at).getTime();
            const end = new Date(r.completed_at).getTime();
            const diffMinutes = (end - start) / (1000 * 60);
            totalDurationMinutes += diffMinutes;
        });

        const mttr = reports.length > 0 ? parseFloat((totalDurationMinutes / reports.length / 60).toFixed(1)) : 0; 

        return {
            mttrHours: mttr,
            completedCount: reports.length
        };
    } catch (e) {
        return { mttrHours: 0, completedCount: 0 };
    }
  },

  // Utility
  classifyPriority: (text: string): ReportPriority => {
    const criticalKeywords = ['حريق', 'دخان', 'كهرباء', 'توقف كامل', 'تسريب غاز', 'خطر', 'شرار', 'انفجار', 'ماس'];
    const highKeywords = ['تكييف', 'سيرفر', 'بوابة', 'تعطل', 'حرارة', 'فريزر', 'تجميد'];
    
    if (criticalKeywords.some(w => text.includes(w))) return ReportPriority.CRITICAL;
    if (highKeywords.some(w => text.includes(w))) return ReportPriority.HIGH;
    return ReportPriority.NORMAL;
  }
};
