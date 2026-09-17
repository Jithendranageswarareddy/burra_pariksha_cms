import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '../../design-system/components/Card';

interface StatCardProps {
  id?: string;
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  accentColor?: 'blue' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'purple' | 'cyan' | 'slate';
  onClick?: () => void;
}

const colorMap = {
  blue: 'text-blue-600 bg-blue-50 border-blue-100',
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  amber: 'text-amber-600 bg-amber-50 border-amber-100',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  rose: 'text-rose-600 bg-rose-50 border-rose-100',
  purple: 'text-purple-600 bg-purple-50 border-purple-100',
  cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  slate: 'text-slate-600 bg-slate-50 border-slate-200',
};

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = 'indigo',
  onClick,
}) => {
  return (
    <Card
      id={id || `stat-card-${(title || '').toString().toLowerCase().replace(/\s+/g, '-')}`}
      variant={onClick ? 'interactive' : 'default'}
      padding="none"
      onClick={onClick}
      className="p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg border ${colorMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-slate-600'}`}>
              {trend.label}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
