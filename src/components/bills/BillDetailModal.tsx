'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Receipt,
  User,
  CreditCard,
  Copy,
  Check,
  Tag,
  Clock,
  FileText,
  DollarSign,
  Phone,
  UserCheck,
  Download,
  Share2,
  Plus,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';
import { downloadBillPDF, shareBillPDF } from '@/lib/pdf-generator';

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  notes?: any;
};

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  unit?: string | null;
};

type BillItem = {
  id: string;
  productId: string;
  quantity: number;
  sellingPricePerUnit: number;
  costPricePerUnit: number;
  taxRateApplied?: number | null;
  lineTotal: number;
  product?: Product | null;
};

type Payment = {
  id: string;
  amount: number;
  method: string;
  paidAt: string;
  note?: string | null;
  recorder?: { id: string; name: string; email: string } | null;
};

type FullBillDetails = {
  id: string;
  storeId: string;
  billNumber: string;
  gstInvoiceNumber?: string | null;
  customerId?: string | null;
  createdBy: string;
  subtotal: number;
  discountType?: 'flat' | 'percentage' | null;
  discountAmount: number;
  taxApplied: boolean;
  taxAmount: number;
  totalPayable: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  createdAt: string;
  customer?: Customer | null;
  creator?: { id: string; name: string; email: string } | null;
  items?: BillItem[];
  payments?: Payment[];
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Paid' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Partially Paid' },
  due: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Unpaid / Due' },
  partially_refunded: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', label: 'Partially Refunded' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300', label: 'Refunded' },
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card / POS',
  net_banking: 'Net Banking',
  store_credit: 'Store Credit',
};

interface BillDetailModalProps {
  billId: string | null;
  onClose: () => void;
  onPaymentRecorded?: () => void;
}

