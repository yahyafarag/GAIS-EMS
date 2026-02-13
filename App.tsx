import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { Role } from './types';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing'; // Updated import
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSettings } from './pages/admin/AdminSettings';
import { BranchWizard } from './pages/branch/BranchWizard';
import { TechnicianTasks } from './pages/technician/TechnicianTasks';
import { GlassCard } from './components/ui/GlassCard';
import { NetworkStatus } from './components/ui/NetworkStatus'; // New import

const Router: React.FC = () => {
  const { user } = useApp();
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!user) {
    return <Landing />;
  }

  // Basic Router Switch
  let content;

  // Admin Routes
  if (user.role === Role.ADMIN) {
      if (currentHash === '' || currentHash === '#/admin') content = <AdminDashboard />;
      else if (currentHash === '#/admin/settings') content = <AdminSettings />;
      else content = <AdminDashboard />;
  }
  
  // Branch Routes
  else if (user.role === Role.BRANCH_MANAGER) {
      if (currentHash === '#/branch/new') content = <BranchWizard />;
      else if (currentHash === '#/branch/history') content = <div className="p-10 text-center"><GlassCard className="p-10"><h2 className="text-2xl mb-4">سجل البلاغات</h2><p>هنا تظهر قائمة البلاغات الخاصة بالفرع وحالتها...</p></GlassCard></div>;
      else {
          content = <BranchWizard />;
      }
  }

  // Tech Routes
  else if (user.role === Role.TECHNICIAN) {
      content = <TechnicianTasks />;
  }

  return <Layout>{content}</Layout>;
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <NetworkStatus />
        <Router />
      </ToastProvider>
    </AppProvider>
  );
};

export default App;