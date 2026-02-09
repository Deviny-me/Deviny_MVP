'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { getRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'
import { useRegister, GenderType, RegisterFormData } from '@/features/auth/hooks/useRegister'
import { Eye, EyeOff, Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

// 20 popular countries with their major cities
const COUNTRIES_WITH_CITIES: Record<string, { name: string; cities: string[]; phoneCode: string }> = {
  'RU': {
    name: 'Россия',
    phoneCode: '+7',
    cities: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Омск', 'Ростов-на-Дону', 'Уфа', 'Красноярск', 'Воронеж', 'Пермь', 'Волгоград']
  },
  'KZ': {
    name: 'Казахстан',
    phoneCode: '+7',
    cities: ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау']
  },
  'UA': {
    name: 'Украина',
    phoneCode: '+380',
    cities: ['Киев', 'Харьков', 'Одесса', 'Днепр', 'Донецк', 'Запорожье', 'Львов', 'Кривой Рог', 'Николаев', 'Мариуполь']
  },
  'BY': {
    name: 'Беларусь',
    phoneCode: '+375',
    cities: ['Минск', 'Гомель', 'Могилёв', 'Витебск', 'Гродно', 'Брест', 'Бобруйск', 'Барановичи', 'Борисов', 'Пинск']
  },
  'US': {
    name: 'США',
    phoneCode: '+1',
    cities: ['Нью-Йорк', 'Лос-Анджелес', 'Чикаго', 'Хьюстон', 'Финикс', 'Филадельфия', 'Сан-Антонио', 'Сан-Диего', 'Даллас', 'Сан-Хосе', 'Остин', 'Майами', 'Бостон', 'Сиэтл', 'Денвер']
  },
  'DE': {
    name: 'Германия',
    phoneCode: '+49',
    cities: ['Берлин', 'Гамбург', 'Мюнхен', 'Кёльн', 'Франкфурт', 'Штутгарт', 'Дюссельдорф', 'Дортмунд', 'Эссен', 'Лейпциг', 'Бремен', 'Дрезден', 'Ганновер', 'Нюрнберг']
  },
  'GB': {
    name: 'Великобритания',
    phoneCode: '+44',
    cities: ['Лондон', 'Бирмингем', 'Манчестер', 'Глазго', 'Ливерпуль', 'Бристоль', 'Шеффилд', 'Лидс', 'Эдинбург', 'Лестер', 'Кардифф', 'Белфаст', 'Ноттингем', 'Ньюкасл']
  },
  'FR': {
    name: 'Франция',
    phoneCode: '+33',
    cities: ['Париж', 'Марсель', 'Лион', 'Тулуза', 'Ницца', 'Нант', 'Страсбург', 'Монпелье', 'Бордо', 'Лилль', 'Ренн', 'Реймс', 'Гавр', 'Тулон']
  },
  'IT': {
    name: 'Италия',
    phoneCode: '+39',
    cities: ['Рим', 'Милан', 'Неаполь', 'Турин', 'Палермо', 'Генуя', 'Болонья', 'Флоренция', 'Бари', 'Катания', 'Венеция', 'Верона', 'Мессина', 'Падуя']
  },
  'ES': {
    name: 'Испания',
    phoneCode: '+34',
    cities: ['Мадрид', 'Барселона', 'Валенсия', 'Севилья', 'Сарагоса', 'Малага', 'Мурсия', 'Пальма', 'Бильбао', 'Аликанте', 'Кордова', 'Вальядолид', 'Виго', 'Хихон']
  },
  'PL': {
    name: 'Польша',
    phoneCode: '+48',
    cities: ['Варшава', 'Краков', 'Лодзь', 'Вроцлав', 'Познань', 'Гданьск', 'Щецин', 'Быдгощ', 'Люблин', 'Катовице', 'Белосток', 'Гдыня', 'Ченстохова', 'Радом']
  },
  'TR': {
    name: 'Турция',
    phoneCode: '+90',
    cities: ['Стамбул', 'Анкара', 'Измир', 'Бурса', 'Анталья', 'Адана', 'Конья', 'Газиантеп', 'Мерсин', 'Диярбакыр', 'Кайсери', 'Эскишехир', 'Самсун', 'Денизли']
  },
  'AE': {
    name: 'ОАЭ',
    phoneCode: '+971',
    cities: ['Дубай', 'Абу-Даби', 'Шарджа', 'Аджман', 'Рас-эль-Хайма', 'Фуджейра', 'Умм-эль-Кайвайн', 'Аль-Айн']
  },
  'CA': {
    name: 'Канада',
    phoneCode: '+1',
    cities: ['Торонто', 'Монреаль', 'Ванкувер', 'Калгари', 'Эдмонтон', 'Оттава', 'Виннипег', 'Квебек', 'Гамильтон', 'Китченер', 'Лондон', 'Виктория', 'Галифакс', 'Ошава']
  },
  'AU': {
    name: 'Австралия',
    phoneCode: '+61',
    cities: ['Сидней', 'Мельбурн', 'Брисбен', 'Перт', 'Аделаида', 'Голд-Кост', 'Ньюкасл', 'Канберра', 'Саншайн-Кост', 'Вуллонгонг', 'Хобарт', 'Джилонг', 'Таунсвилл', 'Кэрнс']
  },
  'BR': {
    name: 'Бразилия',
    phoneCode: '+55',
    cities: ['Сан-Паулу', 'Рио-де-Жанейро', 'Бразилиа', 'Салвадор', 'Форталеза', 'Белу-Оризонти', 'Манаус', 'Куритиба', 'Ресифи', 'Порту-Алегри', 'Гояния', 'Белен', 'Гуарульюс', 'Кампинас']
  },
  'CN': {
    name: 'Китай',
    phoneCode: '+86',
    cities: ['Шанхай', 'Пекин', 'Гуанчжоу', 'Шэньчжэнь', 'Чэнду', 'Тяньцзинь', 'Ухань', 'Дунгуань', 'Чунцин', 'Нанкин', 'Шэньян', 'Ханчжоу', 'Сиань', 'Харбин']
  },
  'JP': {
    name: 'Япония',
    phoneCode: '+81',
    cities: ['Токио', 'Йокогама', 'Осака', 'Нагоя', 'Саппоро', 'Фукуока', 'Кобе', 'Киото', 'Кавасаки', 'Сайтама', 'Хиросима', 'Сендай', 'Китакюсю', 'Тиба']
  },
  'KR': {
    name: 'Южная Корея',
    phoneCode: '+82',
    cities: ['Сеул', 'Пусан', 'Инчхон', 'Тэгу', 'Тэджон', 'Кванджу', 'Сувон', 'Ульсан', 'Чханвон', 'Соннам', 'Коян', 'Йонгин', 'Пучхон', 'Аньян']
  },
  'IN': {
    name: 'Индия',
    phoneCode: '+91',
    cities: ['Мумбаи', 'Дели', 'Бангалор', 'Хайдарабад', 'Ахмадабад', 'Ченнаи', 'Калькутта', 'Сурат', 'Пуна', 'Джайпур', 'Лакхнау', 'Канпур', 'Нагпур', 'Индор']
  },
}

// Get list of countries for dropdown
const COUNTRIES = Object.entries(COUNTRIES_WITH_CITIES).map(([code, data]) => ({
  code,
  name: data.name
}))

const GENDERS: { value: GenderType; label: string }[] = [
  { value: 'Male', label: 'Мужской' },
  { value: 'Female', label: 'Женский' },
  { value: 'Other', label: 'Другой' },
]

function RegisterPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  // Get available cities based on selected country
  const availableCities = countryCode ? COUNTRIES_WITH_CITIES[countryCode]?.cities || [] : []
  const selectedCountryName = countryCode ? COUNTRIES_WITH_CITIES[countryCode]?.name || '' : ''

  const { loading, errors, register, clearErrors } = useRegister()

  useEffect(() => {
    const roleFromQuery = searchParams.get('role') as RoleType
    if (roleFromQuery && (roleFromQuery === 'user' || roleFromQuery === 'trainer')) {
      setRole(roleFromQuery)
    } else {
      const roleFromStorage = getRole()
      if (roleFromStorage && (roleFromStorage === 'user' || roleFromStorage === 'trainer')) {
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
    
    // Combine phone code with phone number for trainers
    const fullPhone = role === 'trainer' && phone 
      ? `${COUNTRIES_WITH_CITIES[phoneCountryCode]?.phoneCode || ''} ${phone}`.trim()
      : phone
    
    console.log('Registration data:', {
      firstName,
      lastName,
      email,
      phone: fullPhone,
      phoneCountryCode,
      gender,
      country: selectedCountryName,
      city
    })
    
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
      city,
    }

    // Add trainer-specific fields
    if (role === 'trainer') {
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

  return (
    <div className="light w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary-700 mb-2">Ignite</h1>
        <p className="text-lg text-gray-600">
          Социальная сеть для фитнеса
        </p>
      </div>

      <Card className="p-8 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {isTrainer ? 'Регистрация тренера' : 'Регистрация пользователя'}
        </h2>
        <p className="text-gray-600 mb-6 text-center text-sm">
          {isTrainer 
            ? 'Создайте профиль тренера и начните помогать людям' 
            : 'Создайте аккаунт и начните свой путь к здоровью'}
        </p>

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
                Имя
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Иван"
                disabled={loading}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фамилия
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Иванов"
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Минимум 6 символов, 1 цифра"
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
              Повторите пароль
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Повторите пароль"
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
          {isTrainer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пол
              </label>
              <select
                value={gender || ''}
                onChange={(e) => setGender(e.target.value as GenderType || undefined)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Выберите пол</option>
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

          {/* Phone - Only for trainers */}
          {isTrainer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона *
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  className={`w-32 px-3 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {COUNTRIES_WITH_CITIES[c.code].phoneCode}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="999 123-45-67"
                  disabled={loading}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          )}

          {/* Country and City */}
          {isTrainer && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Страна
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
                  <option value="">Выберите страну</option>
                  {COUNTRIES.map((c) => (
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
                  Город
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading || !countryCode}
                >
                  <option value="">{countryCode ? 'Выберите город' : 'Сначала выберите страну'}</option>
                  {availableCities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>
          )}

          {/* Trainer-specific fields */}
          {isTrainer && (
            <>
              {/* Verification Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Документ подтверждения квалификации
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Загрузите сертификат, диплом или другой документ, подтверждающий вашу квалификацию тренера
                </p>
                
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
                      <span className="font-medium text-primary-600">Нажмите для загрузки</span>
                      {' '}или перетащите файл
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, JPG, PNG до 10 МБ
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
                Согласен с{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                  условиями использования
                </Link>
                {' '}и{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
                  политикой конфиденциальности
                </Link>
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
            )}
          </div>

          <Button
            variant={isTrainer ? 'trainer' : 'user'}
            size="lg"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Уже есть аккаунт?{' '}
            <Link
              href={`/auth/login?role=${role}`}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Войти
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
