'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Printer,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Box,
  Truck,
  AlertTriangle,
  Clock,
  CloudUpload,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiFetch } from '@/lib/api-client';
import { ReportKpiCard } from '@/components/reports/ReportKpiCard';
import { TopSellersTable } from '@/components/reports/TopSellersTable';
import { CategoryDistributionCard } from '@/components/reports/CategoryDistributionCard';
import { PaymentMethodBreakdown } from '@/components/reports/PaymentMethodBreakdown';

type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all_time'
  | 'custom';

export default function ReportsPage() {
  const [preset, setPreset] = useState<DatePreset>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const toLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Compute start/end date based on preset
  const applyPresetDates = useCallback((selectedPreset: DatePreset) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = new Date();

    switch (selectedPreset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;

      case 'this_week': {
        const day = now.getDay();
        const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diffToMon);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      }

      case 'last_7_days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'all_time':
        start = null;
        end = null;
        break;

      case 'custom':
        return;
    }

    if (start) setStartDate(toLocalDateString(start));
    else setStartDate('');

    if (end) setEndDate(toLocalDateString(end));
    else setEndDate('');
  }, []);

  useEffect(() => {
    if (preset !== 'custom') {
      applyPresetDates(preset);
    }
  }, [preset, applyPresetDates]);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const [errorMsg, setErrorMsg] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let query = '';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) query = `?${params.toString()}`;

      const res = await apiFetch(`/api/admin/reports/comprehensive${query}`);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load comprehensive report:', err);
      setErrorMsg(err?.message || 'Access Denied: Reports are restricted to Store Administrators only.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (p: DatePreset) => {
    setPreset(p);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val?: number) => {
    const num = Number(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fin = data?.financials || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto pb-12 print:max-w-none print:space-y-4"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-5 print:border-b-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 print:hidden">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-app-text)]">
              Store Reports & Analytics
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time sales, gross profit, inventory valuation, and top seller insights
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            className="flex items-center gap-1.5 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
            title="Refresh Report Data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Link href="/dashboard/backup">
            <Button
              size="sm"
              variant="outline"
              className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
              Sheets Backup
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector Toolbar */}
      <div className="p-3 md:p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mr-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Range:
          </span>

          {[
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'this_week', label: 'This Week' },
            { key: 'last_7_days', label: 'Last 7 Days' },
            { key: 'this_month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'this_year', label: 'This Year' },
            { key: 'all_time', label: 'All Time' },
            { key: 'custom', label: 'Custom Range' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handlePresetSelect(item.key as DatePreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                preset === item.key
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers */}
        {preset === 'custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t border-gray-100"
          >
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[11px] font-semibold text-gray-600">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-8 w-full"
              />
            </div>
            <span className="text-gray-400 text-xs hidden sm:block mt-4">to</span>
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-[11px] font-semibold text-gray-600">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-8 w-full"
              />
            </div>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-flex items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Generating comprehensive report analytics...</span>
          </div>
        </div>
      ) : data ? (
        <>
          {/* KPI Summary Cards Grid (7 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ReportKpiCard
              title="NET REVENUE"
              value={formatCurrency(fin.netRevenue)}
              subtitle={`Gross: ${formatCurrency(fin.grossRevenue)}`}
              icon={<DollarSign className="w-5 h-5" />}
              theme="blue"
            />

            <ReportKpiCard
              title="PROCUREMENT COST (STOCK-IN)"
              value={formatCurrency(fin.totalInboundCost)}
              subtitle={`${fin.totalInboundUnits || 0} units received from vendors`}
              icon={<Truck className="w-5 h-5" />}
              theme="rose"
            />

            <ReportKpiCard
              title="NET PROFIT"
              value={formatCurrency(fin.netProfit)}
              subtitle={`Margin: ${Number(fin.profitMargin || 0).toFixed(1)}%`}
              icon={<TrendingUp className="w-5 h-5" />}
              theme="emerald"
              badgeText={`${Number(fin.profitMargin || 0).toFixed(1)}%`}
            />

            <ReportKpiCard
              title="PROFIT MARGIN"
              value={`${Number(fin.profitMargin || 0).toFixed(2)}%`}
              subtitle="Net Profit / Revenue"
              icon={<Percent className="w-5 h-5" />}
              theme="purple"
            />

            <ReportKpiCard
              title="TOTAL BILLS / ORDERS"
              value={fin.billsCount || 0}
              subtitle={`Avg Order: ${formatCurrency(fin.averageOrderValue)}`}
              icon={<Receipt className="w-5 h-5" />}
              theme="indigo"
            />

            <ReportKpiCard
              title="AVERAGE ORDER VALUE"
              value={formatCurrency(fin.averageOrderValue)}
              subtitle="Revenue per transaction"
              icon={<Receipt className="w-5 h-5" />}
              theme="slate"
            />

            <ReportKpiCard
              title="STOCK VALUATION"
              value={formatCurrency(fin.currentStockValuation)}
              subtitle="Unsold inventory cost in stock"
              icon={<Box className="w-5 h-5" />}
              theme="amber"
            />
          </div>

          {/* Section 2: Product Performance Rankings & Category Share */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TopSellersTable
                topSelling={data.topSellingProducts || []}
                mostProfitable={data.mostProfitableProducts || []}
              />
            </div>
            <div>
              <CategoryDistributionCard categories={data.topCategories || []} />
            </div>
          </div>

          {/* Section 3: Payment Breakdown & Inventory Health Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <PaymentMethodBreakdown breakdown={data.paymentBreakdown || []} />

            {/* Low Stock Warning */}
            <Card className="shadow-xs border-red-200 bg-red-50/30 rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-red-200/60">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-950">Low Stock Alerts (≤ 5 units)</h3>
                    <p className="text-[11px] text-red-700">Items requiring immediate reordering</p>
                  </div>
                </div>

                {!data.lowStockProducts || data.lowStockProducts.length === 0 ? (
                  <div className="py-8 text-center text-emerald-700 text-xs font-semibold">
                    ✓ All active products have sufficient stock levels!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.lowStockProducts.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-white border border-red-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-900 block">{p.name}</span>
                          <span className="text-[10px] text-gray-400">Category: {p.categoryName}</span>
                        </div>
                        <span className="font-mono font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded border border-red-200">
                          {p.currentStockQty} left
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slow Moving Stock */}
            <Card className="shadow-xs border-amber-200 bg-amber-50/30 rounded-2xl overflow-hidden">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-amber-200/60">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">Slow-Moving Stock Alerts</h3>
                    <p className="text-[11px] text-amber-700">Items in stock with 0 sales in selected period</p>
                  </div>
                </div>

                {!data.slowMovingProducts || data.slowMovingProducts.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    No slow-moving products in this date range.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.slowMovingProducts.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-900 block">{p.name}</span>
                          <span className="text-[10px] text-gray-400">Price: {formatCurrency(p.sellingPrice)}</span>
                        </div>
                        <span className="font-mono font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                          {p.currentStockQty} in stock (0 sold)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : errorMsg ? (
        <div className="py-16 px-4 text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{errorMsg}</p>
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      ) : (
        <div className="py-16 text-center text-gray-400">Failed to load report analytics</div>
      )}
    </motion.div>
  );
}
