'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Video, Trash2 } from 'lucide-react';
import { useLanguage } from '@/components/language/LanguageProvider';
import { ProgramDto, UpdateProgramRequest } from '@/types/program';

interface EditProgramModalProps {
  isOpen: boolean;
  program: ProgramDto | null;
  onClose: () => void;
  onSubmit: (id: string, request: UpdateProgramRequest) => Promise<void>;
}

export default function EditProgramModal({ isOpen, program, onClose, onSubmit }: EditProgramModalProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [trainingVideos, setTrainingVideos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videosInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (program) {
      setTitle(program.title);
      setDescription(program.description);
      setPrice(program.price.toString());
      setCoverPreview(program.coverImageUrl);
      setCoverImage(null);
      setTrainingVideos([]);
    }
  }, [program]);

  if (!isOpen || !program) return null;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t.invalidImageType);
      return;
    }

    // Validate file size
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t.imageTooLarge);
      return;
    }

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleVideosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate each file
    for (const file of files) {
      if (!file.type.startsWith('video/')) {
        alert(t.invalidVideoType);
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert(t.videoTooLarge);
        return;
      }
    }

    setTrainingVideos(prev => [...prev, ...files]);
  };

  const removeCover = () => {
    setCoverImage(null);
    setCoverPreview(program?.coverImageUrl || null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const removeVideo = (index: number) => {
    setTrainingVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const request: UpdateProgramRequest = {
        title,
        description,
        price: parseFloat(price),
      };

      if (coverImage) {
        request.coverImage = coverImage;
      }
      
      if (trainingVideos.length > 0) {
        request.trainingVideos = trainingVideos;
      }

      await onSubmit(program.id, request);
      handleClose();
    } catch (error) {
      console.error('Error updating program:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCoverImage(null);
    setCoverPreview(null);
    setTrainingVideos([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t.editProgram}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.title}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.description}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={2000}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.price}
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Current Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.currentCoverImage || 'Current Cover Image'}
            </label>
            {coverPreview && (
              <div className="mb-4">
                <img src={coverPreview} alt="Current cover" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Replace Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.replaceCoverImage || 'Replace Cover Image (optional)'}
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
            {!coverImage ? (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon className="w-5 h-5" />
                <span>{t.uploadNewCover || 'Upload New Cover'}</span>
              </button>
            ) : (
              <div className="relative">
                <img 
                  src={coverPreview!} 
                  alt="New cover preview" 
                  className="w-full h-48 object-cover rounded-lg" 
                />
                <button
                  type="button"
                  onClick={removeCover}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Replace Training Videos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.replaceTrainingVideos || 'Add/Replace Training Videos (optional)'}
            </label>
            <input
              ref={videosInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideosChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => videosInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              <span>{t.uploadNewVideos || 'Upload New Videos'}</span>
            </button>

            {/* Videos List */}
            {trainingVideos.length > 0 && (
              <div className="mt-4 space-y-2">
                {trainingVideos.map((video, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {video.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              disabled={loading}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t.loading : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
