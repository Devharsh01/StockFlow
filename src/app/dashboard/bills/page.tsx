'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ArrowUpDown, ArrowUp, ArrowDown, Search, X, SlidersHorizontal, Calendar, Eye, ChevronRight, PackageMinus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api-client';
import { BillDetailModal } from '@/components/bills/BillDetailModal';

type Customer = { id: string; name: string; phone?: string };
type Bill = {
  id: string;
  billNumber: string;
  totalPayable: number;
  amountPaid: number;
  amountDue: number;
  subtotal: number;
  discountAmount: number;
  status: string;
  createdAt: string;
  customer: Customer | null;
};

type SortKey = 'createdAt' | 'billNumber' | 'customerName' | 'totalPayable' | 'amountPaid' | 'amountDue' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_OPTIONS = ['paid', 'partial', 'due'] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Paid' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Partial' },
  due: { bg: 'bg-red-50', text: 'text-red-700', label: 'Due' },
  partially_refunded: { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Partially Refunded' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Refunded' },
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterBillId, setFilterBillId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBills();
    fetchCustomers();
  }, []);

  const fetchBills = async () => {
    try {
      const data = await apiFetch('/api/sales/bills');
      setBills(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiFetch('/api/sales/customers');
      setCustomers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const hasActiveFilters = filterBillId || filterDateFrom || filterDateTo || filterCustomer || filterAmountMin || filterAmountMax || filterStatuses.size > 0;

  const clearAllFilters = () => {
    setFilterBillId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterCustomer('');
    setFilterAmountMin('');
    setFilterAmountMax('');
    setFilterStatuses(new Set());
  };

  const toggleStatus = (status: string) => {
    setFilterStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // Filter + Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...bills];

    // Apply filters
    if (filterBillId.trim()) {
      const q = filterBillId.trim().toLowerCase();
      result = result.filter(b => b.billNumber.toLowerCase().includes(q));
    }
    if (filterDateFrom) {
      const from = new Date(filterDateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(b => new Date(b.createdAt) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(b => new Date(b.createdAt) <= to);
    }
    if (filterCustomer.trim()) {
      const q = filterCustomer.trim().toLowerCase();
      result = result.filter(b =>
        b.customer?.name?.toLowerCase().includes(q) ?? false
      );
    }
    if (filterAmountMin) {
      const min = Number(filterAmountMin);
      if (!isNaN(min)) result = result.filter(b => Number(b.totalPayable) >= min);
    }
    if (filterAmountMax) {
      const max = Number(filterAmountMax);
      if (!isNaN(max)) result = result.filter(b => Number(b.totalPayable) <= max);
    }
    if (filterStatuses.size > 0) {
      result = result.filter(b => filterStatuses.has(b.status));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'createdAt':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'billNumber':
          cmp = a.billNumber.localeCompare(b.billNumber);
          break;
        case 'customerName':
          cmp = (a.customer?.name || 'Walk-in').localeCompare(b.customer?.name || 'Walk-in');
          break;
        case 'totalPayable':
          cmp = Number(a.totalPayable) - Number(b.totalPayable);
          break;
        case 'amountPaid':
          cmp = Number(a.amountPaid) - Number(b.amountPaid);
          break;
        case 'amountDue':
          cmp = Number(a.amountDue) - Number(b.amountDue);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [bills, sortKey, sortDir, filterBillId, filterDateFrom, filterDateTo, filterCustomer, filterAmountMin, filterAmountMax, filterStatuses]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-70 transition-opacity" />;
    }
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-[var(--color-brand-600)]" />
      : <ArrowDown className="w-3.5 h-3.5 text-[var(--color-brand-600)]" />;
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return '₹0.00';
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--color-brand-50)] text-[var(--color-brand-600)] rounded-lg">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
              Bills
            </h1>
            <p className="text-sm text-[var(--color-app-muted)]">
              {loading ? 'Loading...' : `${filteredAndSorted.length} bill${filteredAndSorted.length !== 1 ? 's' : ''}`}
              {hasActiveFilters && bills.length !== filteredAndSorted.length ? ` of ${bills.length} total` : ''}
              <span className="ml-2 text-xs text-[var(--color-brand-600)] font-medium hidden sm:inline">• Click any bill to view complete details</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-[var(--color-brand-500)] text-white rounded-full leading-none">
                !
              </span>
            )}
          </Button>

          <Link href="/dashboard/outbound">
            <Button size="sm" className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
              <PackageMinus className="w-4 h-4" />
              Record Stock Out
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-5 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                  {/* Bill ID / Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-app-muted)] flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" />
                      Bill ID / Ref No
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. BILL-172..."
                      value={filterBillId}
                      onChange={e => setFilterBillId(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Customer Filter Dropdown */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-app-muted)] flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5" />
                      Customer
                    </label>
                    <select
                      value={filterCustomer}
                      onChange={e => setFilterCustomer(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-[var(--color-app-border)] bg-white text-xs font-medium text-[var(--color-app-text)] focus:ring-2 focus:ring-[var(--color-brand-500)] outline-none cursor-pointer"
                    >
                      <option value="">All Customers</option>
                      {customers.map(cust => (
                        <option key={cust.id} value={cust.name}>
                          {cust.name} {cust.phone ? `(${cust.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range - Spans 2 columns */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-app-muted)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={filterDateFrom}
                        onChange={e => setFilterDateFrom(e.target.value)}
                        className="text-xs"
                        placeholder="From"
                      />
                      <Input
                        type="date"
                        value={filterDateTo}
                        onChange={e => setFilterDateTo(e.target.value)}
                        className="text-xs"
                        placeholder="To"
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-app-muted)]">
                      Amount Range (₹)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={filterAmountMin}
                        onChange={e => setFilterAmountMin(e.target.value)}
                        placeholder="Min"
                        className="text-xs"
                        min="0"
                      />
                      <Input
                        type="number"
                        value={filterAmountMax}
                        onChange={e => setFilterAmountMax(e.target.value)}
                        placeholder="Max"
                        className="text-xs"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Status Filter - Spans 2 columns */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-app-muted)]">
                      Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map(status => {
                        const style = STATUS_STYLES[status];
                        const active = filterStatuses.has(status);
                        return (
                          <button
                            key={status}
                            onClick={() => toggleStatus(status)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              active
                                ? `${style.bg} ${style.text} ring-2 ring-offset-1 ring-current`
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {style.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Clear filters */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-3 border-t border-[var(--color-app-border)]">
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear all filters
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center gap-3 text-[var(--color-app-muted)]">
                <div className="w-5 h-5 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
                Loading bills...
              </div>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-[var(--color-app-muted)]">
              <Receipt className="w-12 h-12 mb-4 opacity-20" />
              {hasActiveFilters ? (
                <>
                  <p className="font-medium">No bills match your filters</p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-medium cursor-pointer"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <p className="font-medium">No bills found.</p>
                  <Link href="/dashboard/outbound" className="mt-3">
                    <Button size="sm" className="bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white font-bold text-xs cursor-pointer">
                      Record Stock Out
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              {/* MOBILE: Card list (< md) */}
              <div className="md:hidden divide-y divide-[var(--color-app-border)]">
                {filteredAndSorted.map((bill, idx) => {
                  const status = STATUS_STYLES[bill.status] || STATUS_STYLES.due;
                  return (
                    <motion.div
                      key={bill.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                      onClick={() => setSelectedBillId(bill.id)}
                      className="p-4 hover:bg-[var(--color-brand-50)]/40 active:bg-[var(--color-brand-50)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-[var(--color-app-text)] truncate">
                            {bill.customer ? bill.customer.name : <span className="italic text-[var(--color-app-muted)]">Walk-in</span>}
                          </div>
                          <div className="text-xs text-[var(--color-app-muted)] mt-0.5">
                            {formatDate(bill.createdAt)} • {formatTime(bill.createdAt)}
                          </div>
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-[var(--color-app-muted)] text-[10px] uppercase font-semibold mb-0.5">Total</div>
                          <div className="font-bold tabular-nums text-[var(--color-app-text)]">{formatCurrency(bill.totalPayable)}</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-app-muted)] text-[10px] uppercase font-semibold mb-0.5">Paid</div>
                          <div className="font-medium tabular-nums text-emerald-700">{formatCurrency(bill.amountPaid)}</div>
                        </div>
                        <div>
                          <div className="text-[var(--color-app-muted)] text-[10px] uppercase font-semibold mb-0.5">Due</div>
                          <div className={`font-bold tabular-nums ${Number(bill.amountDue) > 0 ? 'text-red-600' : 'text-[var(--color-app-muted)]'}`}>
                            {formatCurrency(bill.amountDue)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* DESKTOP: Full table (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[var(--color-app-muted)] uppercase bg-gray-50/80 border-b border-[var(--color-app-border)] sticky top-0">
                    <tr>
                      <SortableHeader column="createdAt" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} SortIcon={SortIcon} />
                      <SortableHeader column="customerName" label="Customer" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} SortIcon={SortIcon} />
                      <SortableHeader column="totalPayable" label="Total" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} SortIcon={SortIcon} align="right" />
                      <SortableHeader column="amountPaid" label="Paid" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} SortIcon={SortIcon} align="right" />
                      <SortableHeader column="amountDue" label="Due" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} SortIcon={SortIcon} align="right" />
                      <SortableHeader column="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} SortIcon={SortIcon} align="center" />
                      <th className="px-5 py-3.5 font-semibold text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-app-border)]">
                    {filteredAndSorted.map((bill, idx) => {
                      const status = STATUS_STYLES[bill.status] || STATUS_STYLES.due;
                      return (
                        <motion.tr
                          key={bill.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                          onClick={() => setSelectedBillId(bill.id)}
                          className="hover:bg-[var(--color-brand-50)]/40 transition-colors group cursor-pointer"
                        >
                          <td className="px-5 py-3.5">
                            <div className="font-medium text-[var(--color-app-text)]">{formatDate(bill.createdAt)}</div>
                            <div className="text-xs text-[var(--color-app-muted)] mt-0.5">{formatTime(bill.createdAt)}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            {bill.customer ? (
                              <div>
                                <div className="font-medium text-[var(--color-app-text)]">{bill.customer.name}</div>
                                {bill.customer.phone && (
                                  <div className="text-xs text-[var(--color-app-muted)] mt-0.5">{bill.customer.phone}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[var(--color-app-muted)] italic">Walk-in</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold text-[var(--color-app-text)] tabular-nums">
                            {formatCurrency(bill.totalPayable)}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums text-[var(--color-app-text)]">
                            {formatCurrency(bill.amountPaid)}
                          </td>
                          <td className="px-5 py-3.5 text-right tabular-nums">
                            <span className={Number(bill.amountDue) > 0 ? 'text-[var(--color-status-danger)] font-medium' : 'text-[var(--color-app-muted)]'}>
                              {formatCurrency(bill.amountDue)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1 text-xs text-[var(--color-brand-600)] font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                              View <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Bill Details Modal */}
      <BillDetailModal
        billId={selectedBillId}
        onClose={() => setSelectedBillId(null)}
        onPaymentRecorded={fetchBills}
      />
    </motion.div>
  );
}

/* Sortable table header component */
function SortableHeader({
  column,
  label,
  sortKey,
  sortDir,
  onSort,
  SortIcon,
  align = 'left',
}: {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  SortIcon: React.FC<{ column: SortKey }>;
  align?: 'left' | 'right' | 'center';
}) {
  const alignClass = align === 'right' ? 'text-right justify-end' : align === 'center' ? 'text-center justify-center' : 'text-left';
  const active = sortKey === column;

  return (
    <th
      className={`px-5 py-3.5 font-semibold cursor-pointer select-none group transition-colors hover:bg-gray-100/60 ${alignClass} ${
        active ? 'text-[var(--color-brand-600)]' : ''
      }`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1.5 ${alignClass}`}>
        {label}
        <SortIcon column={column} />
      </div>
    </th>
  );
}
