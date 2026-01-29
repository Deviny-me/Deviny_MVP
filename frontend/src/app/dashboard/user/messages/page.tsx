'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { 
  Search,
  Send,
  MoreHorizontal,
  Phone,
  Video,
  Image as ImageIcon,
  Smile
} from 'lucide-react'
import { useState } from 'react'

interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
}

interface Message {
  id: string
  senderId: string
  text: string
  time: string
  isMe: boolean
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState<string | null>('1')
  const [newMessage, setNewMessage] = useState('')

  const chats: Chat[] = [
    { id: '1', name: 'Sarah Martinez', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', lastMessage: 'Great workout today! 💪', time: '2m', unread: 2, online: true },
    { id: '2', name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', lastMessage: 'See you at the gym tomorrow', time: '1h', unread: 0, online: false },
    { id: '3', name: 'Jessica Lee', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', lastMessage: 'Thanks for the tips!', time: '3h', unread: 0, online: true },
  ]

  const messages: Message[] = [
    { id: '1', senderId: '1', text: 'Hey! How was your workout?', time: '10:30 AM', isMe: false },
    { id: '2', senderId: 'me', text: 'It was great! Did 5x5 squats 🏋️', time: '10:32 AM', isMe: true },
    { id: '3', senderId: '1', text: 'Awesome! I\'m working on my deadlifts today', time: '10:35 AM', isMe: false },
    { id: '4', senderId: 'me', text: 'Nice! Remember to keep your back straight', time: '10:36 AM', isMe: true },
    { id: '5', senderId: '1', text: 'Great workout today! 💪', time: '10:40 AM', isMe: false },
  ]

  const selectedChatData = chats.find(c => c.id === selectedChat)

  const handleSend = () => {
    if (newMessage.trim()) {
      // Would send message to API here
      setNewMessage('')
    }
  }

  return (
    <UserMainLayout showLeftSidebar={false} showRightSidebar={false}>
      <div className="bg-[#1A1A1A] rounded-xl border border-white/10 overflow-hidden h-[calc(100vh-130px)]">
        <div className="flex h-full">
          {/* Chat List */}
          <div className="w-80 border-r border-white/10 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
                />
              </div>
            </div>

            {/* Chats */}
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors ${
                    selectedChat === chat.id ? 'bg-white/5' : ''
                  }`}
                >
                  <div className="relative">
                    {chat.avatar ? (
                      <img
                        src={chat.avatar}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                        <span className="text-white font-bold">{chat.name.charAt(0)}</span>
                      </div>
                    )}
                    {chat.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1A1A1A]" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                      <span className="text-xs text-gray-500">{chat.time}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{chat.unread}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedChatData ? (
            <div className="flex-1 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedChatData.avatar ? (
                    <img
                      src={selectedChatData.avatar}
                      alt={selectedChatData.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
                      <span className="text-white font-bold">{selectedChatData.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{selectedChatData.name}</h3>
                    <p className="text-xs text-gray-400">
                      {selectedChatData.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.isMe 
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white' 
                        : 'bg-[#0A0A0A] text-white'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-[10px] mt-1 ${message.isMe ? 'text-white/70' : 'text-gray-500'}`}>
                        {message.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    onClick={handleSend}
                    className="p-2.5 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full text-white hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0A0A0A] flex items-center justify-center">
                  <Send className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-sm text-gray-400">Choose a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserMainLayout>
  )
}
