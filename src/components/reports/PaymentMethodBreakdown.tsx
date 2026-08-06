'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { CreditCard, Wallet, QrCode, Building2, AlertCircle } from 'lucide-react';

type PaymentMode = {
  method: string;
  amount: number;
  count: number;
  percentage: number;
};

interface PaymentMethodBreakdownProps {
  breakdown: PaymentMode[];
}

export function PaymentMethodBreakdown({ breakdown }: PaymentMethodBreakdownProps) {
  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMethodMeta = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return { label: 'Cash Payment', icon: Wallet, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'upi':
        return { label: 'UPI / QR Code', icon: QrCode, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'card':
        return { label: 'Credit / Debit Card', icon: CreditCard, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'net_banking':
        return { label: 'Net Banking', icon: Building2, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'due':
        return { label: 'Store Credit / Due', icon: AlertCircle, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: method, icon: Wallet, color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  return (
    <Card className="shadow-xs border-gray-200 bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Payment Collection Breakdown</h3>
            <p className="text-[11px] text-gray-500">Distribution by payment modes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {breakdown.map((item) => {
            const meta = getMethodMeta(item.method);
            const Icon = meta.icon;
            return (
              <div
                key={item.method}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${meta.color}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-lg shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{meta.label}</span>
                    <span className="text-[10px] opacity-75">{item.count} transaction(s)</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold block">{formatCurrency(item.amount)}</span>
                  <span className="text-[10px] opacity-75 font-medium">{item.percentage.toFixed(1)}% share</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
