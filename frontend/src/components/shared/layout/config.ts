import {
  Award,
  BarChart3,
  Calendar,
  Home,
  Compass,
  BookOpen,
  Trophy,
  Radio,
  Target,
  GraduationCap,
  Layers,
  Users,
  MessageCircle,
  User,
  Settings,
  Apple,
} from 'lucide-react'
import { LayoutConfig } from './types'

/**
 * Navigation configuration for trainers.
 */
export const trainerConfig: LayoutConfig = {
  role: 'trainer',
  basePath: '/trainer',
  logoText: 'TRAINER',
  searchPlaceholder: 'Search students, programs...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'Home', path: '/trainer' },
        { icon: Compass, label: 'Discover', path: '/trainer/discovery' },
        { icon: GraduationCap, label: 'Experts', path: '/trainer/experts' },
      ]
    },
    {
      title: 'Training',
      links: [
        { icon: BarChart3, label: 'Dashboard', path: '/trainer/dashboard' },
        { icon: Layers, label: 'My Programs', path: '/trainer/programs' },
        { icon: Users, label: 'Students', path: '/trainer/students' },
        { icon: Radio, label: 'Live Workouts', path: '/trainer/live' },
        { icon: Calendar, label: 'Schedule', path: '/trainer/schedule' },
      ]
    },
    {
      title: 'Compete',
      links: [
        { icon: Target, label: 'Challenges', path: '/trainer/challenges' },
        { icon: Trophy, label: 'Leaderboards', path: '/trainer/leaderboards' },
        { icon: Award, label: 'Achievements', path: '/trainer/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'Students', path: '/trainer/students' },
    { icon: MessageCircle, label: 'Messages', path: '/trainer/messages' },
    { icon: User, label: 'My Profile', path: '/trainer/profile' },
    { icon: Settings, label: 'Settings', path: '/trainer/settings' },
  ]
}

/**
 * Navigation configuration for users.
 */
export const userConfig: LayoutConfig = {
  role: 'user',
  basePath: '/user',
  logoText: undefined,
  searchPlaceholder: 'Search trainers, programs, workouts...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'Home', path: '/user' },
        { icon: Compass, label: 'Discover', path: '/user/discovery' },
        { icon: GraduationCap, label: 'Experts', path: '/user/experts' },
      ]
    },
    {
      title: 'Training',
      links: [
        { icon: Layers, label: 'Programs', path: '/user/programs' },
        { icon: BookOpen, label: 'My Journey', path: '/user/journey' },
        { icon: Radio, label: 'Live Workouts', path: '/user/live' },
        { icon: Calendar, label: 'Schedule', path: '/user/schedule' },
      ]
    },
    {
      title: 'Compete',
      links: [
        { icon: Target, label: 'Challenges', path: '/user/challenges' },
        { icon: Trophy, label: 'Leaderboards', path: '/user/leaderboards' },
        { icon: Award, label: 'Achievements', path: '/user/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'Friends', path: '/user/friends' },
    { icon: MessageCircle, label: 'Messages', path: '/user/messages' },
    { icon: User, label: 'Profile', path: '/user/profile' },
    { icon: Settings, label: 'Settings', path: '/user/settings' },
  ]
}

/**
 * Navigation configuration for nutritionists.
 */
export const nutritionistConfig: LayoutConfig = {
  role: 'nutritionist',
  basePath: '/nutritionist',
  logoText: 'NUTRITIONIST',
  searchPlaceholder: 'Search clients, programs...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'Home', path: '/nutritionist' },
        { icon: Compass, label: 'Discover', path: '/nutritionist/discovery' },
        { icon: GraduationCap, label: 'Experts', path: '/nutritionist/experts' },
      ]
    },
    {
      title: 'Nutrition',
      links: [
        { icon: BarChart3, label: 'Dashboard', path: '/nutritionist/dashboard' },
        { icon: Apple, label: 'Meal Programs', path: '/nutritionist/programs' },
        { icon: Users, label: 'Students', path: '/nutritionist/clients' },
        { icon: Radio, label: 'Live', path: '/nutritionist/live' },
        { icon: Calendar, label: 'Schedule', path: '/nutritionist/schedule' },
      ]
    },
    {
      title: 'Compete',
      links: [
        { icon: Target, label: 'Challenges', path: '/nutritionist/challenges' },
        { icon: Trophy, label: 'Leaderboards', path: '/nutritionist/leaderboards' },
        { icon: Award, label: 'Achievements', path: '/nutritionist/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'Students', path: '/nutritionist/clients' },
    { icon: MessageCircle, label: 'Messages', path: '/nutritionist/messages' },
    { icon: User, label: 'My Profile', path: '/nutritionist/profile' },
    { icon: Settings, label: 'Settings', path: '/nutritionist/settings' },
  ]
}

/**
 * Get layout configuration by role.
 */
export function getLayoutConfig(role: 'trainer' | 'user' | 'nutritionist'): LayoutConfig {
  switch (role) {
    case 'trainer': return trainerConfig
    case 'nutritionist': return nutritionistConfig
    default: return userConfig
  }
}
