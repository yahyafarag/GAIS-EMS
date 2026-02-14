
export enum Role {
  ADMIN = 'ADMIN',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  TECHNICIAN = 'TECHNICIAN'
}

export enum ReportStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_PARTS = 'PENDING_PARTS',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED'
}

export enum ReportPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// --- Dynamic Schema Definitions ---

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'image' | 'gps';

export interface DynamicField {
  id: string;
  labelAr: string; // Renamed from label to enforce strict Arabic labeling
  type: FieldType;
  required: boolean;
  options?: string[]; // Only for 'select' type
  placeholder?: string;
  step: number; // For Wizard organization
  order: number;
}

export interface SystemFeatures {
  enableWhatsApp: boolean;
  requireEvidenceBefore: boolean;
  requireEvidenceAfter: boolean;
  autoAssign: boolean;
}

export interface SystemConfig {
  reportQuestions: DynamicField[]; // Questions for Branch Manager
  repairFields: DynamicField[];    // Renamed from techProofFields as requested
  features: SystemFeatures;
}

// --- Inventory & Spare Parts Schema ---

export interface SparePart {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  minLevel: number; // Reorder Level
  category?: string;
}

export interface PartUsage {
  partId: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
}

// --- Core Entities ---

export interface User {
  id: string;
  name: string;
  username?: string; // New: For login
  password?: string; // New: For auth management
  role: Role;
  branchId?: string;
  avatar?: string;
  phone?: string; // Added for WhatsApp
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  brand?: string; // Added Brand Field
  managerId?: string;
  phone?: string; // Added for WhatsApp
  lat?: number;
  lng?: number;
}

export interface ReportLog {
  id: string;
  date: string;
  text: string;
  userId: string;
  userName: string;
  type: 'STATUS_CHANGE' | 'COMMENT' | 'SYSTEM';
}

export interface ReportAnswer {
  fieldId: string;
  labelAr: string; 
  value: any;
  type: FieldType;
}

// Mapped to MaintenanceReport in requirements
export interface Report {
  id: string;
  branchId: string;
  branchName: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  
  // Static Core Fields
  priority: ReportPriority;
  status: ReportStatus;
  machineType: string; 
  description: string; 
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  
  // Dynamic Data
  dynamicAnswers: ReportAnswer[]; // Renamed from answers
  
  // Legacy/Helper accessors
  dynamicData: Record<string, any>; 
  
  locationCoords?: { lat: number; lng: number };
  imagesBefore: string[];
  imagesAfter: string[];
  
  // Financials & Parts
  cost?: number; // Total Cost (Labor + Parts)
  partsUsed?: string; // Legacy string description
  partsUsageList?: PartUsage[]; // New Structured Data
  
  adminNotes?: string;
  
  logs: ReportLog[];
  completedAt?: string;
}
