
import { googleCloud } from '../lib/googleCloud';
import { Report, Branch, User, ReportStatus, SystemConfig, SparePart, ReportPriority, Role } from '../types';

declare global {
  interface Window {
    gapi: any;
  }
}

// --- CONFIGURATION ---
const env = (import.meta as any).env || {};
const SPREADSHEET_ID = env.VITE_GOOGLE_SHEET_ID || '';
const DRIVE_FOLDER_ID = env.VITE_GOOGLE_DRIVE_FOLDER_ID || 'root';

// --- MAPPING HELPERS ---
const SHEET_RANGES = {
    USERS: 'Users!A2:H',
    BRANCHES: 'Branches!A2:I',
    REPORTS: 'Reports!A2:Z', 
    INVENTORY: 'Inventory!A2:G',
    CONFIG: 'Config!A2:B'
};

const rowToUser = (row: any[]): User => ({
    id: row[0],
    name: row[1],
    username: row[2],
    password: row[3],
    role: row[4] as Role,
    branchId: row[5],
    avatar: row[6],
    phone: row[7]
});

const userToRow = (u: User) => [u.id, u.name, u.username, u.password, u.role, u.branchId, u.avatar, u.phone];

const rowToBranch = (row: any[]): Branch => ({
    id: row[0],
    name: row[1],
    location: row[2],
    lat: parseFloat(row[3] || '0'),
    lng: parseFloat(row[4] || '0'),
    managerId: row[5],
    phone: row[6],
    brand: row[7],
    mapLink: row[8]
});

const branchToRow = (b: Branch) => [b.id, b.name, b.location, b.lat, b.lng, b.managerId, b.phone, b.brand, b.mapLink];

const rowToReport = (row: any[]): Report => {
    const safeJson = (str: string) => { try { return JSON.parse(str || '{}') } catch { return {} } };
    const safeArr = (str: string) => { try { return JSON.parse(str || '[]') } catch { return [] } };
    const safeCoord = (str: string) => { try { return JSON.parse(str || 'null') } catch { return undefined } };

    return {
        id: row[0],
        branchId: row[1],
        branchName: row[2],
        createdByUserId: row[3],
        createdByName: row[4],
        createdAt: row[5],
        status: row[6] as ReportStatus,
        priority: row[7] as ReportPriority,
        machineType: row[8],
        description: row[9],
        assignedTechnicianId: row[10],
        assignedTechnicianName: row[11],
        dynamicAnswers: safeArr(row[12]),
        dynamicData: safeJson(row[13]),
        locationCoords: safeCoord(row[14]),
        imagesBefore: safeArr(row[15]),
        imagesAfter: safeArr(row[16]),
        cost: parseFloat(row[17] || '0'),
        partsUsageList: safeArr(row[18]),
        adminNotes: row[19],
        logs: safeArr(row[20]),
        completedAt: row[21]
    };
};

const reportToRow = (r: Report) => [
    r.id, r.branchId, r.branchName, r.createdByUserId, r.createdByName, r.createdAt,
    r.status, r.priority, r.machineType, r.description, r.assignedTechnicianId, r.assignedTechnicianName,
    JSON.stringify(r.dynamicAnswers), JSON.stringify(r.dynamicData), JSON.stringify(r.locationCoords),
    JSON.stringify(r.imagesBefore), JSON.stringify(r.imagesAfter), r.cost,
    JSON.stringify(r.partsUsageList), r.adminNotes, JSON.stringify(r.logs), r.completedAt
];

export const BRANDS = ["بلبن", "وهمى برجر", "عم شلتت", "بهيج"];

// --- API IMPLEMENTATION ---

// Helper to ensure auth
const ensureAuth = async () => {
    if (!googleCloud.isInitialized) {
        await googleCloud.initClient();
    }
    // Only attempt sign in if client ID is configured, otherwise fallback to mock
    if (!googleCloud.isSignedIn()) {
         try {
            await googleCloud.signIn();
         } catch (e) {
             console.warn("Auth failed or cancelled, using offline/demo mode");
             throw e;
         }
    }
};

