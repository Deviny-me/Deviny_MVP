'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

type Language = 'ru' | 'en'

interface Translations {
  // Common
  loading: string
  save: string
  cancel: string
  delete: string
  edit: string
  change: string
  add: string
  create: string
  search: string
  filters: string
  noData: string
  today: string
  share: string
  logout: string
  
  // Settings page
  settings: string
  settingsDescription: string
  account: string
  nameEmailPhone: string
  updatePassword: string
  deleteAccount: string
  deleteAccountDescription: string
  appearance: string
  theme: string
  themeDark: string
  themeLight: string
  notifications: string
  pushNotifications: string
  pushDescription: string
  quickSettings: string
  language: string
  russian: string
  english: string
  email: string
  phone: string
  editProfile: string
  changePassword: string
  name: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  minChars: string
  repeatPassword: string
  emailCantChange: string
  profileUpdated: string
  passwordChanged: string
  themeUpdated: string
  languageUpdated: string
  notificationsEnabled: string
  notificationsDisabled: string
  error: string
  connectionError: string
  passwordsDontMatch: string
  wrongPassword: string
  deleteConfirmation: string
  
  // Sidebar & Navigation
  trainer: string
  trainerPlatform: string
  dashboard: string
  clients: string
  schedule: string
  chat: string
  finance: string
  profile: string
  
  // Dashboard
  welcome: string
  dashboardSubtitle: string
  todayIncome: string
  activeClients: string
  programsSold: string
  needsAttention: string
  lastActivity: string
  noActivity: string
  activityWillAppear: string
  topPrograms: string
  noPrograms: string
  createProgram: string
  
  // Clients
  manageClients: string
  addClient: string
  addFirstClient: string
  all: string
  active: string
  new: string
  vip: string
  needAttention: string
  searchByName: string
  noClients: string
  noClientsDescription: string
  
  // Programs
  createAndSell: string
  totalRevenue: string
  totalStudents: string
  avgRating: string
  activePrograms: string
  noProgramsYet: string
  createFirstProgram: string
  noProgramsDescription: string
  
  // Schedule
  manageSchedule: string
  addSlot: string
  addSession: string
  noSessions: string
  noSessionsForDay: string
  sessions: string
  weekStats: string
  totalSessions: string
  personal: string
  group: string
  workload: string
  
  // Chat
  chats: string
  noChats: string
  chatsWillAppear: string
  noActiveChats: string
  chatClientsDescription: string
  
  // Finance
  manageFinance: string
  withdrawFunds: string
  availableForWithdraw: string
  platformFee: string
  monthlyIncome: string
  forecastIncome: string
  notEnoughData: string
  incomeStructure: string
  personalTraining: string
  consultations: string
  recentTransactions: string
  noTransactions: string
  transactionsHistory: string
  popularPrograms: string
  createProgramToSell: string
  
  // Profile
  trainerProfile: string
  fillProfile: string
  fillProfileDescription: string
  addPhotoAndName: string
  specifySpecialization: string
  addCertificates: string
  certificates: string
  noCertificates: string
  achievements: string
  noAchievements: string
  noSpecializations: string
  addCertificate: string
  programs: string
  reviews: string
  rating: string
  aboutMe: string
  copyLink: string
  linkCopied: string
  specializations: string
}

