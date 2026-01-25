'use client'

import { UserDashboardHeader } from '@/components/user/UserDashboardHeader'

export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <UserDashboardHeader />
      
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-50 mb-2">
            Панель пользователя
          </h1>
          <p className="text-gray-600 dark:text-neutral-400">
            Добро пожаловать! Вы успешно вошли как пользователь.
          </p>
        </div>
      </div>
    </div>
  )
}
