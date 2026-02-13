import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const isOnline = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex justify-center p-4 pointer-events-none"
        >
          <div className="bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-100 px-6 py-3 rounded-full shadow-[0_10px_30px_rgba(220,38,38,0.2)] flex items-center gap-3 pointer-events-auto">
            <div className="bg-red-500 p-2 rounded-full animate-pulse">
              <WifiOff size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm">انقطع الاتصال بالإنترنت</span>
              <span className="text-[10px] text-red-200">أنت تعمل الآن في وضع الأوفلاين. سيتم حفظ البيانات محلياً.</span>
            </div>
            <RefreshCw size={14} className="text-red-400 animate-spin opacity-50 ml-2" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};