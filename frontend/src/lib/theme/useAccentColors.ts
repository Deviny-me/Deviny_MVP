'use client'

import { useAuth } from '@/features/auth/AuthContext'

/**
 * Centralized accent color system for trainer (orange) vs nutritionist (green) roles.
 * Use this hook in any shared page/component to get dynamic colors.
 */
export function useAccentColors() {
  const { user } = useAuth()
  const isNutritionist = user?.role === 'nutritionist'
  return getAccentColors(isNutritionist)
}

/**
 * Pure function to get accent colors without hook (for cases where isNutritionist is already known)
 */
export function getAccentColors(isNutritionist: boolean) {
  return {
    // Raw hex values (for inline styles)
    primary: isNutritionist ? '#22c55e' : '#FF6B35',
    secondary: isNutritionist ? '#16a34a' : '#FF0844',

    // Tailwind gradient classes
    gradient: isNutritionist ? 'from-[#22c55e] to-[#16a34a]' : 'from-[#FF6B35] to-[#FF0844]',
    gradientBg: isNutritionist ? 'from-[#22c55e]/5 to-[#16a34a]/5' : 'from-[#FF6B35]/5 to-[#FF0844]/5',
    gradientBg10: isNutritionist ? 'from-[#22c55e]/10 to-[#16a34a]/10' : 'from-[#FF6B35]/10 to-[#FF0844]/10',
    gradientBg20: isNutritionist ? 'from-[#22c55e]/20 to-[#16a34a]/20' : 'from-[#FF6B35]/20 to-[#FF0844]/20',

    // Text
    text: isNutritionist ? 'text-[#22c55e]' : 'text-[#FF6B35]',
    textSecondary: isNutritionist ? 'text-[#16a34a]' : 'text-[#FF0844]',

    // Background
    bg: isNutritionist ? 'bg-[#22c55e]' : 'bg-[#FF6B35]',
    bgMuted: isNutritionist ? 'bg-[#22c55e]/10' : 'bg-[#FF6B35]/10',
    bgMuted20: isNutritionist ? 'bg-[#22c55e]/20' : 'bg-[#FF6B35]/20',

    // Border
    border: isNutritionist ? 'border-[#22c55e]' : 'border-[#FF6B35]',
    borderMuted: isNutritionist ? 'border-[#22c55e]/30' : 'border-[#FF6B35]/30',
    borderMuted50: isNutritionist ? 'border-[#22c55e]/50' : 'border-[#FF6B35]/50',

    // Focus / Hover
    focusBorder: isNutritionist ? 'focus:border-[#22c55e]' : 'focus:border-[#FF6B35]',
    hoverBorder: isNutritionist ? 'hover:border-[#22c55e]/50' : 'hover:border-[#FF6B35]/50',
    hoverBorderMuted: isNutritionist ? 'hover:border-[#22c55e]/30' : 'hover:border-[#FF6B35]/30',
    hoverText: isNutritionist ? 'hover:text-[#22c55e]' : 'hover:text-[#FF6B35]',
    groupHoverText: isNutritionist ? 'group-hover:text-[#22c55e]' : 'group-hover:text-[#FF6B35]',

    // Fill
    fill: isNutritionist ? 'fill-[#22c55e]' : 'fill-[#FF6B35]',

    // Semantic aliases for common patterns
    loader: isNutritionist ? 'text-[#22c55e]' : 'text-[#FF6B35]',
    link: isNutritionist ? 'text-[#22c55e]' : 'text-[#FF6B35]',
    badge: isNutritionist ? 'bg-[#22c55e]' : 'bg-[#FF0844]',

    // Leaderboard/special gradients
    heroGlow: isNutritionist ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-amber-600',
    heroText: isNutritionist ? 'from-green-500 to-emerald-600' : 'from-yellow-500 to-amber-600',
    ctaGradient: isNutritionist ? 'from-[#22c55e] to-[#16a34a]' : 'from-[#FF6B35] to-[#FF0844]',

    // Status-like colors (keep amber for statuses where appropriate)
    featureCard1Bg: isNutritionist ? 'bg-green-500/10' : 'bg-amber-500/10',
    featureCard1Text: isNutritionist ? 'text-green-500' : 'text-amber-500',
    featureCard2Bg: isNutritionist ? 'bg-emerald-500/10' : 'bg-orange-500/10',
    featureCard2Text: isNutritionist ? 'text-emerald-500' : 'text-orange-500',

    // Ring (for avatar borders)
    ring: isNutritionist ? 'ring-2 ring-[#22c55e]' : 'ring-2 ring-[#FF6B35]',
    ringMuted: isNutritionist ? 'ring-2 ring-[#22c55e]/50' : 'ring-2 ring-[#FF6B35]/50',

    // For inline style objects
    style: {
      color: isNutritionist ? '#22c55e' : '#FF6B35',
      backgroundColor: isNutritionist ? '#22c55e' : '#FF6B35',
    },
  } as const
}

/**
 * Get avatar ring class based on the author's role.
 * Nutritionist → green ring, Trainer → orange ring, User → no ring.
 */
export function getRoleRingClass(role: string | number | undefined | null): string {
  if (!role) return ''
  const r = String(role).toLowerCase()
  if (r === 'nutritionist' || r === '3') return 'ring-2 ring-[#22c55e]'
  if (r === 'trainer' || r === '1') return 'ring-2 ring-[#FF6B35]'
  return ''
}

/**
 * Get accent colors for a specific author role (for fallback avatars).
 * Similar to getAccentColors but takes a raw role value.
 */
export function getAccentColorsByRole(role: string | number | undefined | null) {
  const r = String(role ?? '').toLowerCase()
  const isNutritionist = r === 'nutritionist' || r === '3'
  return getAccentColors(isNutritionist)
}
