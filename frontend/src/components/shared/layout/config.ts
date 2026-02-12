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
 * Get layout configuration by role.
 */
export function getLayoutConfig(role: 'trainer' | 'user'): LayoutConfig {
  return role === 'trainer' ? trainerConfig : userConfig
}
