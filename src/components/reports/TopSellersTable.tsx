'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Award, TrendingUp, Package } from 'lucide-react';

type ProductPerformance = {
  id: string;
  name: string;
  sku?: string | null;
  unit: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
  margin: number;
};

interface TopSellersTableProps {
  topSelling: ProductPerformance[];
  mostProfitable: ProductPerformance[];
}

export function TopSellersTable({ topSelling, mostProfitable }: TopSellersTableProps) {
  const [tab, setTab] = useState<'units' | 'profit'>('units');

  const products = tab === 'units' ? topSelling : mostProfitable;

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="shadow-xs border-gray-200 bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Product Performance Rankings</h3>
              <p className="text-[11px] text-gray-500">Highest volume sellers & highest profit generators</p>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200 self-start sm:self-auto">
            <button
              onClick={() => setTab('units')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'units'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Top Selling (Qty)
            </button>
            <button
              onClick={() => setTab('profit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                tab === 'profit'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Most Profitable (₹)
            </button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
            <Package className="w-8 h-8 opacity-20" />
            <span>No sales recorded in this period</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[520px]">
              <thead className="bg-gray-50 uppercase text-[10px] text-gray-500 font-semibold tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Product Name</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-center">Units Sold</th>
                  <th className="px-3 py-2.5 text-right">Revenue</th>
                  <th className="px-3 py-2.5 text-right">Net Profit</th>
                  <th className="px-3 py-2.5 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-3 py-3 font-bold text-gray-400">
                      {idx === 0 ? (
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                          3
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </td>
                    <td className="px-3 py-3 font-bold text-gray-900">
                      <div>{p.name}</div>
                      {p.sku && <div className="text-[10px] text-gray-400 font-mono font-normal">SKU: {p.sku}</div>}
                    </td>
                    <td className="px-3 py-3 text-gray-600 font-medium">
                      <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-[10px]">
                        {p.categoryName}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold font-mono text-gray-900">
                      {p.unitsSold} {p.unit}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-gray-900">
                      {formatCurrency(p.revenue)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(p.profit)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          p.margin >= 20
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.margin > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {p.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
