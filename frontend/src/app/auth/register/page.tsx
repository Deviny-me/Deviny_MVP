'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { useRegister, GenderType, RegisterFormData } from '@/features/auth/hooks/useRegister'
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon } from 'lucide-react'
import { COUNTRIES_DATA, formatPhoneNumber, getCitiesForCountry, getCountries, getCountryName, translateCityName } from '@/lib/data/countries'
import { useLanguage } from '@/components/language/LanguageProvider'

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('auth')
  const tr = useTranslations('auth.register')
  const { language } = useLanguage()
  
  const [role, setRole] = useState<RoleType | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Extended fields for trainer
  const [phone, setPhone] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('RU')
  const [gender, setGender] = useState<GenderType | undefined>()
  const [countryCode, setCountryCode] = useState<string>('')
  const [city, setCity] = useState('')
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Get available cities based on selected country with language-aware translations
  const availableCities = countryCode ? getCitiesForCountry(countryCode, language) : []
  const selectedCountryName = countryCode ? getCountryName(countryCode, language) : ''
  const countries = getCountries(language)

  // Get phone format and max digits for selected phone country
  const phoneCountryData = COUNTRIES_DATA[phoneCountryCode]
  const phoneFormat = phoneCountryData?.phoneFormat || 'XXX XXX XXX'
  const maxPhoneDigits = phoneCountryData?.maxDigits || 10

  const GENDERS: { value: GenderType; label: string }[] = [
    { value: 'Male', label: tr('male') },
    { value: 'Female', label: tr('female') },
  ]

  const { loading, errors, register, clearErrors } = useRegister()

  // Handle phone number input with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const digits = value.replace(/\D/g, '')
    
    // Limit to max digits for the country
    if (digits.length <= maxPhoneDigits) {
      const formatted = formatPhoneNumber(digits, phoneFormat)
      setPhone(formatted)
    }
  }

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    if (roleFromQuery && (roleFromQuery === 'user' || roleFromQuery === 'trainer' || roleFromQuery === 'nutritionist')) {
      setRole(roleFromQuery)
    } else {
      const roleFromStorage = getRole()
      if (roleFromStorage && (roleFromStorage === 'user' || roleFromStorage === 'trainer' || roleFromStorage === 'nutritionist')) {
        setRole(roleFromStorage)
      } else {
        router.push('/auth')
      }
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!role) return

    clearErrors()
    
    // Combine phone code with phone number for trainers and nutritionists
    const fullPhone = (role === 'trainer' || role === 'nutritionist') && phone 
      ? `${COUNTRIES_DATA[phoneCountryCode]?.phoneCode || ''} ${phone}`.trim()
      : phone
    
    const formData: RegisterFormData = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      termsAccepted,
      phone: fullPhone,
      gender,
      country: selectedCountryName,
      city: translateCityName(city, language),
    }

    // Add trainer and nutritionist specific fields
    if (role === 'trainer' || role === 'nutritionist') {
      formData.verificationDocument = verificationDocument || undefined
    }
    
    await register(formData, role)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      return
    }
    setVerificationDocument(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    setVerificationDocument(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    }
    return <ImageIcon className="w-8 h-8 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!role) {
    return null
  }

  const isTrainer = role === 'trainer'
  const isNutritionist = role === 'nutritionist'
  const isProfessional = isTrainer || isNutritionist

  return (
    <div className="light w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary-700 mb-2">Deviny</h1>
        <p className="text-lg text-gray-600">
          {t('tagline')}
        </p>
      </div>

      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          {isTrainer ? tr('titleTrainer') : isNutritionist ? tr('titleNutritionist') : tr('titleUser')}
        </h2>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr('firstName')}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={tr('firstNamePlaceholder')}
                disabled={loading}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr('lastName')}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={tr('lastNamePlaceholder')}
                disabled={loading}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tr('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={tr('emailPlaceholder')}
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tr('password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={tr('passwordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tr('confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={tr('confirmPasswordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Gender */}
          {isProfessional && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr('gender')}
              </label>
              <select
                value={gender || ''}
                onChange={(e) => setGender(e.target.value as GenderType || undefined)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">{tr('selectGender')}</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>
          )}

          {/* Phone - Only for professionals */}
          {isProfessional && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tr('phone')} *
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => {
                    setPhoneCountryCode(e.target.value)
                    setPhone('') // Clear phone when changing country code
                  }}
                  className={`w-32 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {COUNTRIES_DATA[c.code].phoneCode}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={phoneFormat.replace(/X/g, '9')}
                  disabled={loading}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          )}

          {/* Country and City */}
          {isProfessional && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tr('country')}
                </label>
                <select
                  value={countryCode}
                  onChange={(e) => {
                    setCountryCode(e.target.value)
                    setCity('') // Reset city when country changes
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">{tr('selectCountry')}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tr('city')}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || !countryCode}
                >
                  <option value="">{countryCode ? tr('selectCity') : tr('selectCountry')}</option>
                  {availableCities.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>
          )}

          {/* Professional-specific fields */}
          {isProfessional && (
            <>
              {/* Verification Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tr('documentLabel')}
                </label>
                
                {!verificationDocument ? (
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-primary-500 bg-primary-50' 
                        : errors.verificationDocument 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileInputChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-primary-600">{tr('selectFile')}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tr('allowedFormats')}
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(verificationDocument)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {verificationDocument.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(verificationDocument.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
                
                {errors.verificationDocument && (
                  <p className="mt-1 text-sm text-red-600">{errors.verificationDocument}</p>
                )}
              </div>
            </>
          )}

          {/* Terms */}
          <div>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className={`mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 ${
                  errors.termsAccepted ? 'border-red-500' : ''
                }`}
                disabled={loading}
              />
              <span className="text-sm text-gray-700">
                {tr('termsAccept')}{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                  {tr('termsLink')}
                </Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
            )}
          </div>

          <Button
            variant={isProfessional ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? tr('submitting') : tr('submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            {tr('hasAccount')}{' '}
            <Link
              href={`/auth/login?role=${role}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {tr('loginLink')}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="light w-full max-w-md mx-auto flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}
