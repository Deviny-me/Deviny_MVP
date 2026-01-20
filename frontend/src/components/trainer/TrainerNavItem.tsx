'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavItem } from '@/lib/trainer/nav'

interface TrainerNavItemProps {
  item: NavItem
}

export function TrainerNavItem({ item }: TrainerNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.href

  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
          : 'text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{item.title}</span>
    </Link>
  )
}
