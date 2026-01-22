'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/components/language/LanguageProvider';
import { ProgramDto } from '@/types/program';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  program: ProgramDto | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export default function DeleteConfirmModal({ isOpen, program, onClose, onConfirm }: DeleteConfirmModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  if (!isOpen || !program) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(program.id);
      onClose();
    } catch (error) {
      console.error('Error deleting program:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t.deleteProgram}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {t.deleteConfirmMessage}
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {program.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            {t.deleteWarning}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            disabled={loading}
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t.loading : t.delete}
          </button>
        </div>
      </div>
    </div>
  );
}
