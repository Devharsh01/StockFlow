'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudUpload,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';
import Link from 'next/link';

interface BackupPromptModalProps {
  statusData: any;
  onBackupCompleted: () => void;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function BackupPromptModal({ statusData, onBackupCompleted }: BackupPromptModalProps) {
  const [openModal, setOpenModal] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [resultMessage, setResultMessage] = useState<any>(null);

  const lastBackupAt = statusData?.lastBackupAt;
  const isOverdue = !lastBackupAt || Date.now() - new Date(lastBackupAt).getTime() > ONE_DAY_MS;

  useEffect(() => {
    // Show modal if backup is overdue AND user hasn't dismissed it in current session
    if (isOverdue) {
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('dismissed_backup_prompt') : null;
      if (!dismissed) {
        setOpenModal(true);
      }
    } else {
      setOpenModal(false);
    }
  }, [isOverdue]);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dismissed_backup_prompt', 'true');
    }
    setOpenModal(false);
  };

  const handleExecuteBackup = async () => {
    setBackingUp(true);
    setResultMessage(null);
    try {
      const res = await apiFetch('/api/admin/backup', { method: 'POST' });
      setResultMessage(res);
      if (res.success) {
        onBackupCompleted();
        setTimeout(() => {
          setOpenModal(false);
        }, 2500);
      }
    } catch (err: any) {
      console.error('Modal Backup Error:', err);
      setResultMessage({
        success: false,
        message: err?.message || 'Failed to trigger backup.',
      });
    } finally {
      setBackingUp(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Never (First Backup Required)';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${statusData?.spreadsheetId || '1zrRStm74e2lf1cD_rv90FyBlDkmbIsywFih_vRaMGWc'}/edit`;

  return (
    <>
      {/* 1. TOP DASHBOARD WIDGET (ONLY SHOWN WHEN OVERDUE) */}
      {isOverdue && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-5 rounded-3xl bg-amber-50/90 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-950">
                  Google Sheets Backup Recommended
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                  &gt; 24 Hours Overdue
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Last Backup: <span className="font-semibold">{formatDate(lastBackupAt)}</span>. Append your latest bills & consignments now.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link href="/dashboard/backup">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-white hover:bg-amber-100/60 border-amber-300 text-amber-900 font-semibold cursor-pointer"
              >
                View History
              </Button>
            </Link>

            <Button
              onClick={handleExecuteBackup}
              disabled={backingUp}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer px-4"
            >
              {backingUp ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Backing up...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  Backup Now
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* 2. OVERDUE BACKUP PROMPT MODAL DIALOG BOX */}
      <AnimatePresence>
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-sm">
                    <CloudUpload className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Backup Due Reminder
                    </h3>
                    <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      More than 1 day since last backup
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  It has been over 24 hours since your store's data was last backed up to Google Sheets. Syncing your latest sales bills and stock-in consignments ensures your cloud records are always up to date.
                </p>

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Backup Time:</span>
                    <span className="font-mono font-bold text-amber-900">{formatDate(lastBackupAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Google Sheet:</span>
                    <a
                      href={spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      View Sheet <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Result Toast inside Modal */}
                {resultMessage && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                      resultMessage.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    {resultMessage.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{resultMessage.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Remind Me Later
                </Button>

                <Button
                  onClick={handleExecuteBackup}
                  disabled={backingUp}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md px-4"
                >
                  {backingUp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Appending Data...
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-4 h-4" />
                      Backup Now
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
