'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';

interface ReportKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  theme?: 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'indigo' | 'slate';
  badgeText?: string;
}

export function ReportKpiCard({
  title,
  value,
  subtitle,
  icon,
  theme = 'emerald',
  badgeText,
}: ReportKpiCardProps) {
  const themeStyles = {
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      valueColor: 'text-emerald-700',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600 border-blue-100',
      valueColor: 'text-blue-700',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    purple: {
      bgIcon: 'bg-purple-50 text-purple-600 border-purple-100',
      valueColor: 'text-purple-700',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600 border-amber-100',
      valueColor: 'text-amber-700',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    rose: {
      bgIcon: 'bg-rose-50 text-rose-600 border-rose-100',
      valueColor: 'text-rose-700',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    indigo: {
      bgIcon: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      valueColor: 'text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    slate: {
      bgIcon: 'bg-gray-100 text-gray-700 border-gray-200',
      valueColor: 'text-gray-900',
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
    },
  }[theme];

  return (
    <Card className="shadow-xs hover:shadow-md transition-shadow border-gray-200/80 bg-white rounded-2xl">
      <CardContent className="p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 tracking-tight">{title}</span>
          <div className={`p-2 rounded-xl border ${themeStyles.bgIcon}`}>{icon}</div>
        </div>

        <div className="flex items-baseline justify-between gap-2 pt-1">
          <div className={`text-xl sm:text-2xl font-bold font-mono ${themeStyles.valueColor}`}>
            {value}
          </div>

          {badgeText && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${themeStyles.badge}`}>
              {badgeText}
            </span>
          )}
        </div>

        {subtitle && <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