const translations: Record<Language, Translations> = {
  ru: {
    // Common
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Изменить',
    change: 'Изменить',
    add: 'Добавить',
    create: 'Создать',
    search: 'Поиск',
    filters: 'Фильтры',
    noData: 'Нет данных',
    today: 'Сегодня',
    share: 'Поделиться',
    logout: 'Выйти',
    
    // Settings page
    settings: 'Настройки',
    settingsDescription: 'Управляйте настройками аккаунта и приложения',
    account: 'Аккаунт',
    nameEmailPhone: 'Имя, email, телефон',
    updatePassword: 'Обновите пароль аккаунта',
    deleteAccount: 'Удалить аккаунт',
    deleteAccountDescription: 'Безвозвратное удаление данных',
    appearance: 'Внешний вид',
    theme: 'Тема',
    themeDark: 'Тёмная',
    themeLight: 'Светлая',
    notifications: 'Уведомления',
    pushNotifications: 'Push-уведомления',
    pushDescription: 'Уведомления на устройство',
    quickSettings: 'Быстрые настройки',
    language: 'Язык',
    russian: 'Русский',
    english: 'English',
    email: 'Email',
    phone: 'Телефон',
    editProfile: 'Редактировать профиль',
    changePassword: 'Изменить пароль',
    name: 'Имя',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    minChars: 'Минимум 6 символов',
    repeatPassword: 'Повторите новый пароль',
    emailCantChange: 'Email нельзя изменить',
    profileUpdated: 'Профиль обновлён',
    passwordChanged: 'Пароль изменён',
    themeUpdated: 'Тема обновлена',
    languageUpdated: 'Язык изменён',
    notificationsEnabled: 'Уведомления включены',
    notificationsDisabled: 'Уведомления отключены',
    error: 'Ошибка при сохранении',
    connectionError: 'Ошибка подключения',
    passwordsDontMatch: 'Пароли не совпадают',
    wrongPassword: 'Неверный текущий пароль',
    deleteConfirmation: 'Вы уверены, что хотите удалить аккаунт? Это действие необратимо и все ваши данные будут удалены.',
    
    // Sidebar & Navigation
    trainer: 'Тренер',
    trainerPlatform: 'Платформа тренера',
    dashboard: 'Dashboard',
    clients: 'Клиенты',
    programs: 'Программы',
    schedule: 'Расписание',
    chat: 'Чат',
    finance: 'Финансы',
    profile: 'Профиль',
    
    // Dashboard
    welcome: 'Добро пожаловать!',
    dashboardSubtitle: 'Вот что происходит с вашим бизнесом сегодня',
    todayIncome: 'Доход сегодня',
    activeClients: 'Активные клиенты',
    programsSold: 'Продано программ',
    needsAttention: 'Нужно внимание',
    lastActivity: 'Последняя активность',
    noActivity: 'Пока нет активности',
    activityWillAppear: 'Активность клиентов будет отображаться здесь',
    topPrograms: 'Топ программы',
    noPrograms: 'У вас пока нет программ',
    createProgram: 'Создать программу',
    
    // Clients
    manageClients: 'Управляйте своими клиентами',
    addClient: 'Добавить клиента',
    addFirstClient: 'Добавить первого клиента',
    all: 'Все',
    active: 'Активные',
    new: 'Новые',
    vip: 'VIP',
    needAttention: 'Требуют внимания',
    searchByName: 'Поиск по имени, цели или программе...',
    noClients: 'У вас пока нет клиентов',
    noClientsDescription: 'Добавьте своего первого клиента или поделитесь ссылкой на профиль, чтобы клиенты могли найти вас',
    
    // Programs
    createAndSell: 'Создавайте и продавайте тренировочные программы',
    totalRevenue: 'Общий доход',
    totalStudents: 'Всего студентов',
    avgRating: 'Средний рейтинг',
    activePrograms: 'Активных программ',
    noProgramsYet: 'У вас пока нет программ',
    createFirstProgram: 'Создать первую программу',
    noProgramsDescription: 'Создайте свою первую тренировочную программу и начните продавать её клиентам',
    
    // Schedule
    manageSchedule: 'Управляйте своими занятиями и встречами',
    addSlot: 'Добавить слот',
    addSession: 'Добавить занятие',
    noSessions: 'Нет запланированных занятий',
    noSessionsForDay: 'На этот день нет занятий',
    sessions: 'занятий',
    weekStats: 'Статистика недели',
    totalSessions: 'Всего занятий',
    personal: 'Персональных',
    group: 'Групповых',
    workload: 'Загруженность',
    
    // Chat
    chats: 'Чаты',
    noChats: 'Нет чатов',
    chatsWillAppear: 'Чаты с клиентами появятся здесь',
    noActiveChats: 'Нет активных чатов',
    chatClientsDescription: 'Когда у вас появятся клиенты, вы сможете общаться с ними здесь',
    
    // Finance
    manageFinance: 'Управляйте своими доходами и выплатами',
    withdrawFunds: 'Вывести средства',
    availableForWithdraw: 'Доступно к выводу',
    platformFee: 'Комиссия платформы: 15%',
    monthlyIncome: 'Доход за месяц',
    forecastIncome: 'Прогноз дохода',
    notEnoughData: 'Недостаточно данных',
    incomeStructure: 'Структура дохода',
    personalTraining: 'Персональные тренировки',
    consultations: 'Консультации',
    recentTransactions: 'Последние транзакции',
    noTransactions: 'Транзакций пока нет',
    transactionsHistory: 'Здесь будет история ваших доходов и выводов',
    popularPrograms: 'Популярные программы',
    createProgramToSell: 'Создайте программу для начала продаж',
    
    // Profile
    trainerProfile: 'Профиль тренера',
    fillProfile: 'Заполнить профиль',
    fillProfileDescription: 'Добавьте информацию о себе, чтобы клиенты могли узнать о вашем опыте и специализации. Заполненный профиль повышает доверие и привлекает больше клиентов.',
    addPhotoAndName: 'Добавьте фото и имя',
    specifySpecialization: 'Укажите специализацию',
    addCertificates: 'Добавьте сертификаты и достижения',
    certificates: 'Сертификаты',
    noCertificates: 'Нет сертификатов',
    achievements: 'Достижения',
    noAchievements: 'Нет достижений',
    noSpecializations: 'Не указано',
    addCertificate: 'Добавить сертификат',
    reviews: 'отзывов',
    rating: 'Рейтинг',
    aboutMe: 'О себе',
    copyLink: 'Скопировать ссылку',
    linkCopied: 'Ссылка скопирована!',
    specializations: 'Специализации',
  },
  en: {
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    change: 'Change',
    add: 'Add',
    create: 'Create',
    search: 'Search',
    filters: 'Filters',
    noData: 'No data',
    today: 'Today',
    share: 'Share',
    logout: 'Logout',
    
    // Settings page
    settings: 'Settings',
    settingsDescription: 'Manage your account and app settings',
    account: 'Account',
    nameEmailPhone: 'Name, email, phone',
    updatePassword: 'Update account password',
    deleteAccount: 'Delete account',
    deleteAccountDescription: 'Permanently delete all data',
    appearance: 'Appearance',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    notifications: 'Notifications',
    pushNotifications: 'Push notifications',
    pushDescription: 'Notifications to device',
    quickSettings: 'Quick settings',
    language: 'Language',
    russian: 'Русский',
    english: 'English',
    email: 'Email',
    phone: 'Phone',
    editProfile: 'Edit profile',
    changePassword: 'Change password',
    name: 'Name',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    minChars: 'Minimum 6 characters',
    repeatPassword: 'Repeat new password',
    emailCantChange: 'Email cannot be changed',
    profileUpdated: 'Profile updated',
    passwordChanged: 'Password changed',
    themeUpdated: 'Theme updated',
    languageUpdated: 'Language changed',
    notificationsEnabled: 'Notifications enabled',
    notificationsDisabled: 'Notifications disabled',
    error: 'Error saving',
    connectionError: 'Connection error',
    passwordsDontMatch: 'Passwords do not match',
    wrongPassword: 'Wrong current password',
    deleteConfirmation: 'Are you sure you want to delete your account? This action is irreversible and all your data will be deleted.',
    
    // Sidebar & Navigation
    trainer: 'Trainer',
    trainerPlatform: 'Trainer platform',
    dashboard: 'Dashboard',
    clients: 'Clients',
    programs: 'Programs',
    schedule: 'Schedule',
    chat: 'Chat',
    finance: 'Finance',
    profile: 'Profile',
    
    // Dashboard
    welcome: 'Welcome!',
    dashboardSubtitle: 'Here\'s what\'s happening with your business today',
    todayIncome: 'Today\'s income',
    activeClients: 'Active clients',
    programsSold: 'Programs sold',
    needsAttention: 'Needs attention',
    lastActivity: 'Recent activity',
    noActivity: 'No activity yet',
    activityWillAppear: 'Client activity will appear here',
    topPrograms: 'Top programs',
    noPrograms: 'You don\'t have any programs yet',
    createProgram: 'Create program',
    
    // Clients
    manageClients: 'Manage your clients',
    addClient: 'Add client',
    addFirstClient: 'Add first client',
    all: 'All',
    active: 'Active',
    new: 'New',
    vip: 'VIP',
    needAttention: 'Need attention',
    searchByName: 'Search by name, goal or program...',
    noClients: 'You don\'t have any clients yet',
    noClientsDescription: 'Add your first client or share your profile link so clients can find you',
    
    // Programs
    createAndSell: 'Create and sell training programs',
    totalRevenue: 'Total revenue',
    totalStudents: 'Total students',
    avgRating: 'Average rating',
    activePrograms: 'Active programs',
    noProgramsYet: 'You don\'t have any programs yet',
    createFirstProgram: 'Create first program',
    noProgramsDescription: 'Create your first training program and start selling it to clients',
    
    // Schedule
    manageSchedule: 'Manage your sessions and meetings',
    addSlot: 'Add slot',
    addSession: 'Add session',
    noSessions: 'No scheduled sessions',
    noSessionsForDay: 'No sessions for this day',
    sessions: 'sessions',
    weekStats: 'Week statistics',
    totalSessions: 'Total sessions',
    personal: 'Personal',
    group: 'Group',
    workload: 'Workload',
    
    // Chat
    chats: 'Chats',
    noChats: 'No chats',
    chatsWillAppear: 'Chats with clients will appear here',
    noActiveChats: 'No active chats',
    chatClientsDescription: 'When you have clients, you can chat with them here',
    
    // Finance
    manageFinance: 'Manage your income and payouts',
    withdrawFunds: 'Withdraw funds',
    availableForWithdraw: 'Available for withdrawal',
    platformFee: 'Platform fee: 15%',
    monthlyIncome: 'Monthly income',
    forecastIncome: 'Income forecast',
    notEnoughData: 'Not enough data',
    incomeStructure: 'Income structure',
    personalTraining: 'Personal training',
    consultations: 'Consultations',
    recentTransactions: 'Recent transactions',
    noTransactions: 'No transactions yet',
    transactionsHistory: 'Your income and withdrawal history will appear here',
    popularPrograms: 'Popular programs',
    createProgramToSell: 'Create a program to start selling',
    
    // Profile
    trainerProfile: 'Trainer profile',
    fillProfile: 'Fill out profile',
    fillProfileDescription: 'Add information about yourself so clients can learn about your experience and specialization. A complete profile builds trust and attracts more clients.',
    addPhotoAndName: 'Add photo and name',
    specifySpecialization: 'Specify specialization',
    addCertificates: 'Add certificates and achievements',
    certificates: 'Certificates',
    noCertificates: 'No certificates',
    achievements: 'Achievements',
    noAchievements: 'No achievements',
    noSpecializations: 'Not specified',
    addCertificate: 'Add certificate',
    reviews: 'reviews',
    rating: 'Rating',
    aboutMe: 'About me',
    copyLink: 'Copy link',
    linkCopied: 'Link copied!',
    specializations: 'Specializations',
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  t: Translations
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
  initialLanguage?: Language
}

export function LanguageProvider({ children, initialLanguage = 'ru' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)
  const [isLoading, setIsLoading] = useState(false)

  // Sync with API on mount
  useEffect(() => {
    const syncLanguage = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const response = await fetch('http://localhost:5000/api/me/settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          const apiLanguage = (data.language || 'ru') as Language
          if (apiLanguage !== language) {
            setLanguageState(apiLanguage)
          }
        }
      } catch (error) {
        console.error('Failed to sync language:', error)
      }
    }

    syncLanguage()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const setLanguage = useCallback(async (newLanguage: Language) => {
    setIsLoading(true)
    setLanguageState(newLanguage)

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      await fetch('http://localhost:5000/api/me/settings/language', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ language: newLanguage })
      })
    } catch (error) {
      console.error('Failed to save language:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const t = translations[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function getLanguageLabel(lang: Language): string {
  return lang === 'ru' ? 'Русский' : 'English'
}