export function BillDetailModal({ billId, onClose, onPaymentRecorded }: BillDetailModalProps) {
  const [bill, setBill] = useState<FullBillDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSharingPDF, setIsSharingPDF] = useState(false);

  // Payment Recording State
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [recordingPayment, setRecordingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Delete Bill State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!billId) {
      setBill(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/api/sales/bills/${billId}`);
        setBill(data);
        if (data && data.amountDue > 0) {
          setPaymentAmount(data.amountDue.toString());
        }
      } catch (err: any) {
        console.error('Failed to load bill details', err);
        setError(err.message || 'Failed to fetch bill details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [billId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) setShowDeleteConfirm(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showDeleteConfirm]);

  if (!billId) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const formatCurrency = (val?: number | null) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const statusStyle = bill ? STATUS_STYLES[bill.status] || STATUS_STYLES.due : STATUS_STYLES.due;

  const handleDownloadPDF = async () => {
    if (!bill) return;
    setIsDownloadingPDF(true);
    try {
      await downloadBillPDF(bill);
    } catch (err) {
      console.error('Failed to download PDF', err);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleSharePDF = async () => {
    if (!bill) return;
    setIsSharingPDF(true);
    try {
      await shareBillPDF(bill);
    } catch (err) {
      console.error('Failed to share PDF', err);
    } finally {
      setIsSharingPDF(false);
    }
  };

  const handleToggleRecordPayment = () => {
    if (!showRecordPayment && bill) {
      setPaymentAmount(bill.amountDue.toString());
      setPaymentError(null);
    }
    setShowRecordPayment(!showRecordPayment);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill) return;

    const amt = Number(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid positive payment amount');
      return;
    }

    if (amt > bill.amountDue + 0.01) {
      setPaymentError(`Payment amount (₹${amt}) cannot exceed remaining balance due of ₹${bill.amountDue.toFixed(2)}`);
      return;
    }

    setRecordingPayment(true);
    setPaymentError(null);
    setPaymentSuccessMsg(null);

    try {
      await apiFetch(`/api/sales/bills/${bill.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          method: paymentMethod,
          note: paymentNote,
        }),
      });

      setPaymentSuccessMsg(`Successfully recorded payment of ₹${amt.toLocaleString('en-IN')}!`);
      setShowRecordPayment(false);
      setPaymentNote('');

      // Refresh bill details
      const updatedBill = await apiFetch(`/api/sales/bills/${bill.id}`);
      setBill(updatedBill);
      if (updatedBill && updatedBill.amountDue > 0) {
        setPaymentAmount(updatedBill.amountDue.toString());
      }

      // Notify parent page
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
    } catch (err: any) {
      console.error('Failed to record payment', err);
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteBillSubmit = async () => {
    if (!bill) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/sales/bills/${bill.id}`, {
        method: 'DELETE',
      });
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to delete bill', err);
      setDeleteError(err.message || 'Failed to delete bill');
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50/60 space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            {/* Top Row: Icon + Title + Status Badge + Mobile Close button */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 sm:p-2.5 bg-[var(--color-brand-50)] text-[var(--color-brand-600)] rounded-xl border border-[var(--color-brand-100)] shrink-0">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {loading ? 'Loading Bill...' : bill?.billNumber || 'Bill Details'}
                    </h2>
                    {bill && (
                      <span
                        className={`px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                    )}
                  </div>
                  <p className="hidden sm:block text-xs text-gray-500 mt-0.5">
                    Full transaction manifest & breakdown
                  </p>
                </div>
              </div>

              {/* Close button on Mobile top-right */}
              <button
                onClick={onClose}
                className="sm:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Action Buttons (Below title on Mobile, Right side on Desktop) */}
            {bill && (
              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t border-gray-200/50 sm:border-t-0 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Record Payment Button */}
                  {bill.amountDue > 0 && (
                    <button
                      onClick={handleToggleRecordPayment}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}

                  {/* Share PDF Button: Mobile devices */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSharePDF}
                    disabled={isSharingPDF || isDownloadingPDF}
                    className="flex sm:hidden items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </Button>

                  {/* Download PDF Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    disabled={isDownloadingPDF || isSharingPDF}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border-[var(--color-brand-200)] hover:bg-[var(--color-brand-100)] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isDownloadingPDF ? 'Downloading...' : 'PDF'}</span>
                  </Button>

                  {/* Delete Bill Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </Button>
                </div>

                {/* Close button on Desktop top-right */}
                <button
                  onClick={onClose}
                  className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-3 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Fetching complete bill data...</span>
              </div>
            ) : error ? (
              <div className="py-16 text-center text-red-600 space-y-3">
                <div className="p-3 bg-red-50 rounded-full inline-block">
                  <X className="w-8 h-8" />
                </div>
                <p className="font-semibold text-base">{error}</p>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : bill ? (
              <>
                {/* Payment Success Toast Banner */}
                {paymentSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{paymentSuccessMsg}</span>
                    </div>
                    <button
                      onClick={() => setPaymentSuccessMsg(null)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Collapsible Record Payment Form */}
                <AnimatePresence>
                  {showRecordPayment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-200/70">
                          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                            <Plus className="w-4 h-4 text-emerald-700" />
                            Record Installment Payment for {bill.billNumber}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setShowRecordPayment(false)}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        {paymentError && (
                          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                            {paymentError}
                          </div>
                        )}

                        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Payment Amount */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-emerald-950">
                                Payment Amount (₹) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                max={bill.amountDue}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                              />
                              <div className="flex gap-1.5 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => setPaymentAmount(bill.amountDue.toString())}
                                  className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer"
                                >
                                  Pay Full Due ({formatCurrency(bill.amountDue)})
                                </button>
                                {bill.amountDue > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setPaymentAmount((bill.amountDue / 2).toFixed(2))}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer"
                                  >
                                    Pay Half ({formatCurrency(bill.amountDue / 2)})
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-emerald-950">
                                Payment Method <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                              >
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="card">Card / POS</option>
                                <option value="net_banking">Net Banking</option>
                                <option value="store_credit">Store Credit</option>
                              </select>
                            </div>
                          </div>

                          {/* Payment Note / Reference */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-emerald-950">
                              Payment Note / Reference # <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <input
                              type="text"
                              value={paymentNote}
                              onChange={(e) => setPaymentNote(e.target.value)}
                              placeholder="e.g. UPI Txn Ref #123456 or Cheque No."
                              className="w-full px-3.5 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                            />
                          </div>

                          {/* Submit Actions */}
                          <div className="pt-2 flex items-center justify-end gap-2 border-t border-emerald-200/70">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRecordPayment(false)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={recordingPayment}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                            >
                              {recordingPayment
                                ? 'Recording Payment...'
                                : `Confirm Payment of ${formatCurrency(Number(paymentAmount || 0))}`}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Meta Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1: Bill Identity */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      Invoice Identifiers
                    </span>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Bill ID:</span>
                        <div className="flex items-center gap-1">
                          <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700 font-mono">
                            {bill.id.slice(0, 8)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(bill.id)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"
                            title="Copy Full ID"
                          >
                            {copiedId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Bill No:</span>
                        <span className="font-mono font-medium text-gray-900">{bill.billNumber}</span>
                      </div>

                      {bill.gstInvoiceNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">GST Invoice:</span>
                          <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-xs border border-emerald-200">
                            {bill.gstInvoiceNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Date & Creator */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      Date & Biller Info
                    </span>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Date & Time:</span>
                        <span className="font-medium text-gray-900 text-xs">
                          {formatDate(bill.createdAt)}{' '}
                          <span className="text-gray-400">({formatTime(bill.createdAt)})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Created By:</span>
                        <span className="font-medium text-gray-900 text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          {bill.creator?.name || 'Store Biller'}
                        </span>
                      </div>

                      {bill.creator?.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">Staff Email:</span>
                          <span className="text-xs text-gray-600 truncate max-w-[150px]">
                            {bill.creator.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Customer Info */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      Customer Details
                    </span>
                    <div className="space-y-1.5 text-sm">
                      {bill.customer ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">Name:</span>
                            <span className="font-semibold text-gray-900">{bill.customer.name}</span>
                          </div>
                          {bill.customer.phone ? (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-xs">Phone:</span>
                              <span className="text-xs text-gray-700 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-gray-400" />
                                {bill.customer.phone}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 text-xs">Phone:</span>
                              <span className="text-xs text-gray-400 italic">Not provided</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="pt-2 text-center text-gray-500">
                          <span className="text-sm font-medium italic">Walk-in Customer</span>
                          <p className="text-[11px] text-gray-400 mt-0.5">No registered customer attached</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Manifest Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[var(--color-brand-600)]" />
                      Billed Items ({bill.items?.length || 0})
                    </h3>
                  </div>

                  {/* MOBILE: Card rows */}
                  <div className="sm:hidden space-y-2">
                    {bill.items && bill.items.length > 0 ? (
                      bill.items.map((item, idx) => (
                        <div key={item.id || `item-${idx}`} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-gray-400 font-semibold mb-0.5">#{idx + 1}</div>
                            <div className="font-semibold text-sm text-gray-900 leading-tight">
                              {item.product?.name || `Product ID: ${item.productId.slice(0, 8)}...`}
                            </div>
                            {(item.product?.sku || item.product?.unit) && (
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                {item.product?.sku && <span>SKU: {item.product.sku}</span>}
                                {item.product?.sku && item.product?.unit && <span> • </span>}
                                {item.product?.unit && <span>Unit: {item.product.unit}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="text-gray-500">Qty: <span className="font-bold text-gray-800">{item.quantity}</span></span>
                              <span className="text-gray-500">@ <span className="font-mono font-medium">{formatCurrency(item.sellingPricePerUnit)}</span></span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-gray-400 font-semibold mb-0.5">Total</div>
                            <div className="font-mono font-bold text-gray-900">{formatCurrency(item.lineTotal)}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm">No items recorded.</div>
                    )}
                  </div>

                  {/* DESKTOP: Full table */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 uppercase text-[10px] text-gray-500 font-semibold tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3 text-center">Qty</th>
                          <th className="px-4 py-3 text-right">Selling Price</th>
                          <th className="px-4 py-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {bill.items && bill.items.length > 0 ? (
                          bill.items.map((item, idx) => (
                            <tr key={item.id || `item-${idx}`} className="hover:bg-gray-50/70 transition-colors">
                              <td className="px-4 py-3 text-gray-400 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 font-semibold text-gray-900">
                                <div>{item.product?.name || `Product ID: ${item.productId.slice(0, 8)}...`}</div>
                                {(item.product?.sku || item.product?.unit) && (
                                  <div className="text-[11px] font-normal text-gray-400 mt-0.5">
                                    {item.product?.sku && <span>SKU: {item.product.sku}</span>}
                                    {item.product?.sku && item.product?.unit && <span> • </span>}
                                    {item.product?.unit && <span>Unit: {item.product.unit}</span>}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-bold text-gray-800 bg-gray-50/50">{item.quantity}</td>
                              <td className="px-4 py-3 text-right font-mono text-gray-900 font-medium">{formatCurrency(item.sellingPricePerUnit)}</td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No line items recorded on this bill.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary & Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                  {/* Left Column: Payment History & Notes */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        Payment Transactions ({bill.payments?.length || 0})
                      </h3>
                      {bill.amountDue > 0 && (
                        <button
                          onClick={handleToggleRecordPayment}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Record Payment
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {bill.payments && bill.payments.length > 0 ? (
                        bill.payments.map((pmt, idx) => (
                          <div
                            key={pmt.id || `pmt-${idx}`}
                            className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between text-xs hover:border-emerald-300 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded uppercase tracking-wider text-[10px] border border-emerald-200">
                                  {METHOD_LABELS[pmt.method] || pmt.method}
                                </span>
                                <span className="text-gray-400 font-mono text-[11px]">
                                  {formatDate(pmt.paidAt)} {formatTime(pmt.paidAt)}
                                </span>
                              </div>
                              {pmt.recorder && (
                                <p className="text-[11px] text-gray-500">
                                  Recorded by:{' '}
                                  <span className="font-medium text-gray-700">{pmt.recorder.name}</span>
                                </p>
                              )}
                              {pmt.note && (
                                <p className="text-[11px] text-gray-600 italic">"{pmt.note}"</p>
                              )}
                            </div>
                            <div className="text-right font-mono text-sm font-bold text-emerald-700">
                              +{formatCurrency(pmt.amount)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                          No payments recorded yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Financial Math Box */}
                  <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-200/80 flex items-center justify-between">
                      <span>Financial Statement</span>
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Items Subtotal</span>
                        <span className="font-mono font-medium text-gray-900">
                          {formatCurrency(bill.subtotal)}
                        </span>
                      </div>

                      {bill.discountAmount > 0 && (
                        <div className="flex justify-between text-amber-700">
                          <span>
                            Discount{' '}
                            {bill.discountType === 'percentage'
                              ? `(${bill.discountAmount}%)`
                              : '(Flat)'}
                          </span>
                          <span className="font-mono font-medium">
                            -{formatCurrency(bill.discountAmount)}
                          </span>
                        </div>
                      )}

                      {bill.taxApplied && (
                        <div className="flex justify-between text-gray-600">
                          <span>Taxes & Levies</span>
                          <span className="font-mono font-medium text-gray-900">
                            +{formatCurrency(bill.taxAmount)}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-bold text-sm text-gray-900">
                        <span>Total Payable</span>
                        <span className="font-mono text-base text-gray-900">
                          {formatCurrency(bill.totalPayable)}
                        </span>
                      </div>

                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Total Amount Paid</span>
                        <span className="font-mono">{formatCurrency(bill.amountPaid)}</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                        <span className="font-bold text-gray-800">Remaining Balance / Due</span>
                        <span
                          className={`font-mono font-bold text-sm ${
                            Number(bill.amountDue) > 0 ? 'text-red-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(bill.amountDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Delete Bill {bill?.billNumber}?</h3>
                  <p className="text-[11px] text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Are you sure? Item stock will be restored and recorded payments will be reversed.
              </p>

              {deleteError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDeleteBillSubmit}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  {isDeleting ? 'Deleting Bill...' : 'Yes, Delete Bill'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
