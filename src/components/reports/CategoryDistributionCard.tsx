'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { PieChart, Layers } from 'lucide-react';

type CategoryPerformance = {
  id: string;
  name: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  margin: number;
};

interface CategoryDistributionCardProps {
  categories: CategoryPerformance[];
}

export function CategoryDistributionCard({ categories }: CategoryDistributionCardProps) {
  const totalRevenue = categories.reduce((acc, c) => acc + c.revenue, 0);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card className="shadow-xs border-gray-200 bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Category Share & Revenue</h3>
            <p className="text-[11px] text-gray-500">Sales distribution across product categories</p>
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
            <Layers className="w-8 h-8 opacity-20" />
            <span>No category data available</span>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.slice(0, 6).map((cat) => {
              const sharePercent = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={cat.id} className="space-y-1.5 p-2.5 rounded-xl bg-gray-50/70 border border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900">{cat.name}</span>
                    <span className="font-mono font-bold text-purple-700">{formatCurrency(cat.revenue)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(4, sharePercent))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5">
                    <span>
                      {cat.unitsSold} units sold ({sharePercent.toFixed(1)}% share)
                    </span>
                    <span className="font-semibold text-emerald-700">Profit: {formatCurrency(cat.profit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
