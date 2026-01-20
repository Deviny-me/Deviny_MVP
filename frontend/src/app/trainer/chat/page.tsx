'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Search, MessageSquare, Users } from 'lucide-react'
import { useLanguage } from '@/components/language/LanguageProvider'

interface ChatContact {
  id: string
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  avatarColor: string
}

export default function TrainerChatPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  
  // Empty contacts array - data will come from API
  const contacts: ChatContact[] = []

  return (
    <div className="h-[calc(100vh-8rem)]">
      <Card className="h-full flex overflow-hidden">
        {/* Contacts List */}
        <div className="w-80 border-r border-gray-200 dark:border-neutral-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-50 mb-3">{t.chats}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder={`${t.search}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-gray-400 dark:text-neutral-500" />
                </div>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">{t.noChats}</p>
                <p className="text-gray-400 dark:text-neutral-500 text-xs mt-1">{t.chatsWillAppear}</p>
              </div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors border-b border-gray-100 dark:border-neutral-700"
                >
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full ${contact.avatarColor} flex items-center justify-center text-white font-semibold`}>
                      {contact.initials}
                    </div>
                    {contact.online && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 dark:text-neutral-50 truncate">{contact.name}</p>
                      <span className="text-xs text-gray-500 dark:text-neutral-400">{contact.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 truncate">{contact.lastMessage}</p>
                  </div>
                  {contact.unread > 0 && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-medium">{contact.unread}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area - Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-900">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-gray-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-neutral-50 mb-2">{t.noActiveChats}</h3>
          <p className="text-gray-500 dark:text-neutral-400 text-center max-w-sm">
            {t.chatClientsDescription}
          </p>
        </div>
      </Card>
    </div>
  )
}
