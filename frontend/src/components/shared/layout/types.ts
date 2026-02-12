import { LucideIcon } from 'lucide-react'

/**
 * User role type for layout configuration.
 */
export type UserRole = 'trainer' | 'user'

/**
 * Navigation link configuration.
 */
export interface NavLink {
  icon: LucideIcon
  label: string
  path: string
  badge?: number
}

/**
 * Navigation section with optional title.
 */
export interface NavSection {
  title: string | null
  links: NavLink[]
}

/**
 * Top navigation item.
 */
export interface TopNavItem {
  icon: LucideIcon
  label: string
  path: string
  badge?: number
}

/**
 * Layout configuration for different roles.
 */
export interface LayoutConfig {
  role: UserRole
  basePath: string
  logoText?: string
  searchPlaceholder: string
  navSections: NavSection[]
  topNavItems: TopNavItem[]
}

/**
 * Get base path for a role.
 */
export function getBasePath(role: UserRole): string {
  return role === 'trainer' ? '/trainer' : '/user'
}
