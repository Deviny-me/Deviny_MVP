'use client'

import { useEffect } from 'react'
import { RoleCard } from '@/features/auth/components/RoleCard'
import { useRoleSelection } from '@/features/auth/hooks/useRoleSelection'
import { ROLE_CARDS } from '@/features/auth/constants/roles'

export default function AuthPage() {
  const { selectedRole, error, selectRole, navigateToLogin, loadStoredRole } = useRoleSelection()

  useEffect(() => {
    loadStoredRole()
  }, [loadStoredRole])

  return (
    <div className="light w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary-700 mb-4">Ignite</h1>
        <p className="text-xl text-gray-600">
          Социальная сеть для фитнеса и здорового образа жизни
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ROLE_CARDS.map((roleData) => (
          <RoleCard
            key={roleData.type}
            data={roleData}
            isSelected={selectedRole === roleData.type}
            onSelect={() => selectRole(roleData.type)}
            onAction={() => navigateToLogin(roleData.type)}
          />
        ))}
      </div>
    </div>
  )
}
