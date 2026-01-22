'use client';

import { useState } from 'react';
import { X, Calendar, DollarSign, Star, Users, Copy } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language/LanguageProvider';
import { ProgramDto } from '@/types/program';

interface ProgramDetailsModalProps {
  isOpen: boolean;
  program: ProgramDto | null;
  onClose: () => void;
  onCopyCode: (code: string) => void;
}

export default function ProgramDetailsModal({ isOpen, program, onClose, onCopyCode }: ProgramDetailsModalProps) {
  const { t } = useLanguage();
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !program) return null;

  const coverImageUrl = program.coverImageUrl || '';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {program.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Training Videos with Code */}
          {program.trainingVideoUrls && program.trainingVideoUrls.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t.trainingVideos || 'Training Videos'} ({program.trainingVideoUrls.length})
                </h3>
                {/* Code Badge */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Артикул:</span>
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                    {program.code}
                  </code>
                  <button
                    onClick={() => onCopyCode(program.code)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title={t.copy}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {program.trainingVideoUrls.map((videoUrl, index) => (
                  <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full max-h-[300px] object-contain"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      Video {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price and Stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="text-lg font-semibold">{program.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">({program.totalReviews})</span>
              </div>
              {/* Purchases */}
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Users className="w-5 h-5" />
                <span className="text-sm">{program.totalPurchases} {t.purchases}</span>
              </div>
              {/* Date */}
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(program.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {/* Price */}
            <div className="flex items-center gap-1 text-2xl font-bold text-green-600 dark:text-green-400">
              <DollarSign className="w-7 h-7" />
              <span>{program.price}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t.description}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {program.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
