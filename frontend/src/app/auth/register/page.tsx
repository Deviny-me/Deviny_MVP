'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { useRegister, GenderType, RegisterFormData } from '@/features/auth/hooks/useRegister'
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon, User, Dumbbell, Apple, ArrowLeft } from 'lucide-react'
import { COUNTRIES_DATA, formatPhoneNumber, getCitiesForCountry, getCountries, getCountryName, translateCityName } from '@/lib/data/countries'
import { Spinner } from '@/components/ui/Spinner'
import { useLanguage } from '@/components/language/LanguageProvider'
import { cn } from '@/lib/utils/cn'

const roleConfig = {
  user:         { icon: User,     iconBg: 'bg-user-100',         iconColor: 'text-user-600' },
  trainer:      { icon: Dumbbell, iconBg: 'bg-trainer-100',      iconColor: 'text-trainer-600' },
  nutritionist: { icon: Apple,    iconBg: 'bg-nutritionist-100', iconColor: 'text-nutritionist-600' },
}

const inputBase = 'w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 transition-all hover:border-gray-600 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent'
const inputOk = 'border-gray-900 focus:ring-primary-500'
const inputErr = 'border-red-400 focus:ring-red-500'
const selectBase = 'w-full px-4 py-3 rounded-xl border bg-white text-gray-900 transition-all hover:border-gray-600 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent appearance-none'

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
  
  const [phone, setPhone] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('RU')
  const [gender, setGender] = useState<GenderType | undefined>()
  const [countryCode, setCountryCode] = useState<string>('')
  const [city, setCity] = useState('')
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const availableCities = countryCode ? getCitiesForCountry(countryCode, language) : []
  const selectedCountryName = countryCode ? getCountryName(countryCode, language) : ''
  const countries = getCountries(language)

  const phoneCountryData = COUNTRIES_DATA[phoneCountryCode]
  const phoneFormat = phoneCountryData?.phoneFormat || 'XXX XXX XXX'
  const maxPhoneDigits = phoneCountryData?.maxDigits || 10

  const GENDERS: { value: GenderType; label: string }[] = [
    { value: 'Male', label: tr('male') },
    { value: 'Female', label: tr('female') },
  ]

  const { loading, errors, register, clearErrors } = useRegister()

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const digits = value.replace(/\D/g, '')
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
    if (!allowedTypes.includes(file.type)) return
    if (file.size > 10 * 1024 * 1024) return
    setVerificationDocument(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const removeFile = () => {
    setVerificationDocument(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return <FileText className="w-7 h-7 text-red-500" />
    return <ImageIcon className="w-7 h-7 text-blue-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (!role) return null

  const isTrainer = role === 'trainer'
  const isNutritionist = role === 'nutritionist'
  const isProfessional = isTrainer || isNutritionist
  const cfg = roleConfig[role]
  const Icon = cfg.icon

  return (
    <div className="w-full max-w-xl mx-auto py-4">
      {/* Back button */}
      <Link
        href={`/auth/login?role=${role}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-all group mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {tr('backToLogin')}
      </Link>

      {/* Role badge */}
      <div className="flex flex-col items-center mb-6">
        <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-3', cfg.iconBg)}>
          <Icon className={cn('w-7 h-7', cfg.iconColor)} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isTrainer ? tr('titleTrainer') : isNutritionist ? tr('titleNutritionist') : tr('titleUser')}
        </h2>
      </div>

      {/* Form card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-amber-100/20 border border-amber-200/30 p-6 sm:p-8">
        {errors.general && (
          <div className="mb-5 flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Personal info */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tr('personalInfo')}</p>

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={cn(inputBase, errors.firstName ? inputErr : inputOk)}
                placeholder={tr('firstNamePlaceholder')}
                disabled={loading}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={cn(inputBase, errors.lastName ? inputErr : inputOk)}
                placeholder={tr('lastNamePlaceholder')}
                disabled={loading}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(inputBase, errors.email ? inputErr : inputOk)}
              placeholder={tr('emailPlaceholder')}
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(inputBase, 'pr-12', errors.password ? inputErr : inputOk)}
                placeholder={tr('passwordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('confirmPassword')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={cn(inputBase, 'pr-12', errors.confirmPassword ? inputErr : inputOk)}
                placeholder={tr('confirmPasswordPlaceholder')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Professional fields */}
          {isProfessional && (
            <>
              <div className="border-t border-amber-200/20 pt-5 mt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">{tr('professionalInfo')}</p>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('gender')}</label>
                <select
                  value={gender || ''}
                  onChange={(e) => setGender(e.target.value as GenderType || undefined)}
                  className={cn(selectBase, errors.gender ? inputErr : inputOk)}
                  disabled={loading}
                >
                  <option value="">{tr('selectGender')}</option>
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('phone')} *</label>
                <div className="flex gap-2">
                  <select
                    value={phoneCountryCode}
                    onChange={(e) => { setPhoneCountryCode(e.target.value); setPhone('') }}
                    className={cn(selectBase, 'w-28 flex-shrink-0', errors.phone ? inputErr : inputOk)}
                    disabled={loading}
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{COUNTRIES_DATA[c.code].phoneCode}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={cn(inputBase, 'flex-1', errors.phone ? inputErr : inputOk)}
                    placeholder={phoneFormat.replace(/X/g, '9')}
                    disabled={loading}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              {/* Location */}
              <div className="border-t border-amber-200/20 pt-5 mt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">{tr('locationInfo')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('country')}</label>
                  <select
                    value={countryCode}
                    onChange={(e) => { setCountryCode(e.target.value); setCity('') }}
                    className={cn(selectBase, errors.country ? inputErr : inputOk)}
                    disabled={loading}
                  >
                    <option value="">{tr('selectCountry')}</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('city')}</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={cn(selectBase, errors.city ? inputErr : inputOk)}
                    disabled={loading || !countryCode}
                  >
                    <option value="">{countryCode ? tr('selectCity') : tr('selectCountry')}</option>
                    {availableCities.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
              </div>

              {/* Document upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{tr('documentLabel')}</label>
                
                {!verificationDocument ? (
                  <div
                    className={cn(
                      'relative border-2 border-dashed rounded-xl p-6 text-center transition-all',
                      dragActive
                        ? 'border-primary-500 bg-primary-50'
                        : errors.verificationDocument
                          ? 'border-red-400 bg-red-50/50'
                          : 'border-amber-200/40 hover:border-amber-300/50 bg-amber-50/30'
                    )}
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
                    <div className="w-12 h-12 rounded-xl bg-amber-100/50 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-primary-600">{tr('selectFile')}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{tr('allowedFormats')}</p>
                  </div>
                ) : (
                  <div className="border border-amber-200/30 rounded-xl p-4 bg-amber-50/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {getFileIcon(verificationDocument)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{verificationDocument.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(verificationDocument.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
                        disabled={loading}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
                
                {errors.verificationDocument && <p className="mt-1 text-sm text-red-600">{errors.verificationDocument}</p>}
              </div>
            </>
          )}

          {/* Terms */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => !loading && setTermsAccepted(!termsAccepted)}
                className={cn(
                  'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer',
                  termsAccepted
                    ? 'bg-primary-500 border-primary-500'
                    : errors.termsAccepted ? 'border-red-500 bg-white' : 'border-gray-400 bg-white'
                )}
              >
                {termsAccepted && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600 leading-relaxed">
                {tr('termsAccept')}{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2">
                  {tr('termsLink')}
                </Link>
              </span>
            </label>
            {errors.termsAccepted && <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>}
          </div>

          <Button
            variant={isNutritionist ? 'nutritionist' : isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" color="white" />
                {tr('submitting')}
              </span>
            ) : tr('submit')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-amber-200/30" /></div>
        </div>

        {/* Links */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {tr('hasAccount')}{' '}
            <Link
              href={`/auth/login?role=${role}`}
              className="text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 font-semibold transition-all"
            >
              {tr('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto flex items-center justify-center min-h-[400px]">
        <Spinner size="md" color="primary" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  )
}

