'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Layers,
  Clock,
  UserCheck,
  Tag,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Box,
  Truck,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';

type ConsignmentItem = {
  id: string;
  productId: string;
  quantity: number;
  remainingQty: number;
  costPricePerUnit: number;
  lineTotal: number;
  product?: {
    id: string;
    name: string;
    sku?: string | null;
    unit: string;
    sellingPrice: number;
    currentStockQty: number;
    category?: { id: string; name: string } | null;
  } | null;
};

type FullConsignmentDetails = {
  id: string;
  consignmentNumber: string;
  batchType: string;
  supplierName?: string | null;
  entryDate: string;
  settled: boolean;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
  items: ConsignmentItem[];
  totalQuantity: number;
  totalValue: number;
};

interface ConsignmentDetailModalProps {
  consignmentId: string | null;
  onClose: () => void;
  onConsignmentDeleted?: () => void;
}

export function ConsignmentDetailModal({
  consignmentId,
  onClose,
  onConsignmentDeleted,
}: ConsignmentDetailModalProps) {
  const [consignment, setConsignment] = useState<FullConsignmentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Delete State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!consignmentId) {
      setConsignment(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/api/inventory/consignments/${consignmentId}`);
        setConsignment(data);
      } catch (err: any) {
        console.error('Failed to load consignment details', err);
        setError(err.message || 'Failed to fetch consignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [consignmentId]);

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

  if (!consignmentId) return null;

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

  const handleDeleteSubmit = async () => {
    if (!consignment) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch(`/api/inventory/consignments/${consignment.id}`, {
        method: 'DELETE',
      });
      if (onConsignmentDeleted) {
        onConsignmentDeleted();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to delete consignment', err);
      setDeleteError(err.message || 'Failed to delete consignment');
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
                <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {loading ? 'Loading Consignment...' : consignment?.consignmentNumber || 'Consignment Details'}
                    </h2>
                    {consignment && (
                      <span
                        className={`px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full border ${
                          consignment.batchType === 'purchase'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {consignment.batchType === 'purchase' ? 'Purchase Batch' : 'Stock Correction'}
                      </span>
                    )}
                  </div>
                  <p className="hidden sm:block text-xs text-gray-500 mt-0.5">
                    Inbound batch inventory record & product manifest
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
            <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t border-gray-200/50 sm:border-t-0">
              <div className="flex items-center gap-2">
                {consignment && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border-red-200 hover:bg-red-100 cursor-pointer"
                    title="Delete Consignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Batch</span>
                  </Button>
                )}
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
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Fetching consignment data...</span>
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
            ) : consignment ? (
              <>
                {/* Meta Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Batch Identity */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-gray-500" />
                      Batch Reference
                    </span>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Ref No:</span>
                        <div className="flex items-center gap-1">
                          <code className="text-[11px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-700 font-mono">
                            {consignment.consignmentNumber}
                          </code>
                          <button
                            onClick={() => copyToClipboard(consignment.consignmentNumber)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors cursor-pointer"
                            title="Copy Ref No"
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
                        <span className="text-gray-500 text-xs">Status:</span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                            consignment.settled
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {consignment.settled ? 'Fully Consumed' : 'Active Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Date & Creator */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      Entry & Staff Info
                    </span>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Entry Date:</span>
                        <span className="font-medium text-gray-900 text-xs">
                          {formatDate(consignment.entryDate)}{' '}
                          <span className="text-gray-400">({formatTime(consignment.entryDate)})</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">Recorded By:</span>
                        <span className="font-medium text-gray-900 text-xs flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          {consignment.creator?.name || 'Staff Biller'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Vendor / Supplier Details */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-gray-500" />
                      Supplier / Vendor
                    </span>
                    <div className="space-y-1.5 text-sm pt-1">
                      <span className="font-semibold text-gray-900 text-sm block">
                        {consignment.supplierName || 'Direct Stock In'}
                      </span>
                      <span className="text-[11px] text-gray-400 block">
                        {consignment.supplierName ? 'Registered Vendor Entry' : 'Direct Stock Inward'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Manifest Table */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    Consignment Products ({consignment.items?.length || 0})
                  </h3>

                  {/* MOBILE: Card rows */}
                  <div className="sm:hidden space-y-2">
                    {consignment.items && consignment.items.length > 0 ? (
                      consignment.items.map((item, idx) => (
                        <div key={item.id} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-gray-400 font-semibold mb-0.5">#{idx + 1}</div>
                            <div className="font-semibold text-sm text-gray-900 leading-tight">
                              {item.product?.name || `Product Item #${idx + 1}`}
                            </div>
                            {item.product?.category && (
                              <div className="text-[11px] text-gray-400 mt-0.5">Category: {item.product.category.name}</div>
                            )}
                            {item.product?.sku && (
                              <div className="text-[11px] font-mono text-gray-400 mt-0.5">SKU: {item.product.sku}</div>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="text-gray-500">Batch Qty: <span className="font-bold text-gray-800">{item.quantity} {item.product?.unit || 'pcs'}</span></span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[10px] text-gray-400 font-semibold mb-0.5">Subtotal</div>
                            <div className="font-mono font-bold text-emerald-700">{formatCurrency(item.lineTotal)}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5 font-mono">{formatCurrency(item.costPricePerUnit)}/unit</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm">No products recorded.</div>
                    )}
                  </div>

                  {/* DESKTOP: Full table */}
                  <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 uppercase text-[10px] text-gray-500 font-semibold tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3">#</th>
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3 text-center">Batch Qty</th>
                          <th className="px-4 py-3 text-right">Cost / Unit</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {consignment.items && consignment.items.length > 0 ? (
                          consignment.items.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                              <td className="px-4 py-3.5 text-gray-400 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3.5 font-bold text-gray-900">
                                {item.product?.name || `Product Item #${idx + 1}`}
                                {item.product?.category && (
                                  <span className="block text-[11px] font-normal text-gray-400 mt-0.5">
                                    Category: {item.product.category.name}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-gray-600">{item.product?.sku || 'N/A'}</td>
                              <td className="px-4 py-3.5 text-center font-bold text-gray-900 bg-gray-50/50">
                                {item.quantity} {item.product?.unit || 'pcs'}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-medium text-gray-900">
                                {formatCurrency(item.costPricePerUnit)}
                              </td>
                              <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                                {formatCurrency(item.lineTotal)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                              No products recorded in this consignment batch.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Statement Card */}
                <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Consignment Valuation
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Total {consignment.totalQuantity} units received across {consignment.items?.length || 0} product line(s)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Total Consignment Value</span>
                    <span className="text-xl font-bold font-mono text-emerald-700">
                      {formatCurrency(consignment.totalValue)}
                    </span>
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
                  <h3 className="font-bold text-gray-900 text-sm">
                    Delete Consignment {consignment?.consignmentNumber}?
                  </h3>
                  <p className="text-[11px] text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-xs text-gray-600">
                Are you sure? Unsold stock for all products in this consignment batch will be deducted from product inventory.
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
                  onClick={handleDeleteSubmit}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                >
                  {isDeleting ? 'Deleting Batch...' : 'Yes, Delete Consignment'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
