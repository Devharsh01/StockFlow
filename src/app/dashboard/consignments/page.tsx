'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  SlidersHorizontal,
  Calendar,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PackagePlus,
  Truck,
  Box,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';
import { ConsignmentDetailModal } from '@/components/consignments/ConsignmentDetailModal';

type ConsignmentGroup = {
  id: string;
  consignmentNumber: string;
  batchType: string;
  supplierName: string;
  entryDate: string;
  settled: boolean;
  creator?: {
    id: string;
    name: string;
  } | null;
  items: any[];
  totalQuantity: number;
  totalValue: number;
};

type SortKey = 'entryDate' | 'consignmentNumber' | 'supplierName' | 'itemsCount' | 'totalQuantity' | 'totalValue';
type SortDir = 'asc' | 'desc';

export default function ConsignmentsPage() {
  const [consignments, setConsignments] = useState<ConsignmentGroup[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsignmentId, setSelectedConsignmentId] = useState<string | null>(null);

  // Sort State
  const [sortKey, setSortKey] = useState<SortKey>('entryDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filterConsignmentId, setFilterConsignmentId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterBatchType, setFilterBatchType] = useState<string>('');

  useEffect(() => {
    fetchConsignments();
    fetchSuppliersList();
  }, []);

  const fetchConsignments = async () => {
    try {
      const data = await apiFetch('/api/inventory/consignments');
      setConsignments(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliersList = async () => {
    try {
      const data = await apiFetch('/api/inventory/suppliers/search?q=a');
      if (Array.isArray(data)) {
        setSuppliers(data.map((s: any) => s.label));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const hasActiveFilters =
    filterConsignmentId || filterDateFrom || filterDateTo || filterSupplier || filterAmountMin || filterAmountMax || filterBatchType;

  const clearAllFilters = () => {
    setFilterConsignmentId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSupplier('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setFilterBatchType('');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // Filter + Sort Logic
  const filteredAndSorted = useMemo(() => {
    let result = [...consignments];

    if (filterConsignmentId.trim()) {
      const q = filterConsignmentId.trim().toLowerCase();
      result = result.filter((c) => c.consignmentNumber.toLowerCase().includes(q));
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((c) => new Date(c.entryDate) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((c) => new Date(c.entryDate) <= to);
    }
    if (filterSupplier) {
      result = result.filter((c) =>
        (c.supplierName || 'Direct Stock In').toLowerCase().includes(filterSupplier.toLowerCase())
      );
    }
    if (filterBatchType) {
      result = result.filter((c) => c.batchType === filterBatchType);
    }
    if (filterAmountMin) {
      const min = Number(filterAmountMin);
      if (!isNaN(min)) result = result.filter((c) => c.totalValue >= min);
    }
    if (filterAmountMax) {
      const max = Number(filterAmountMax);
      if (!isNaN(max)) result = result.filter((c) => c.totalValue <= max);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'entryDate':
          cmp = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
          break;
        case 'consignmentNumber':
          cmp = a.consignmentNumber.localeCompare(b.consignmentNumber);
          break;
        case 'supplierName':
          cmp = (a.supplierName || 'Direct Stock In').localeCompare(b.supplierName || 'Direct Stock In');
          break;
        case 'itemsCount':
          cmp = (a.items?.length || 0) - (b.items?.length || 0);
          break;
        case 'totalQuantity':
          cmp = a.totalQuantity - b.totalQuantity;
          break;
        case 'totalValue':
          cmp = a.totalValue - b.totalValue;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [
    consignments,
    filterConsignmentId,
    filterDateFrom,
    filterDateTo,
    filterSupplier,
    filterBatchType,
    filterAmountMin,
    filterAmountMax,
    sortKey,
    sortDir,
  ]);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-600" />
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
              Consignments
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              View, search, and manage multi-product inbound stock batches and supplier consignments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-xs cursor-pointer ${
              hasActiveFilters ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : ''
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
          </Button>

          <Link href="/dashboard/inbound">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
              <PackagePlus className="w-4 h-4" />
              Record Stock In
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Drawer / Expandable Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-emerald-200 bg-emerald-50/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                    Consignment Filters
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* Consignment Ref No */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-gray-400" /> Consignment Ref No
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. CNS-172..."
                      value={filterConsignmentId}
                      onChange={(e) => setFilterConsignmentId(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Supplier Filter Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-gray-400" /> Supplier Name
                    </label>
                    <select
                      value={filterSupplier}
                      onChange={(e) => setFilterSupplier(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-xs font-medium text-[var(--color-app-text)] focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer"
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map((sup, idx) => (
                        <option key={idx} value={sup}>
                          {sup}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range - Spans 2 columns */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Search className="w-3.5 h-3.5 text-gray-400" /> Batch Total Range (₹)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filterAmountMin}
                        onChange={(e) => setFilterAmountMin(e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filterAmountMax}
                        onChange={(e) => setFilterAmountMax(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Batch Type Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-gray-400" /> Batch Type
                    </label>
                    <select
                      value={filterBatchType}
                      onChange={(e) => setFilterBatchType(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-xs font-medium text-[var(--color-app-text)] focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer"
                    >
                      <option value="">All Batch Types</option>
                      <option value="purchase">Purchase Batch</option>
                      <option value="auto_correction">Stock Correction</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table Card */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-flex items-center gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading consignments...</span>
              </div>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Layers className="w-12 h-12 mb-3 opacity-20" />
              {hasActiveFilters ? (
                <>
                  <p className="font-medium text-sm text-gray-600">No consignments match your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium text-sm text-gray-600">No consignments recorded yet</p>
                  <Link href="/dashboard/inbound" className="mt-3">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer">
                      Record Stock In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE: Card rows (< md) */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredAndSorted.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConsignmentId(c.id)}
                    className="p-4 hover:bg-emerald-50/40 active:bg-emerald-50/60 transition-colors cursor-pointer"
                  >
                    {/* Top row: supplier + badge */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-sm text-gray-900 truncate">{c.supplierName || 'Direct Stock In'}</span>
                        </div>
                        {c.creator && (
                          <p className="text-[11px] text-gray-400 mt-0.5 ml-5">By: {c.creator.name}</p>
                        )}
                      </div>
                      <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold">
                        {c.items?.length || 1} {(c.items?.length || 1) === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                    {/* Bottom row: date + stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Date</div>
                        <div className="font-medium text-gray-700">{formatDate(c.entryDate)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Units</div>
                        <div className="font-bold font-mono text-gray-900">{c.totalQuantity} pcs</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Value</div>
                        <div className="font-bold font-mono text-emerald-700">{formatCurrency(c.totalValue)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP: Full sortable table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 uppercase text-[10px] text-gray-500 font-semibold tracking-wider border-b border-gray-200">
                    <tr>
                      <th
                        onClick={() => handleSort('entryDate')}
                        className="px-4 py-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Entry Date</span>
                          <SortIcon column="entryDate" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('supplierName')}
                        className="px-4 py-3.5 cursor-pointer hover:bg-gray-100/70 transition-colors group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Supplier Name</span>
                          <SortIcon column="supplierName" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('itemsCount')}
                        className="px-4 py-3.5 text-center cursor-pointer hover:bg-gray-100/70 transition-colors group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Products</span>
                          <SortIcon column="itemsCount" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('totalQuantity')}
                        className="px-4 py-3.5 text-center cursor-pointer hover:bg-gray-100/70 transition-colors group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Total Units</span>
                          <SortIcon column="totalQuantity" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('totalValue')}
                        className="px-4 py-3.5 text-right cursor-pointer hover:bg-gray-100/70 transition-colors group"
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <span>Consignment Value</span>
                          <SortIcon column="totalValue" />
                        </div>
                      </th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAndSorted.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedConsignmentId(c.id)}
                        className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3.5 font-medium text-gray-900">
                          <div>{formatDate(c.entryDate)}</div>
                          <div className="text-[11px] text-gray-400 font-normal">{formatTime(c.entryDate)}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-900">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{c.supplierName}</span>
                          </div>
                          {c.creator && (
                            <span className="text-[11px] font-normal text-gray-400 block mt-0.5">
                              By: {c.creator.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-gray-800">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs">
                            {c.items?.length || 1} {c.items?.length === 1 ? 'Product' : 'Products'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-gray-900 font-mono">
                          {c.totalQuantity} pcs
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                          {formatCurrency(c.totalValue)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConsignmentId(c.id);
                            }}
                            className="text-xs flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 cursor-pointer ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Consignment Detail Modal */}
      <ConsignmentDetailModal
        consignmentId={selectedConsignmentId}
        onClose={() => setSelectedConsignmentId(null)}
        onConsignmentDeleted={fetchConsignments}
      />
    </div>
  );
}