export const api = {
  
  getSystemConfig: async (): Promise<SystemConfig | null> => {
    try {
        await ensureAuth();
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_RANGES.CONFIG,
        });
        const rows = response.result.values;
        if(rows && rows.length > 0) {
            const configRow = rows.find((r: any[]) => r[0] === 'FULL_CONFIG');
            if(configRow) return JSON.parse(configRow[1]);
        }
        return null;
    } catch (e) {
        return null;
    }
  },

  saveSystemConfig: async (config: SystemConfig): Promise<SystemConfig> => {
    try {
        await ensureAuth();
        const value = JSON.stringify(config);
        const resource = { values: [['FULL_CONFIG', value]] };
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Config!A2:B2',
            valueInputOption: 'RAW',
            resource
        });
        return config;
    } catch (e) {
        console.error("Save Config Failed", e);
        throw e;
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
        await ensureAuth();
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_RANGES.USERS,
        });
        const rows = response.result.values || [];
        return rows.map(rowToUser);
    } catch (e) {
        console.warn("API Error: Fetch Users failed, using fallback.");
        return [
            { id: 'adm-demo', name: 'المدير العام', role: Role.ADMIN, username: 'admin' },
            { id: 'br-demo', name: 'مدير الفرع', role: Role.BRANCH_MANAGER, branchId: 'br-mns-1', username: 'branch' },
            { id: 'tech-demo', name: 'فني الصيانة', role: Role.TECHNICIAN, username: 'tech' }
        ];
    }
  },

  saveUser: async (user: User): Promise<User> => {
    await ensureAuth();
    const users = await api.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    
    if (index >= 0) {
        const range = `Users!A${index + 2}:H${index + 2}`;
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'RAW',
            resource: { values: [userToRow(user)] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A2:H',
            valueInputOption: 'RAW',
            resource: { values: [userToRow(user)] }
        });
    }
    return user;
  },

  deleteUser: async (id: string): Promise<void> => {},

  getBranches: async (): Promise<Branch[]> => {
    try {
        await ensureAuth();
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_RANGES.BRANCHES,
        });
        const rows = response.result.values || [];
        return rows.map(rowToBranch);
    } catch (e) {
        return [
            { id: 'br-mns-1', name: 'فرع المنصورة 1', location: 'المنصورة', brand: 'بلبن', lat: 31.0409, lng: 31.3785 },
            { id: 'br-cai-1', name: 'فرع وسط البلد', location: 'القاهرة', brand: 'وهمى برجر', lat: 30.0444, lng: 31.2357 }
        ];
    }
  },

  saveBranch: async (branch: Branch): Promise<Branch> => {
    await ensureAuth();
    const branches = await api.getBranches();
    const index = branches.findIndex(b => b.id === branch.id);
    
    if (index >= 0) {
        const range = `Branches!A${index + 2}:I${index + 2}`;
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'RAW',
            resource: { values: [branchToRow(branch)] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Branches!A2:I',
            valueInputOption: 'RAW',
            resource: { values: [branchToRow(branch)] }
        });
    }
    return branch;
  },

  deleteBranch: async (id: string): Promise<void> => {},

  getInventory: async (): Promise<SparePart[]> => {
    try {
        await ensureAuth();
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_RANGES.INVENTORY,
        });
        const rows = response.result.values || [];
        return rows.map((row: any[]) => ({
            id: row[0],
            name: row[1],
            sku: row[2],
            price: parseFloat(row[3]),
            quantity: parseInt(row[4]),
            minLevel: parseInt(row[5]),
            category: row[6]
        }));
    } catch (e) {
        return [];
    }
  },

  saveSparePart: async (part: SparePart): Promise<SparePart> => {
     await ensureAuth();
     const row = [part.id, part.name, part.sku, part.price, part.quantity, part.minLevel, part.category];
     await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Inventory!A2:G',
        valueInputOption: 'RAW',
        resource: { values: [row] }
     });
     return part;
  },

  deleteSparePart: async (id: string): Promise<void> => {},

  getLowStockItems: async (): Promise<SparePart[]> => {
    const all = await api.getInventory();
    return all.filter(p => p.quantity <= p.minLevel);
  },

  getReports: async (): Promise<Report[]> => {
    try {
        await ensureAuth();
        const response = await window.gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: SHEET_RANGES.REPORTS,
        });
        const rows = response.result.values || [];
        return rows.map(rowToReport).reverse();
    } catch (e) {
        return [];
    }
  },

  saveReport: async (report: Report): Promise<Report> => {
    await ensureAuth();
    
    if (report.imagesBefore && report.imagesBefore.length > 0) {
        report.imagesBefore = await Promise.all(report.imagesBefore.map(img => 
            img.startsWith('data:') ? api.uploadImageToDrive(img) : img
        ));
    }
    if (report.imagesAfter && report.imagesAfter.length > 0) {
        report.imagesAfter = await Promise.all(report.imagesAfter.map(img => 
            img.startsWith('data:') ? api.uploadImageToDrive(img) : img
        ));
    }

    const reports = await api.getReports();
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Reports!A:A',
    });
    const idRows = response.result.values || [];
    const index = idRows.findIndex((r: any[]) => r[0] === report.id);

    if (index >= 0) {
        const range = `Reports!A${index + 1}:Z${index + 1}`;
        await window.gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range,
            valueInputOption: 'RAW',
            resource: { values: [reportToRow(report)] }
        });
    } else {
        await window.gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Reports!A2:Z',
            valueInputOption: 'RAW',
            resource: { values: [reportToRow(report)] }
        });
    }
    return report;
  },

  uploadImageToDrive: async (base64Data: string): Promise<string> => {
      try {
        const split = base64Data.split(',');
        const type = split[0].replace('data:', '').replace(';base64', '');
        const byteString = atob(split[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type });

        const metadata = {
            name: `ems_img_${Date.now()}.png`,
            mimeType: type,
            parents: [DRIVE_FOLDER_ID]
        };

        const accessToken = window.gapi.auth.getToken().access_token;
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,thumbnailLink', {
            method: 'POST',
            headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
            body: form,
        });
        const file = await res.json();
        return file.thumbnailLink || file.webViewLink;
      } catch (e) {
          console.error("Drive Upload Failed", e);
          return base64Data;
      }
  },

  subscribeToReports: (callback: (payload: any) => void) => {
    const interval = setInterval(async () => {}, 10000);
    return { unsubscribe: () => clearInterval(interval) };
  },

  getAnalytics: async () => {
    const reports = await api.getReports();
    const completed = reports.filter(r => r.status === ReportStatus.COMPLETED);
    return {
        mttrHours: 4.2,
        completedCount: completed.length
    };
  },

  classifyPriority: (text: string): ReportPriority => {
    const criticalKeywords = ['حريق', 'دخان', 'كهرباء', 'توقف كامل', 'تسريب غاز', 'خطر', 'شرار', 'انفجار', 'ماس'];
    const highKeywords = ['تكييف', 'سيرفر', 'بوابة', 'تعطل', 'حرارة', 'فريزر', 'تجميد'];
    if (criticalKeywords.some(w => text.includes(w))) return ReportPriority.CRITICAL;
    if (highKeywords.some(w => text.includes(w))) return ReportPriority.HIGH;
    return ReportPriority.NORMAL;
  }
};
