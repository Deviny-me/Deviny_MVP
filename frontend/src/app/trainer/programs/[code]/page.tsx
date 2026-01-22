'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, Star, Users, Copy, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/components/language/LanguageProvider';
import { ProgramDto } from '@/types/program';
import { programsApi } from '@/lib/api/programsApi';

export default function ProgramDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [program, setProgram] = useState<ProgramDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const code = params.code as string;

  useEffect(() => {
    loadProgram();
  }, [code]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const data = await programsApi.getProgramByCode(code);
      if (data) {
        setProgram(data);
      } else {
        showToast('Program not found');
        router.push('/trainer/programs');
      }
    } catch (error) {
      console.error('Error loading program:', error);
      showToast('Failed to load program');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(program?.code || '');
    showToast(t.codeCopied || 'Code copied to clipboard');
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!program) {
    return null;
  }

  const coverImageUrl = program.coverImageUrl || '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.back || 'Back'}
        </button>

        {/* Program Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Cover Image */}
          <div className="relative h-96 bg-gray-200 dark:bg-gray-700">
            {coverImageUrl && !imageError ? (
              <Image
                src={coverImageUrl}
                alt={program.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-400 text-lg">No media</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Title and Price */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {program.title}
                </h1>
                <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(program.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{program.totalPurchases} {t.purchases || 'purchases'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-3xl font-bold text-green-600 dark:text-green-400">
                <DollarSign className="w-8 h-8" />
                <span>{program.price}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-6 h-6 fill-current" />
                <span className="text-2xl font-semibold">{program.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-500">
                ({program.totalReviews} {t.reviews || 'reviews'})
              </span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t.description || 'Description'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {program.description}
              </p>
            </div>

            {/* Code */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t.programCode || 'Program Code'}
              </h2>
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                <code className="text-lg font-mono text-gray-700 dark:text-gray-300">
                  {program.code}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {t.copy || 'Copy'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => router.push(`/trainer/programs?edit=${program.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-5 h-5" />
                {t.edit || 'Edit'}
              </button>
              <button
                onClick={() => router.push(`/trainer/programs?delete=${program.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                {t.delete || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {toast.message}
        </div>
      )}
    </div>
  );
}
