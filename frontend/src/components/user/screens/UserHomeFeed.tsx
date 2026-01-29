'use client'

import { useRouter } from 'next/navigation'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Image as ImageIcon,
  Video,
  Award,
  ThumbsUp,
  Send,
  Flame,
  Trophy,
  Target
} from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@/components/user/UserProvider'

interface Post {
  id: number
  userId: string
  userName: string
  userAvatar?: string
  type: string
  image?: string
  caption: string
  likes: number
  comments: number
  timestamp: string
}

interface DailyChallenge {
  id: string
  title: string
  description: string
  xp: number
  progress: number
  total: number
  completed: boolean
}

export function UserHomeFeed() {
  const router = useRouter()
  const { user } = useUser()
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set())
  const dailyChallenges: DailyChallenge[] = []
  const mockPosts: Post[] = []

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Daily Challenges */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-white">Daily Challenges</h3>
          </div>
          <button 
            onClick={() => router.push('/dashboard/user/challenges')}
            className="text-xs text-[#FF6B35] hover:underline"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dailyChallenges.map((challenge) => (
            <div 
              key={challenge.id}
              className={`p-3 rounded-lg border transition-all ${
                challenge.completed 
                  ? 'bg-[#FF6B35]/10 border-[#FF6B35]/30'
                  : 'bg-[#0A0A0A] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{challenge.title}</span>
                <span className="text-xs font-bold text-[#FF6B35]">+{challenge.xp} XP</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{challenge.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full transition-all"
                    style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400">
                  {challenge.progress}/{challenge.total}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post Card */}
      <div className="bg-[#1A1A1A] rounded-lg border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {user?.fullName?.charAt(0) || 'U'}
            </span>
          </div>
          <button className="flex-1 px-4 py-3 bg-[#0A0A0A] hover:bg-[#262626] border border-white/10 rounded-full text-left text-sm text-gray-400 transition-colors">
            Share your fitness journey...
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors">
            <ImageIcon className="w-5 h-5 text-[#FF6B35]" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Photo</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors">
            <Video className="w-5 h-5 text-green-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Video</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded hover:bg-white/5 transition-colors">
            <Award className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
            <span className="text-sm font-medium text-gray-300">Achievement</span>
          </button>
        </div>
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500 font-medium">Recent Activity</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Posts Feed */}
      {mockPosts.map((post) => (
        <div key={post.id} className="bg-[#1A1A1A] rounded-lg border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
          {/* Post Header */}
          <div className="p-4 flex items-start gap-3">
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.userName}
                className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => router.push('/dashboard/user/profile')}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF0844] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => router.push('/dashboard/user/profile')}
              >
                <span className="text-white font-bold">{post.userName.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <button 
                    onClick={() => router.push('/dashboard/user/profile')}
                    className="font-semibold text-white hover:underline"
                  >
                    {post.userName}
                  </button>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fitness Enthusiast • Level {user?.level || 1}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    {post.timestamp}
                  </p>
                </div>
                <button className="p-2 -mt-2 -mr-2 rounded-full hover:bg-white/5 transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-4 pb-3">
            <p className="text-white text-sm leading-relaxed whitespace-pre-line">
              {post.caption}
            </p>
          </div>

          {/* Post Image */}
          {post.image && (
            <img
              src={post.image}
              alt="Post"
              className="w-full max-h-[500px] object-cover cursor-pointer"
            />
          )}

          {/* Post Stats */}
          <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-400 border-t border-white/5">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-[#FF6B35] flex items-center justify-center border border-[#1A1A1A]">
                  <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center border border-[#1A1A1A]">
                  <Heart className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              </div>
              <span className="ml-1">{post.likes}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="hover:underline">{post.comments} comments</button>
              <button className="hover:underline">24 shares</button>
            </div>
          </div>

          {/* Post Actions */}
          <div className="px-2 py-1.5 border-t border-white/10 flex items-center gap-1">
            <button 
              onClick={() => toggleLike(post.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded hover:bg-white/5 transition-colors ${
                likedPosts.has(post.id) ? 'text-[#FF6B35]' : 'text-gray-400'
              }`}
            >
              <ThumbsUp 
                className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-[#FF6B35]' : ''}`} 
                strokeWidth={1.5} 
              />
              <span className="text-sm font-medium">Like</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded hover:bg-white/5 transition-colors text-gray-400">
              <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">Comment</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded hover:bg-white/5 transition-colors text-gray-400">
              <Share2 className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">Share</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded hover:bg-white/5 transition-colors text-gray-400">
              <Send className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-sm font-medium">Send</span>
            </button>
          </div>
        </div>
      ))}

      {/* Load More */}
      <div className="flex justify-center py-4">
        <button className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#262626] border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
          Show more posts
        </button>
      </div>
    </div>
  )
}
