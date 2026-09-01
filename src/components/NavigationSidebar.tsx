import React from 'react';
import { ScreenType, UserProfile } from '../types';

interface NavigationSidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateModal: () => void;
  user: UserProfile;
  onLogout: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentScreen,
  onNavigate,
  onOpenCreateModal,
  user,
  onLogout
}) => {
  const navItems: { id: ScreenType; label: string; icon: string; color: string }[] = [
    { id: 'home', label: 'Home', icon: 'home', color: 'text-white' },
    { id: 'ai', label: 'GenZen AI', icon: 'smart_toy', color: 'text-purple-400' },
    { id: 'connect', label: 'Connect', icon: 'group', color: 'text-cyan-400' },
    { id: 'alumni', label: 'Alumni', icon: 'school', color: 'text-[#f0a878]' },
    { id: 'clubs', label: 'Clubs', icon: 'groups', color: 'text-emerald-400' },
    { id: 'events', label: 'Events', icon: 'calendar_today', color: 'text-orange-400' },
    { id: 'senior_pov', label: 'Senior POV', icon: 'psychology', color: 'text-rose-400' },
    { id: 'pulse', label: 'Campus Pulse', icon: 'insights', color: 'text-blue-400' },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#131217] border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#c2652a]/20 border border-[#c2652a]/40 flex items-center justify-center font-headline text-lg font-bold text-[#f0a878]">
            GZ
          </div>
          <div>
            <span className="font-headline font-bold text-lg text-white">GenZen</span>
            <span className="text-[10px] text-white/50 block -mt-1">Campus Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="px-3 py-1.5 bg-[#c2652a] text-white rounded-lg text-xs font-semibold hover:bg-[#b05721] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            New
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#141318]/95 backdrop-blur-lg border-t border-white/10 py-2 px-1 z-50 flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
              className={`flex flex-col items-center py-1 px-1.5 rounded-lg text-center transition-all ${
                isActive ? 'text-[#f0a878] font-bold' : 'text-white/60 hover:text-white'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#f0a878]' : item.color}`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] truncate max-w-[48px]">{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#131217]/95 backdrop-blur-xl border-r border-white/10 p-4 gap-2 z-40 select-none">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => onNavigate('home')}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#c2652a] via-[#e08850] to-[#fbe8d8] p-0.5 shadow-md shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#131217] flex items-center justify-center overflow-hidden">
              <span className="font-headline font-black text-xl text-[#f0a878]">G</span>
            </div>
          </div>
          <div>
            <h1 className="font-headline font-bold text-xl text-white tracking-tight leading-tight">GenZen AI</h1>
            <p className="text-xs text-white/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Always Active
            </p>
          </div>
        </div>

        {/* Navigation Link Items with strict XPath compatibility */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar pr-1">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <a
                key={item.id}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.id);
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#c2652a]/20 text-[#fbe8d8] font-bold border border-[#c2652a]/30 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] transition-colors ${
                    isActive ? 'text-[#f0a878]' : item.color
                  }`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="font-body text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#f0a878]"></span>
                )}
              </a>
            );
          })}

          {/* What If Link */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('pulse');
            }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all group"
          >
            <span className="material-symbols-outlined text-[20px] text-yellow-400">psychology_alt</span>
            <span className="font-body text-sm tracking-wide">What If?</span>
          </a>
        </nav>

        {/* Bottom User Card and CTA */}
        <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-3">
          <button
            onClick={onOpenCreateModal}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#c2652a] to-[#d4703a] hover:from-[#b05721] hover:to-[#c2652a] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#c2652a]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Event
          </button>

          {/* User profile capsule */}
          <div
            onClick={() => onNavigate('connect')}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0">
              <img src={user.avatarUrl || user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.department} • {user.year}</p>
            </div>
            <span className="material-symbols-outlined text-white/40 group-hover:text-white/80 text-[18px]">
              chevron_right
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white/80 hover:text-white flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
