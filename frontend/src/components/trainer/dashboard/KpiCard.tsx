import React from 'react';
import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface KpiCardProps {
  title: string;
  value: string;
  delta: string; // "+18%", "+3", "-1"
  icon: LucideIcon;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, delta, icon: Icon }) => {
  const isNegative = delta.startsWith('-');
  const deltaColor = isNegative ? 'text-red-500' : 'text-green-500';
  const DeltaIcon = isNegative ? ArrowDown : ArrowUp;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${deltaColor}`}>
          <DeltaIcon className="w-4 h-4" />
          <span>{delta}</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
};
