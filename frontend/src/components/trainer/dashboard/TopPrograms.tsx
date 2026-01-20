import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { TopProgramItem } from '@/lib/trainer/mock/dashboard';

interface TopProgramsProps {
  programs: TopProgramItem[];
  isLoading?: boolean;
}

export const TopPrograms: React.FC<TopProgramsProps> = ({ programs, isLoading = false }) => {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Топ программы</h2>
        <div className="space-y-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Топ программы</h2>
        <p className="text-gray-500 text-center py-8">Нет данных</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Топ программы</h2>
      <div className="space-y-3 mb-4">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-gray-900 mb-1">{program.title}</p>
              <p className="text-sm text-gray-500">{program.salesText}</p>
            </div>
            <div className="text-blue-600 font-semibold">{program.amount}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push('/trainer/programs')}
        className="w-full text-center text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors"
      >
        Смотреть все программы
      </button>
    </Card>
  );
};
