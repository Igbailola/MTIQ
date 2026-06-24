'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type KPIVariant = 'blue' | 'green' | 'amber';

interface KPICardProps {
  title: string;
  value: string | number;
  label: string;
  icon: LucideIcon;
  variant?: KPIVariant;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

const variantStyles: Record<KPIVariant, { card: string; icon: string; iconBg: string; trend: string }> = {
  blue: {
    card: 'border-blue-100/5 bg-blue-50/30',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100/50 border-blue-200/5',
    trend: 'text-blue-600',
  },
  green: {
    card: 'border-emerald-100/5 bg-emerald-50/30',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100/50 border-emerald-200/5',
    trend: 'text-emerald-600',
  },
  amber: {
    card: 'border-amber-100/5 bg-amber-50/30',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100/50 border-amber-200/5',
    trend: 'text-amber-600',
  },
};

export function KPICard({ title, value, label, icon: Icon, variant = 'blue', trend, className }: KPICardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn('border shadow-meetiq-xs h-[110px] sm:h-[140px]', styles.card, className)}>
      <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6 pb-3 sm:pb-6 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase font-body truncate block">
              {title}
            </span>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body truncate">{label}</p>
          </div>

          <div className={cn('h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-lg border flex items-center justify-center', styles.iconBg, styles.icon)}>
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>

        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-primary font-heading">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold flex items-center',
                trend.isPositive ? styles.trend : 'text-red-500'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
