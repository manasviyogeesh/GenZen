import React from 'react';
import { UserProfile, SignalItem, ScreenType } from '../../types';

interface HomeScreenProps {
  user: UserProfile;
  signals: SignalItem[];
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateModal: () => void;
  onEditProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  signals,
  onNavigate,
  onOpenCreateModal,
  onEditProfile
}) => {
  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10">
      {/* Top Banner Heading */}
      <header className="space-y-3">
        <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-none">
          What's happening <span className="italic text-[#c2652a] font-normal">on campus?</span>
        </h1>
        <p className="font-body text-white/70 text-lg md:text-xl max-w-3xl leading-relaxed">
          GenZen knows what's moving, who's looking, and what's worth your attention.
        </p>
      </header>

      {/* Trending Signals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-headline text-xl font-bold">
            <span className="material-symbols-outlined text-[#f0a878]">local_fire_department</span>
            <span>Trending Signals</span>
          </div>
          <button
            onClick={() => onNavigate('pulse')}
            className="text-xs font-semibold text-white/60 hover:text-[#f0a878] transition-colors"
          >
            View All
          </button>
        </div>

        {/* Signals 3-column cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Signal 1 */}
          <div
            onClick={() => onNavigate('pulse')}
            className="glass-card rounded-2xl p-6 border border-white/10 hover:border-[#c2652a]/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#c2652a]/15 text-[#f0a878] flex items-center justify-center mb-4 border border-[#c2652a]/20">
                <span className="material-symbols-outlined text-xl">trending_up</span>
              </div>
              <p className="text-white text-base leading-snug">
                <span className="text-[#f0a878] font-semibold">🔥 AI Hackathon registrations</span> are trending.{' '}
                <strong className="text-white font-bold">127 students</strong> joined this week.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>Just now</span>
            </div>
          </div>

          {/* Signal 2 */}
          <div
            onClick={() => onNavigate('clubs')}
            className="glass-card rounded-2xl p-6 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center mb-4 border border-cyan-500/20">
                <span className="material-symbols-outlined text-xl">emoji_objects</span>
              </div>
              <p className="text-white text-base leading-snug">
                The Robotics Club just opened{' '}
                <span className="text-cyan-400 font-semibold underline decoration-cyan-400/40 underline-offset-2">
                  5 project positions
                </span>
                .
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>2h ago</span>
            </div>
          </div>

          {/* Signal 3 */}
          <div
            onClick={() => onNavigate('connect')}
            className="glass-card rounded-2xl p-6 border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center mb-4 border border-amber-500/20">
                <span className="material-symbols-outlined text-xl">group_add</span>
              </div>
              <p className="text-white text-base leading-snug">
                <strong className="text-amber-400 font-bold">24 students</strong> are actively looking for teammates for the upcoming Game Jam.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs text-white/40">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>4h ago</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: User Profile (Left) + Intelligence Recommendations & Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: User Profile Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 space-y-6 sticky top-24">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#c2652a]/40 shadow-xl">
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-[#141318]"></span>
              </div>
              <h2 className="font-headline text-3xl font-bold text-white mb-0.5">{user.name}</h2>
              <p className="text-sm text-white/60 font-medium mb-3">{user.department} • {user.year}</p>
              
              <div className="flex items-center gap-1.5 text-xs text-white/70 mb-4 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <span className="material-symbols-outlined text-sm text-[#f0a878]">groups</span>
                <span>{user.connectionsCount} Connections</span>
              </div>

              {/* Status Badge */}
              <div className="w-full py-1.5 px-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                OPEN TO COLLABORATE
              </div>
            </div>

            <div className="space-y-4 text-left border-t border-white/10 pt-5">
              {/* Interests */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/90"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/90"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Looking For */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Looking For</h4>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-xs text-white/80 leading-relaxed">
                  Project teammates, Hackathons, Research opportunities.
                </div>
              </div>
            </div>

            <button
              onClick={onEditProfile}
              className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profile
            </button>
          </div>
        </div>

        {/* Right Column: Recommendations, Campus Highlights & Schedule (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Matches for You Header */}
          <div className="space-y-4">
            <h3 className="font-headline text-2xl font-bold text-white flex items-center gap-2">
              <span>Recommended for</span>
              <span className="text-[#f0a878] italic">you</span>
            </h3>

            {/* 3 cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Hackathon */}
              <div
                onClick={() => onNavigate('events')}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-[#c2652a]/40 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold bg-[#c2652a]/20 text-[#f0a878] px-2.5 py-1 rounded-full border border-[#c2652a]/30">
                      6 days left
                    </span>
                  </div>
                  <h4 className="font-headline text-lg font-bold text-white mb-2">AI for Good Hackathon</h4>
                  <ul className="text-xs text-white/70 space-y-1 mb-4">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      3 of your skills match
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">groups</span>
                      42 students attending
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-white/10 text-[11px] text-white/50 leading-tight">
                  Highly recommended based on your interest in AI and Hackathons.
                </div>
              </div>

              {/* Card 2: AI Club */}
              <div
                onClick={() => onNavigate('clubs')}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">memory</span>
                    </div>
                    <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      91% Match
                    </span>
                  </div>
                  <h4 className="font-headline text-lg font-bold text-white mb-2">AI Club</h4>
                  <ul className="text-xs text-white/70 space-y-1 mb-4">
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">account_tree</span>
                      3 active projects
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">groups</span>
                      84 members
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-white/10 text-[11px] text-cyan-300/80 leading-tight">
                  91% match based on your interest in AI.
                </div>
              </div>

              {/* Card 3: Potential Teammates */}
              <div
                onClick={() => onNavigate('connect')}
                className="glass-card rounded-2xl p-5 border border-white/10 hover:border-purple-500/40 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      <img
                        className="w-7 h-7 rounded-full border-2 border-[#16151b] object-cover"
                        src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                        alt="Aarav"
                      />
                      <img
                        className="w-7 h-7 rounded-full border-2 border-[#16151b] object-cover"
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                        alt="Priya"
                      />
                      <div className="w-7 h-7 rounded-full border-2 border-[#16151b] bg-white/10 text-[10px] text-white flex items-center justify-center font-bold">
                        +5
                      </div>
                    </div>
                  </div>
                  <h4 className="font-headline text-lg font-bold text-white mb-1">Potential Teammates</h4>
                  <p className="text-xs text-white/70 leading-snug mb-3">
                    Students with complementary skills are looking for partners too.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 text-[11px] text-purple-300/80 leading-tight">
                  These students lack your Python & SQL skills for their projects.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                <span className="material-symbols-outlined text-sm text-pink-400">trending_up</span>
                Trending
              </div>
              <p className="font-headline text-lg font-bold text-white">Generative AI</p>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                ↑ 24%
              </span>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                <span className="material-symbols-outlined text-sm text-cyan-400">groups</span>
                Active Club
              </div>
              <p className="font-headline text-lg font-bold text-white">AI Club</p>
              <span className="text-xs text-white/50 mt-1 block">12 new convos</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                <span className="material-symbols-outlined text-sm text-[#f0a878]">handshake</span>
                Collabs
              </div>
              <p className="font-headline text-2xl font-bold text-[#f0a878]">18</p>
              <span className="text-xs text-white/50 mt-0.5 block">5 match your skills</span>
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-white/50 uppercase tracking-wider font-semibold mb-1">
                <span className="material-symbols-outlined text-sm text-amber-400">event</span>
                Next Up
              </div>
              <p className="font-headline text-lg font-bold text-white truncate">Design Jam</p>
              <span className="text-xs text-white/50 mt-1 block">Tmrw • 4:30 PM</span>
            </div>
          </div>

          {/* Weekly Schedule Strip */}
          <div className="glass-card rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline text-lg font-bold text-white">This Week's Campus Flow</h4>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-semibold text-[#f0a878] hover:underline flex items-center gap-1"
              >
                View full calendar <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Mon</span>
                <p className="text-xs font-semibold text-white">AI Workshop</p>
              </div>

              <div className="bg-[#c2652a]/20 p-3 rounded-xl border border-[#c2652a]/50 text-center">
                <span className="text-[10px] uppercase font-bold text-[#f0a878] block mb-1">Tue</span>
                <p className="text-xs font-bold text-[#fbe8d8]">Design Jam</p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Wed</span>
                <p className="text-xs font-semibold text-white">Hackathon Meetup</p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Thu</span>
                <p className="text-xs font-semibold text-white">Robotics Demo</p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">Fri</span>
                <p className="text-xs font-semibold text-white">Startup Talk</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
