'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/components/language/LanguageProvider';
import { useLevel } from '@/components/level/LevelProvider';
import { ProgramDto, CreateProgramRequest, UpdateProgramRequest } from '@/types/program';
import { programsApi } from '@/lib/api/programsApi';
import ProgramCard from '@/components/trainer/programs/ProgramCard';
import CreateProgramModal from '@/components/trainer/programs/CreateProgramModal';
import EditProgramModal from '@/components/trainer/programs/EditProgramModal';
import DeleteConfirmModal from '@/components/trainer/programs/DeleteConfirmModal';
import ProgramDetailsModal from '@/components/trainer/programs/ProgramDetailsModal';

export default function TrainerProgramsPage() {
  const { t } = useLanguage();
  const { refreshLevel } = useLevel();
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramDto[]>([]);
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramDto | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  useEffect(() => {
    loadPrograms();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = programs.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms(programs);
    }
  }, [searchQuery, programs]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await programsApi.getMyPrograms();
      setPrograms(data);
      setFilteredPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
      showToast(t.programsLoadError || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async (request: CreateProgramRequest) => {
    try {
      const newProgram = await programsApi.createProgram(request);
      setPrograms([newProgram, ...programs]);
      showToast(t.programCreated || 'Program created successfully');
      // Обновляем уровень после создания программы
      await refreshLevel();
    } catch (error) {
      console.error('Error creating program:', error);
      showToast(t.programCreateError || 'Failed to create program');
      throw error;
    }
  };

  const handleUpdateProgram = async (id: string, request: UpdateProgramRequest) => {
    try {
      const updatedProgram = await programsApi.updateProgram(id, request);
      setPrograms(programs.map((p) => (p.id === id ? updatedProgram : p)));
      // Обновляем уровень после обновления программы
      await refreshLevel();
      showToast(t.programUpdated || 'Program updated successfully');
    } catch (error) {
      console.error('Error updating program:', error);
      showToast(t.programUpdateError || 'Failed to update program');
      throw error;
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      await programsApi.deleteProgram(id);
      setPrograms(programs.filter((p) => p.id !== id));
      showToast(t.programDeleted || 'Program deleted successfully');
    } catch (error) {
      console.error('Error deleting program:', error);
      showToast(t.programDeleteError || 'Failed to delete program');
      throw error;
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(t.codeCopied || 'Code copied to clipboard');
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.myPrograms || 'My Programs'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.manageProgramsDescription || 'Create and manage your training programs'}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPrograms || 'Search programs...'}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Create Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            {t.createProgram || 'Create Program'}
          </button>
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t.loading || 'Loading...'}</p>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery ? (t.noSearchResults || 'No results found') : (t.noProgramsYet || 'No programs yet')}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t.createFirstProgram || 'Create Your First Program'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onEdit={(p) => {
                  setSelectedProgram(p);
                  setEditModalOpen(true);
                }}
                onDelete={(p) => {
                  setSelectedProgram(p);
                  setDeleteModalOpen(true);
                }}
                onCopyCode={handleCopyCode}
                onView={(p) => {
                  setSelectedProgram(p);
                  setDetailsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProgramModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateProgram}
      />
      <EditProgramModal
        isOpen={editModalOpen}
        program={selectedProgram}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedProgram(null);
        }}
        onSubmit={handleUpdateProgram}
      />
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        program={selectedProgram}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProgram(null);
        }}
        onConfirm={handleDeleteProgram}
      />
      <ProgramDetailsModal
        isOpen={detailsModalOpen}
        program={selectedProgram}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedProgram(null);
        }}
        onCopyCode={handleCopyCode}
      />

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
          <CheckCircle className="w-5 h-5" />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
