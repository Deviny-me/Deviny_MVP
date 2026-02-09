import {
  Award,
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
} from 'lucide-react'
import { LayoutConfig } from './types'

/**
 * Navigation configuration for trainers.
 */
export const trainerConfig: LayoutConfig = {
  role: 'trainer',
  basePath: '/dashboard/trainer',
  logoText: 'TRAINER',
  searchPlaceholder: 'Search students, programs...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'Home', path: '/dashboard/trainer' },
        { icon: Compass, label: 'Discover', path: '/dashboard/trainer/discovery' },
        { icon: GraduationCap, label: 'Experts', path: '/dashboard/trainer/experts' },
      ]
    },
    {
      title: 'Training',
      links: [
        { icon: Layers, label: 'My Programs', path: '/dashboard/trainer/programs' },
        { icon: Users, label: 'Students', path: '/dashboard/trainer/students' },
        { icon: Radio, label: 'Live Workouts', path: '/dashboard/trainer/live' },
        { icon: Calendar, label: 'Schedule', path: '/dashboard/trainer/schedule' },
      ]
    },
    {
      title: 'Compete',
      links: [
        { icon: Target, label: 'Challenges', path: '/dashboard/trainer/challenges' },
        { icon: Trophy, label: 'Leaderboards', path: '/dashboard/trainer/leaderboards' },
        { icon: Award, label: 'Achievements', path: '/dashboard/trainer/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'Students', path: '/dashboard/trainer/students' },
    { icon: MessageCircle, label: 'Messages', path: '/dashboard/trainer/messages' },
    { icon: User, label: 'My Profile', path: '/dashboard/trainer/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/trainer/settings' },
  ]
}

/**
 * Navigation configuration for users.
 */
export const userConfig: LayoutConfig = {
  role: 'user',
  basePath: '/dashboard/user',
  logoText: undefined,
  searchPlaceholder: 'Search trainers, programs, workouts...',
  navSections: [
    {
      title: null,
      links: [
        { icon: Home, label: 'Home', path: '/dashboard/user' },
        { icon: Compass, label: 'Discover', path: '/dashboard/user/discovery' },
        { icon: GraduationCap, label: 'Experts', path: '/dashboard/user/experts' },
      ]
    },
    {
      title: 'Training',
      links: [
        { icon: Layers, label: 'Programs', path: '/dashboard/user/programs' },
        { icon: BookOpen, label: 'My Journey', path: '/dashboard/user/journey' },
        { icon: Radio, label: 'Live Workouts', path: '/dashboard/user/live' },
        { icon: Calendar, label: 'Schedule', path: '/dashboard/user/schedule' },
      ]
    },
    {
      title: 'Compete',
      links: [
        { icon: Target, label: 'Challenges', path: '/dashboard/user/challenges' },
        { icon: Trophy, label: 'Leaderboards', path: '/dashboard/user/leaderboards' },
        { icon: Award, label: 'Achievements', path: '/dashboard/user/achievements' },
      ]
    }
  ],
  topNavItems: [
    { icon: Users, label: 'Friends', path: '/dashboard/user/friends' },
    { icon: MessageCircle, label: 'Messages', path: '/dashboard/user/messages' },
    { icon: User, label: 'Profile', path: '/dashboard/user/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/user/settings' },
  ]
}

/**
 * Get layout configuration by role.
 */
export function getLayoutConfig(role: 'trainer' | 'user'): LayoutConfig {
  return role === 'trainer' ? trainerConfig : userConfig
}
