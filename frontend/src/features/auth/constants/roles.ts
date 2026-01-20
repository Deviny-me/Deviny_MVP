import { RoleCardData } from '../types/role.types'

export const STORAGE_KEY = 'selectedRole'

export const ROLE_CARDS: RoleCardData[] = [
  {
    type: 'user',
    title: 'Я пользователь',
    description: 'Найдите тренера, отслеживайте прогресс, общайтесь с единомышленниками',
    tags: ['Тренировки', 'Питание', 'Прогресс'],
    accentColor: 'user',
  },
  {
    type: 'trainer',
    title: 'Я тренер',
    description: 'Найдите клиентов, создавайте программы тренировок, развивайте свой бизнес',
    tags: ['Клиенты', 'Программы', 'Доход'],
    accentColor: 'trainer',
  },
]
