'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackagePlus, ShoppingCart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BackupPromptModal } from '@/components/backup/BackupPromptModal';
import { apiFetch } from '@/lib/api-client';

export default function DashboardHome() {
  const [backupStatus, setBackupStatus] = useState<any>(null);

  const fetchBackupStatus = async () => {
    try {
      const res = await apiFetch('/api/admin/backup');
      setBackupStatus(res);
    } catch (err) {
      console.error('Failed to fetch backup status on dashboard:', err);
    }
  };

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  return (
    <div className="h-full flex flex-col justify-center max-w-5xl mx-auto space-y-6 md:space-y-8 py-4">
      {/* Dynamic Overdue Backup Prompt Banner Widget & Modal Dialog */}
      {backupStatus && (
        <BackupPromptModal
          statusData={backupStatus}
          onBackupCompleted={fetchBackupStatus}
        />
      )}

      <div className="text-center space-y-2 mb-4 md:mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--color-app-text)]"
        >
          What would you like to do?
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-[var(--color-app-muted)] text-base md:text-lg"
        >
          Select an operational flow below to begin.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* INBOUND CARD */}
        <Link href="/dashboard/inbound" className="group block">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="h-full p-6 md:p-8 rounded-3xl bg-white border border-[var(--color-app-border)] shadow-[var(--shadow-premium)] hover:shadow-[var(--shadow-premium-hover)] transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <PackagePlus className="w-32 h-32" />
            </div>
            
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <PackagePlus className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-[var(--color-app-text)] mb-3">
              Inbound (Stock In)
            </h2>
            <p className="text-[var(--color-app-muted)] text-base mb-8 max-w-sm">
              Receive new shipments, record purchases, and keep your inventory up to date.
            </p>

            <div className="flex items-center text-emerald-600 font-medium">
              Start receiving
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>

        {/* OUTBOUND CARD */}
        <Link href="/dashboard/outbound" className="group block">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full p-6 md:p-8 rounded-3xl bg-[var(--color-brand-500)] border border-transparent shadow-[var(--shadow-premium)] hover:shadow-xl hover:shadow-[var(--color-brand-500)]/20 transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingCart className="w-32 h-32 text-white" />
            </div>
            
            <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <ShoppingCart className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3">
              Outbound (POS)
            </h2>
            <p className="text-white/80 text-base mb-8 max-w-sm">
              Check out customers, consume FIFO stock, apply discounts, and generate bills.
            </p>

            <div className="flex items-center text-white font-medium">
              Start billing
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
