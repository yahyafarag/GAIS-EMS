import React from 'react';
import { ReportStatus, ReportPriority } from '../../types';

export const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const styles = {
    [ReportStatus.NEW]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [ReportStatus.ASSIGNED]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    [ReportStatus.IN_PROGRESS]: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    [ReportStatus.PENDING_PARTS]: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    [ReportStatus.COMPLETED]: 'bg-green-500/20 text-green-300 border-green-500/30',
    [ReportStatus.CLOSED]: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const labels = {
    [ReportStatus.NEW]: 'جديد',
    [ReportStatus.ASSIGNED]: 'تم التعيين',
    [ReportStatus.IN_PROGRESS]: 'قيد التنفيذ',
    [ReportStatus.PENDING_PARTS]: 'بانتظار قطع',
    [ReportStatus.COMPLETED]: 'مكتمل',
    [ReportStatus.CLOSED]: 'مغلق',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: ReportPriority }> = ({ priority }) => {
    const styles = {
      [ReportPriority.LOW]: 'text-slate-400',
      [ReportPriority.NORMAL]: 'text-blue-400',
      [ReportPriority.HIGH]: 'text-orange-400',
      [ReportPriority.CRITICAL]: 'text-red-500 animate-pulse font-bold',
    };

    const labels = {
        [ReportPriority.LOW]: 'منخفض',
        [ReportPriority.NORMAL]: 'عادي',
        [ReportPriority.HIGH]: 'عالي',
        [ReportPriority.CRITICAL]: 'حرج جداً',
      };
  
    return (
      <span className={`flex items-center gap-1 ${styles[priority]}`}>
        {priority === ReportPriority.CRITICAL && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
        {labels[priority]}
      </span>
    );
  };