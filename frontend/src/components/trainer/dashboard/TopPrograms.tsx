import React from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { TopProgramItem } from '@/lib/trainer/mock/dashboard';
import { useLanguage } from '@/components/language/LanguageProvider';
import { Copy } from 'lucide-react';

interface TopProgramsProps {
  programs: TopProgramItem[];
  isLoading?: boolean;
  onProgramClick?: (programId: string) => void;
  onCopyCode?: (code: string) => void;
}

export const TopPrograms: React.FC<TopProgramsProps> = ({ 
  programs, 
  isLoading = false, 
  onProgramClick,
  onCopyCode 
}) => {
  const router = useRouter();
  const { t } = useLanguage();

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    if (onCopyCode) {
      onCopyCode(code);
    } else {
      navigator.clipboard.writeText(code);
    }
  };

  const handleProgramClick = (programId: string) => {
    if (onProgramClick) {
      onProgramClick(programId);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.topPrograms}</h2>
        <div className="space-y-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (programs.length === 0) {
    return (
      <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.topPrograms}</h2>
        <p className="text-gray-500 dark:text-neutral-400 text-center py-8">{t.noPrograms || 'Нет данных'}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-4">{t.topPrograms}</h2>
      <div className="space-y-3 mb-4">
        {programs.map((program) => (
          <div
            key={program.id}
            onClick={() => handleProgramClick(program.id)}
            className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-neutral-50 mb-1 truncate">{program.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-gray-500 dark:text-neutral-400">{program.salesText}</p>
                <span className="text-gray-300 dark:text-neutral-600">•</span>
                <div className="flex items-center gap-1.5 group">
                  <span className="text-xs text-gray-500 dark:text-neutral-400">Артикул:</span>
                  <code className="text-xs font-mono text-gray-700 dark:text-neutral-300 bg-gray-200 dark:bg-neutral-600 px-1.5 py-0.5 rounded">
                    {program.code}
                  </code>
                  <button
                    onClick={(e) => handleCopyCode(e, program.code)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded transition-all opacity-60 hover:opacity-100"
                    title={t.copy || 'Копировать'}
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-600 dark:text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
            <div className="text-blue-600 dark:text-blue-400 font-semibold ml-4">{program.amount}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => router.push('/trainer/programs')}
        className="w-full text-center text-blue-600 dark:text-blue-400 font-medium text-sm hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        {t.viewAllPrograms || 'Смотреть все программы'}
      </button>
    </Card>
  );
};
