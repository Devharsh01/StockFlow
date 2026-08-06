'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudUpload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  RotateCcw,
  Check,
  Calendar,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';

export default function BackupPage() {
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchBackupStatus();
  }, []);

  const fetchBackupStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch('/api/admin/backup');
      setStatusData(res);
    } catch (err: any) {
      console.error('Failed to fetch backup status:', err);
      setErrorMsg(err?.message || 'Access Denied: Google Sheets Backup is restricted to Store Administrators only.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteBackup = async () => {
    setBackingUp(true);
    setLastResult(null);
    try {
      const res = await apiFetch('/api/admin/backup', {
        method: 'POST',
      });
      setLastResult(res);
      await fetchBackupStatus();
    } catch (err: any) {
      console.error('Backup failed:', err);
      setLastResult({
        success: false,
        message: err?.message || 'Failed to trigger Google Sheets backup.',
      });
    } finally {
      setBackingUp(false);
    }
  };

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${statusData?.spreadsheetId || '1zrRStm74e2lf1cD_rv90FyBlDkmbIsywFih_vRaMGWc'}/edit`;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Never (No Backup Taken Yet)';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (errorMsg) {
    return (
      <div className="py-16 px-4 text-center space-y-4 max-w-md mx-auto">
        <div className="inline-flex p-4 rounded-3xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500">{errorMsg}</p>
        <Link href="/dashboard">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
              Google Sheets Backup
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">Last Backup Time:</span>
              <span className="text-xs font-semibold font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {formatDate(statusData?.lastBackupAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Open Google Sheet
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>

          <Button
            onClick={handleExecuteBackup}
            disabled={backingUp || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md px-4 py-2 rounded-xl"
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
      </div>

      {/* Backup Result Toast / Notice */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 shadow-2xs ${
                lastResult.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              {lastResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm">{lastResult.message}</p>
                {lastResult.billsCount !== undefined && (
                  <p className="text-gray-600">
                    Summary: <span className="font-semibold text-gray-900">{lastResult.billsCount} bill(s)</span> and{' '}
                    <span className="font-semibold text-gray-900">{lastResult.consignmentsCount} consignment(s)</span> processed.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backup Execution Logs History Table */}
      <Card className="shadow-xs border-gray-200 bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 text-gray-700 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Backup Logs History</h3>
                <p className="text-[11px] text-gray-500">Log of all backup runs</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchBackupStatus}
              className="text-xs text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">Loading backup logs...</div>
          ) : !statusData?.history || statusData.history.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
              <Info className="w-6 h-6 opacity-30" />
              <span>No backup runs recorded yet. Click "Backup Now" above to trigger a backup.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Date & Time</th>
                    <th className="px-3.5 py-2.5">Triggered By</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 text-center">Bills Appended</th>
                    <th className="px-3.5 py-2.5 text-center">Consignments Appended</th>
                    <th className="px-3.5 py-2.5">Message / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {statusData.history.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="px-3.5 py-3 font-mono font-medium text-gray-900">
                        {formatDate(log.startedAt)}
                      </td>
                      <td className="px-3.5 py-3 font-medium text-gray-700">{log.triggeredBy}</td>
                      <td className="px-3.5 py-3">
                        {log.status === 'success' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Success
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                            Logged
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-center font-bold text-emerald-700 font-mono">
                        {log.billsCount}
                      </td>
                      <td className="px-3.5 py-3 text-center font-bold text-purple-700 font-mono">
                        {log.consignmentsCount}
                      </td>
                      <td className="px-3.5 py-3 text-gray-500 max-w-xs truncate" title={log.errorMessage || 'Completed cleanly'}>
                        {log.errorMessage || 'Synced cleanly to Google Sheets'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
