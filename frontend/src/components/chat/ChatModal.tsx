'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { messagesApi } from '@/lib/api/messagesApi';
import { MessageDto } from '@/types/message';
import { MEDIA_BASE_URL } from '@/lib/config';
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'

interface ChatModalProps {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  otherUserRole?: string | null;
  onClose: () => void;
}

export default function ChatModal({ otherUserId, otherUserName, otherUserAvatarUrl, otherUserRole, onClose }: ChatModalProps) {
  const accent = useAccentColors()
  const peerAccent = otherUserRole ? getAccentColorsByRole(otherUserRole) : accent
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const loadingRef = useRef(false);

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(
          (payload.sub ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'])?.toLowerCase()
        );
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  // Load conversation and messages
  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get or create conversation
        const { conversationId: convId } = await messagesApi.getOrCreateConversation(otherUserId);
        setConversationId(convId);

        // Load messages
        const msgs = await messagesApi.getConversationMessages(convId);
        setMessages(msgs);

        // Mark messages as read
        await messagesApi.markMessagesAsRead(convId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation');
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadConversation();
  }, [otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending || !conversationId) return;

    const text = newMessage.trim();

    try {
      setIsSending(true);
      setNewMessage('');

      const message = await messagesApi.sendMessage(conversationId, { text });
      setMessages((prev) => [...prev, message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] rounded-xl border border-white/10 w-full max-w-2xl h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {otherUserAvatarUrl ? (
              <img
                src={`${MEDIA_BASE_URL}${otherUserAvatarUrl}`}
                alt={otherUserName}
                className={`w-10 h-10 rounded-full object-cover ${getRoleRingClass(otherUserRole)}`}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${peerAccent.gradient} flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">
                  {otherUserName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">{otherUserName}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">Send a message to start the conversation</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.senderId.toLowerCase() === currentUserId;
              return (
                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%]`}>
                    {/* Reply preview */}
                    {message.replyTo && (
                      <div className={`mb-1 px-3 py-1.5 border-l-2 ${accent.border} bg-white/5 rounded text-xs text-gray-400`}>
                        <span className="font-medium text-gray-300">{message.replyTo.senderName}</span>
                        <p className="truncate">{message.replyTo.text}</p>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-3 ${
                        isMe
                          ? `${accent.bg} text-white rounded-br-sm`
                          : 'border-2 border-gray-700 bg-[#1A1A1A] text-white rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-1">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {isMe && message.readAt && ' · Read'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className={`flex-1 bg-[#0A0A0A] text-white rounded-lg px-4 py-2 text-sm focus:outline-none ${accent.focusBorder}`}
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className={`p-2 bg-gradient-to-r ${accent.gradient} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
