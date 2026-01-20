import { LucideIcon, TrendingUp, Users, ShoppingBag, AlertCircle } from 'lucide-react';

// ========================================
// ТИПЫ
// ========================================
export interface DashboardKpi {
  id: string;
  title: string;
  value: string;
  delta: string; // "+18%", "+3", "-1" и т.д.
  icon: LucideIcon;
}

export interface ActivityItem {
  id: string;
  initials: string;
  name: string;
  text: string; // полный текст активности
  timeAgo: string; // "5 мин назад"
  colorClass: string; // bg-green-500, bg-blue-500 и т.д.
}

export interface TopProgramItem {
  id: string;
  title: string;
  salesText: string; // "15 продаж"
  amount: string; // "45 000 ₽"
}

// ========================================
// MOCK ДАННЫЕ
// ========================================
export const mockKpiData: DashboardKpi[] = [
  {
    id: '1',
    title: 'Доход сегодня',
    value: '12 450 ₽',
    delta: '+18%',
    icon: TrendingUp,
  },
  {
    id: '2',
    title: 'Активные клиенты',
    value: '24',
    delta: '+3',
    icon: Users,
  },
  {
    id: '3',
    title: 'Продано программ',
    value: '8',
    delta: '+2',
    icon: ShoppingBag,
  },
  {
    id: '4',
    title: 'Нужно внимание',
    value: '3',
    delta: '-1',
    icon: AlertCircle,
  },
];

export const mockActivityData: ActivityItem[] = [
  {
    id: '1',
    initials: 'Д',
    name: 'Дмитрий К.',
    text: 'завершил тренировку',
    timeAgo: '5 мин назад',
    colorClass: 'bg-green-500',
  },
  {
    id: '2',
    initials: 'Е',
    name: 'Елена М.',
    text: 'купила программу "Похудение 30 дней"',
    timeAgo: '1 час назад',
    colorClass: 'bg-blue-500',
  },
  {
    id: '3',
    initials: 'И',
    name: 'Игорь С.',
    text: 'пропустил 3 дня',
    timeAgo: '2 часа назад',
    colorClass: 'bg-orange-500',
  },
  {
    id: '4',
    initials: 'А',
    name: 'Анна В.',
    text: 'отправила сообщение',
    timeAgo: '3 часа назад',
    colorClass: 'bg-purple-500',
  },
];

export const mockTopProgramsData: TopProgramItem[] = [
  {
    id: '1',
    title: 'Похудение 30 дней',
    salesText: '15 продаж',
    amount: '45 000 ₽',
  },
  {
    id: '2',
    title: 'Набор массы',
    salesText: '12 продаж',
    amount: '36 000 ₽',
  },
  {
    id: '3',
    title: 'Растяжка и гибкость',
    salesText: '8 продаж',
    amount: '16 000 ₽',
  },
];
