'use client'

import { UserMainLayout } from '@/components/user/layout/UserMainLayout'
import { Calendar, Sparkles, Clock, Bell, CalendarCheck, Repeat, CalendarDays, Smartphone } from 'lucide-react'

export default function SchedulePage() {
  return (
    <UserMainLayout showRightSidebar={false}>
      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] pb-6">
        <div className="max-w-3xl w-full">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-[#1A1A1A] via-[#1A1A1A] to-[#FF6B35]/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header with animated gradient */}
            <div className="relative p-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35]/10 to-[#FF0844]/10 animate-pulse"></div>
              
              <div className="relative flex flex-col items-center text-center">
                {/* Icon */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF6B35] to-[#FF0844] rounded-full flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Title */}
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-[#FF6B35]" />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
                    Schedule
                  </h1>
                  <Sparkles className="w-6 h-6 text-[#FF0844]" />
                </div>

                {/* Subtitle */}
                <p className="text-xl text-gray-400 mb-2">Coming Very Soon!</p>
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-full">
                  <div className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-[#FF6B35]">In Development</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="p-8 pt-6">
              <p className="text-center text-gray-400 mb-8">
                Plan your fitness journey with our smart scheduling system
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Feature 1 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#FF6B35]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6B35]/20 to-[#FF0844]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <CalendarCheck className="w-6 h-6 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Book Sessions</h3>
                      <p className="text-sm text-gray-400">Schedule personal training sessions with your favorite trainers</p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#FF6B35]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6B35]/20 to-[#FF0844]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Bell className="w-6 h-6 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Smart Reminders</h3>
                      <p className="text-sm text-gray-400">Never miss a workout with customizable notifications</p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#FF6B35]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6B35]/20 to-[#FF0844]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Repeat className="w-6 h-6 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Recurring Events</h3>
                      <p className="text-sm text-gray-400">Set up weekly workout routines that fit your lifestyle</p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-[#0A0A0A] rounded-xl p-5 border border-white/5 hover:border-[#FF6B35]/30 transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6B35]/20 to-[#FF0844]/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-6 h-6 text-[#FF6B35]" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Calendar Sync</h3>
                      <p className="text-sm text-gray-400">Sync with Google Calendar, Apple Calendar and more</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Features Preview */}
              <div className="bg-gradient-to-r from-[#FF6B35]/5 to-[#FF0844]/5 rounded-xl p-6 border border-[#FF6B35]/10 mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <CalendarDays className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="text-white font-semibold">Schedule Features</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  <span className="px-3 py-1.5 bg-[#0A0A0A] rounded-full text-sm text-gray-300 border border-white/5">
                    📅 Day/Week/Month Views
                  </span>
                  <span className="px-3 py-1.5 bg-[#0A0A0A] rounded-full text-sm text-gray-300 border border-white/5">
                    🔔 Push Notifications
                  </span>
                  <span className="px-3 py-1.5 bg-[#0A0A0A] rounded-full text-sm text-gray-300 border border-white/5">
                    🔄 Reschedule Easily
                  </span>
                  <span className="px-3 py-1.5 bg-[#0A0A0A] rounded-full text-sm text-gray-300 border border-white/5">
                    ⏰ Time Zone Support
                  </span>
                  <span className="px-3 py-1.5 bg-[#0A0A0A] rounded-full text-sm text-gray-300 border border-white/5">
                    📱 Mobile Friendly
                  </span>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-r from-[#FF6B35]/5 to-[#FF0844]/5 rounded-xl p-6 border border-[#FF6B35]/10">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="text-white font-semibold">Expected Launch</h3>
                </div>
                <p className="text-center text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF0844] bg-clip-text text-transparent">
                  Coming in Q2 2026
                </p>
                <p className="text-center text-sm text-gray-400 mt-2">
                  We&apos;re building a seamless scheduling experience for your fitness journey
                </p>
              </div>

              {/* CTA */}
              <div className="mt-6 text-center">
                <button
                  disabled
                  className="px-8 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF0844] text-white font-semibold rounded-lg opacity-50 cursor-not-allowed"
                >
                  Notify Me When Available
                </button>
                <p className="text-xs text-gray-500 mt-2">Feature coming soon</p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Want to be the first to know? Follow us on social media for updates!
            </p>
          </div>
        </div>
      </div>
    </UserMainLayout>
  )
}
