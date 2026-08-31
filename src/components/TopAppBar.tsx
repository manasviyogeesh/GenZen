import React, { useState } from 'react';
import { UserProfile, ScreenType } from '../types';

interface TopAppBarProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  user,
  onNavigate,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search campus signals, clubs, events, seniors...'
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifications = [
    { id: 1, title: 'AI Hackathon', desc: 'Aarav N invited you to join team NeuralNova', time: '10m ago', unread: true },
    { id: 2, title: 'Robotics Club', desc: '5 new project roles posted in computer vision', time: '1h ago', unread: true },
    { id: 3, title: 'Senior POV', desc: 'Aarav answered your question on internship prep', time: '3h ago', unread: true },
  ];

  return (
    <header className="hidden md:flex fixed top-0 right-0 w-[calc(100%-16rem)] z-30 bg-[#0d0c0f]/80 backdrop-blur-md border-b border-white/10 justify-between items-center px-8 h-16 transition-all">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#c2652a] focus:ring-1 focus:ring-[#c2652a] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 text-white/80 relative">
        {/* Live campus status badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Campus Pulse: Live
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors relative"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c2652a] rounded-full ring-2 ring-[#0d0c0f]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#16151b] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
                <span className="font-headline font-bold text-base text-white">Notifications</span>
                <span className="text-xs text-[#f0a878]">Mark all read</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{n.title}</p>
                      <span className="text-[10px] text-white/40">{n.time}</span>
                    </div>
                    <p className="text-xs text-white/70 mt-1 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User profile avatar thumbnail */}
        <button
          onClick={() => onNavigate('connect')}
          className="flex items-center gap-2 p-1 rounded-full hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
        >
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover border border-white/20"
          />
        </button>
      </div>
    </header>
  );
};
