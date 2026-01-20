'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { RoleCardData } from '../types/role.types'
import { User, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface RoleCardProps {
  data: RoleCardData
  isSelected: boolean
  onSelect: () => void
  onAction: () => void
}

export const RoleCard = ({ data, isSelected, onSelect, onAction }: RoleCardProps) => {
  const Icon = data.type === 'user' ? User : Dumbbell
  const buttonVariant = data.accentColor

  return (
    <Card
      className={cn(
        'p-6 cursor-pointer hover:shadow-xl transition-all duration-300',
        isSelected && data.type === 'user' && 'ring-4 ring-user-500 shadow-xl',
        isSelected && data.type === 'trainer' && 'ring-4 ring-trainer-500 shadow-xl'
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center',
            data.type === 'user' ? 'bg-user-100' : 'bg-trainer-100'
          )}
        >
          <Icon
            className={cn(
              'w-10 h-10',
              data.type === 'user' ? 'text-user-600' : 'text-trainer-600'
            )}
          />
        </div>

        <h3 className="text-2xl font-bold text-gray-900">{data.title}</h3>

        <p className="text-gray-600 text-sm leading-relaxed">{data.description}</p>

        <div className="flex flex-wrap gap-2 justify-center">
          {data.tags.map((tag) => (
            <Badge key={tag} variant={data.accentColor}>
              {tag}
            </Badge>
          ))}
        </div>

        <Button
          variant={buttonVariant}
          size="lg"
          fullWidth
          onClick={(e) => {
            e.stopPropagation()
            onAction()
          }}
        >
          Войти как {data.type === 'user' ? 'пользователь' : 'тренер'}
        </Button>
      </div>
    </Card>
  )
}
