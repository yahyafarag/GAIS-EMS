
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, SystemConfig, DynamicField, Report, ReportStatus, ReportAnswer } from '../types';
import { api } from '../services/api';

type ConfigSection = 'reportQuestions' | 'repairFields';

interface AppContextType {
  user: User | null;
  config: SystemConfig | null;
  isLoading: boolean;
  login: (role: Role) => Promise<void>;
  logout: () => void;
  
  // --- Admin Functions ---
  addField: (section: ConfigSection, field: DynamicField) => Promise<void>;
  removeField: (section: ConfigSection, fieldId: string) => Promise<void>;
  updateField: (section: ConfigSection, fieldId: string, updates: Partial<DynamicField>) => Promise<void>;
  updateFieldOrder: (section: ConfigSection, sourceIndex: number, destIndex: number) => Promise<void>;
  updateFeature: (feature: string, value: boolean) => Promise<void>;

  // --- Report Functions ---
  createReport: (reportData: Partial<Report>, dynamicValues: Record<string, any>) => Promise<Report>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Data
  const loadSystemData = async () => {
    try {
      const sysConfig = await api.getSystemConfig();
      setConfig(sysConfig);
    } catch (e) {
      console.error("Failed to load config", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadSystemData();
      const savedUser = localStorage.getItem('ems_session_user');
      if (savedUser) setUser(JSON.parse(savedUser));
      setIsLoading(false);
    };
    init();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'ems_config_v4') loadSystemData();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auth Logic
  const login = async (role: Role) => {
    setIsLoading(true);
    const users = await api.getUsers();
    let loggedUser = users.find(u => u.role === role);
    
    // Fallback for demo
    if (!loggedUser) {
        if(role === Role.ADMIN) loggedUser = { id: 'adm-demo', name: 'المدير العام', role: Role.ADMIN };
        if(role === Role.BRANCH_MANAGER) loggedUser = { id: 'br-demo', name: 'مدير الفرع', role: Role.BRANCH_MANAGER, branchId: 'br-1' };
        if(role === Role.TECHNICIAN) loggedUser = { id: 'tech-demo', name: 'فني الصيانة', role: Role.TECHNICIAN };
    }

    if (loggedUser) {
        setUser(loggedUser);
        localStorage.setItem('ems_session_user', JSON.stringify(loggedUser));
    }
    setIsLoading(false);
  };

  const logout = () => {
      setUser(null);
      localStorage.removeItem('ems_session_user');
      window.location.hash = '';
  };

  // --- Dynamic System Engine Implementation ---

  const addField = async (section: ConfigSection, field: DynamicField) => {
      if (!config) return;
      const newConfig = { 
          ...config, 
          [section]: [...config[section], field] 
      };
      await api.saveSystemConfig(newConfig);
      setConfig(newConfig);
  };

  const removeField = async (section: ConfigSection, fieldId: string) => {
      if (!config) return;
      const newConfig = {
          ...config,
          [section]: config[section].filter(f => f.id !== fieldId)
      };
      await api.saveSystemConfig(newConfig);
      setConfig(newConfig);
  };

  const updateField = async (section: ConfigSection, fieldId: string, updates: Partial<DynamicField>) => {
      if (!config) return;
      const newConfig = {
          ...config,
          [section]: config[section].map(f => f.id === fieldId ? { ...f, ...updates } : f)
      };
      await api.saveSystemConfig(newConfig);
      setConfig(newConfig);
  };

  const updateFieldOrder = async (section: ConfigSection, sourceIndex: number, destIndex: number) => {
      if (!config) return;
      const list = [...config[section]];
      const [removed] = list.splice(sourceIndex, 1);
      list.splice(destIndex, 0, removed);
      
      // Update order property
      const updatedList = list.map((item, index) => ({ ...item, order: index + 1 }));

      const newConfig = { ...config, [section]: updatedList };
      await api.saveSystemConfig(newConfig);
      setConfig(newConfig);
  };

  const updateFeature = async (feature: string, value: boolean) => {
      if (!config) return;
      const newConfig = { ...config, features: { ...config.features, [feature]: value } };
      await api.saveSystemConfig(newConfig);
      setConfig(newConfig);
  };

  // --- Report Creation Logic ---

  const createReport = async (reportData: Partial<Report>, dynamicValues: Record<string, any>): Promise<Report> => {
      if (!config) throw new Error("Config not loaded");

      // Build dynamicAnswers snapshot
      const dynamicAnswers: ReportAnswer[] = [];
      const allFields = [...config.reportQuestions, ...config.repairFields];
      
      Object.entries(dynamicValues).forEach(([key, value]) => {
          const fieldDef = allFields.find(f => f.id === key);
          if (fieldDef && value) {
              dynamicAnswers.push({
                  fieldId: key,
                  labelAr: fieldDef.labelAr, // Snapshot the Arabic Label
                  value: value,
                  type: fieldDef.type
              });
          }
      });

      const fullReport: Report = {
          id: `rep-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: ReportStatus.NEW,
          logs: [],
          imagesBefore: [],
          imagesAfter: [],
          dynamicData: dynamicValues,
          dynamicAnswers: dynamicAnswers, // New Field
          // Defaults
          branchId: '',
          branchName: '',
          createdByUserId: '',
          createdByName: '',
          priority: reportData.priority || api.classifyPriority(JSON.stringify(dynamicValues)),
          machineType: dynamicValues['machineType'] || 'General',
          description: dynamicValues['description'] || '',
          ...reportData as any
      };

      return await api.saveReport(fullReport);
  };

  return (
    <AppContext.Provider value={{ 
        user, 
        config, 
        isLoading, 
        login, 
        logout, 
        addField,
        removeField,
        updateField,
        updateFieldOrder,
        updateFeature,
        createReport 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
