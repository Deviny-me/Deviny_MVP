'use client'

import { useAuth } from '@/features/auth/AuthContext'

type RoleType = 'user' | 'trainer' | 'nutritionist'

/**
 * Centralized accent color system for user (blue), trainer (orange), and nutritionist (green) roles.
 * Use this hook in any shared page/component to get dynamic colors.
 */
export function useAccentColors() {
  const { user } = useAuth()
  const role: RoleType = user?.role === 'nutritionist' ? 'nutritionist' : user?.role === 'trainer' ? 'trainer' : 'user'
  return getAccentColors(role)
}

/**
 * Pure function to get accent colors based on role.
 * Accepts a RoleType string or legacy boolean (true = nutritionist, false = trainer/default).
 */
export function getAccentColors(roleOrIsNutritionist: RoleType | boolean) {
  // Legacy boolean support for backwards compat
  let role: RoleType
  if (typeof roleOrIsNutritionist === 'boolean') {
    role = roleOrIsNutritionist ? 'nutritionist' : 'trainer'
  } else {
    role = roleOrIsNutritionist
  }

  const colors = {
    nutritionist: { primary: '#22c55e', secondary: '#16a34a' },
    trainer:      { primary: '#FF6B35', secondary: '#FF0844' },
    user:         { primary: '#3B82F6', secondary: '#2563EB' },
  }[role]

  const tw = {
    nutritionist: {
      heroGlow: 'from-green-500 to-emerald-600',
      heroText: 'from-green-500 to-emerald-600',
      featureCard1Bg: 'bg-green-500/10',   featureCard1Text: 'text-green-500',
      featureCard2Bg: 'bg-emerald-500/10',  featureCard2Text: 'text-emerald-500',
    },
    trainer: {
      heroGlow: 'from-yellow-500 to-amber-600',
      heroText: 'from-yellow-500 to-amber-600',
      featureCard1Bg: 'bg-amber-500/10',   featureCard1Text: 'text-amber-500',
      featureCard2Bg: 'bg-orange-500/10',   featureCard2Text: 'text-orange-500',
    },
    user: {
      heroGlow: 'from-blue-500 to-blue-600',
      heroText: 'from-blue-500 to-blue-600',
      featureCard1Bg: 'bg-blue-500/10',    featureCard1Text: 'text-blue-500',
      featureCard2Bg: 'bg-sky-500/10',     featureCard2Text: 'text-sky-500',
    },
  }[role]

  return {
    // Raw hex values (for inline styles)
    primary: colors.primary,
    secondary: colors.secondary,

    // Tailwind gradient classes
    gradient: `from-[${colors.primary}] to-[${colors.secondary}]`,
    gradientBg: `from-[${colors.primary}]/5 to-[${colors.secondary}]/5`,
    gradientBg10: `from-[${colors.primary}]/10 to-[${colors.secondary}]/10`,
    gradientBg20: `from-[${colors.primary}]/20 to-[${colors.secondary}]/20`,

    // Text
    text: `text-[${colors.primary}]`,
    textSecondary: `text-[${colors.secondary}]`,

    // Background
    bg: `bg-[${colors.primary}]`,
    bgMuted: `bg-[${colors.primary}]/10`,
    bgMuted20: `bg-[${colors.primary}]/20`,

    // Border
    border: `border-[${colors.primary}]`,
    borderMuted: `border-[${colors.primary}]/30`,
    borderMuted50: `border-[${colors.primary}]/50`,

    // Focus / Hover
    focusBorder: `focus:border-[${colors.primary}]`,
    hoverBorder: `hover:border-[${colors.primary}]/50`,
    hoverBorderMuted: `hover:border-[${colors.primary}]/30`,
    hoverText: `hover:text-[${colors.primary}]`,
    groupHoverText: `group-hover:text-[${colors.primary}]`,

    // Fill
    fill: `fill-[${colors.primary}]`,

    // Semantic aliases for common patterns
    loader: `text-[${colors.primary}]`,
    link: `text-[${colors.primary}]`,
    badge: `bg-[${colors.secondary}]`,

    // Leaderboard/special gradients
    heroGlow: tw.heroGlow,
    heroText: tw.heroText,
    ctaGradient: `from-[${colors.primary}] to-[${colors.secondary}]`,

    // Status-like colors
    featureCard1Bg: tw.featureCard1Bg,
    featureCard1Text: tw.featureCard1Text,
    featureCard2Bg: tw.featureCard2Bg,
    featureCard2Text: tw.featureCard2Text,

    // Ring (for avatar borders)
    ring: `ring-2 ring-[${colors.primary}]`,
    ringMuted: `ring-2 ring-[${colors.primary}]/50`,

    // For inline style objects
    style: {
      color: colors.primary,
      backgroundColor: colors.primary,
    },
  } as const
}

/**
 * Get avatar ring class based on the author's role.
 * Nutritionist → green ring, Trainer → orange ring, User → blue ring.
 */
export function getRoleRingClass(role: string | number | undefined | null): string {
  if (!role) return ''
  const r = String(role).toLowerCase()
  if (r === 'nutritionist' || r === '3') return 'ring-2 ring-[#22c55e]'
  if (r === 'trainer' || r === '1') return 'ring-2 ring-[#FF6B35]'
  if (r === 'user' || r === '0') return 'ring-2 ring-[#3B82F6]'
  return ''
}

/**
 * Normalize a raw role value to a RoleType string.
 */
function normalizeRoleType(role: string | number | undefined | null): RoleType {
  const r = String(role ?? '').toLowerCase()
  if (r === 'nutritionist' || r === '3') return 'nutritionist'
  if (r === 'trainer' || r === '1') return 'trainer'
  return 'user'
}

/**
 * Get accent colors for a specific author role (for fallback avatars).
 * Similar to getAccentColors but takes a raw role value.
 */
export function getAccentColorsByRole(role: string | number | undefined | null) {
  return getAccentColors(normalizeRoleType(role))
}
