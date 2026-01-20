'use client'

import { Card } from '@/components/ui/Card'
import { CertificateDto } from '@/types/trainerProfile'
import { useLanguage } from '@/components/language/LanguageProvider'
import { Award, Plus, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadCertificate, deleteCertificate } from '@/lib/api/trainerProfileApi'

interface CertificatesCardProps {
  certificates: CertificateDto[]
  onCertificateAdded?: () => void
}

export function CertificatesCard({ certificates, onCertificateAdded }: CertificatesCardProps) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddCertificate = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    
    try {
      for (const file of Array.from(files)) {
        // Extract title from filename (without extension)
        const title = file.name.replace(/\.[^/.]+$/, '')
        const currentYear = new Date().getFullYear()
        
        await uploadCertificate(title, '', currentYear, file)
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Notify parent to reload profile
      if (onCertificateAdded) {
        onCertificateAdded()
      }
    } catch (error) {
      console.error('Failed to upload certificate:', error)
      alert('Ошибка при загрузке сертификата. Попробуйте снова.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteCertificate = async (certificateId: string) => {
    setDeletingId(certificateId)
    
    try {
      await deleteCertificate(certificateId)
      
      // Notify parent to reload profile
      if (onCertificateAdded) {
        onCertificateAdded()
      }
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      alert('Ошибка при удалении сертификата. Попробуйте снова.')
    } finally {
      setDeletingId(null)
    }
  }

  if (certificates.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-4">
          {t.certificates}
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Award className="w-12 h-12 text-gray-400 dark:text-neutral-600 mb-3" />
          <p className="text-gray-600 dark:text-neutral-400 mb-4">
            {t.noCertificates}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <button 
            onClick={handleAddCertificate}
            disabled={isUploading}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {t.addCertificate}
              </>
            )}
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-50">
          {t.certificates}
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
        <button
          onClick={handleAddCertificate}
          disabled={isUploading}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Добавить
            </>
          )}
        </button>
      </div>
      <div className="space-y-3">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-neutral-50 mb-1">
                  {cert.fileName || cert.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-neutral-400">
                  {[cert.issuer, cert.year].filter(Boolean).join(' • ')}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {cert.fileUrl && (
                  <a
                    href={`http://localhost:5000${cert.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Открыть файл"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDeleteCertificate(cert.id)}
                  disabled={deletingId === cert.id}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Удалить сертификат"
                >
                  {deletingId === cert.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
