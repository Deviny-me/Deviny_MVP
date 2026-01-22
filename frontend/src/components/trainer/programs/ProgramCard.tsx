'use client';

import { ProgramDto } from '@/types/program';
import { Star, Copy, Edit, Trash2, DollarSign, Users } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useLanguage } from '@/components/language/LanguageProvider';

interface ProgramCardProps {
  program: ProgramDto;
  onEdit: (program: ProgramDto) => void;
  onDelete: (program: ProgramDto) => void;
  onCopyCode: (code: string) => void;
  onView: (program: ProgramDto) => void;
}

export default function ProgramCard({ program, onEdit, onDelete, onCopyCode, onView }: ProgramCardProps) {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);

  const coverImageUrl = program.coverImageUrl || '';

  const handleCardClick = (e: React.MouseEvent) => {
    // Проверяем, что клик не был по кнопкам управления
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onView(program);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
        {coverImageUrl && !imageError ? (
          <Image
            src={coverImageUrl}
            alt={program.title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-400">No cover image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
          {program.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {program.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium">{program.averageRating.toFixed(1)}</span>
            <span className="text-gray-500">({program.totalReviews})</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span>{program.totalPurchases}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
            <DollarSign className="w-4 h-4" />
            <span>{program.price}</span>
          </div>
        </div>

        {/* Code */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded px-3 py-2">
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
              {program.code}
            </code>
            <button
              onClick={() => onCopyCode(program.code)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title={t.copyCode}
            >
              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(program)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t.edit}
          </button>
          <button
            onClick={() => onDelete(program)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
