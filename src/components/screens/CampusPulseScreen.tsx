import React, { useState } from 'react';
import { UserProfile, ScreenType } from '../../types';

interface CampusPulseScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
}

export const CampusPulseScreen: React.FC<CampusPulseScreenProps> = ({
  user,
  onNavigate
}) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'this_week' | 'this_month'>('this_week');
  const [searchPulse, setSearchPulse] = useState('');
  const [expandedWhy, setExpandedWhy] = useState(false);

  const sparklineData = [12, 24, 18, 45, 68, 85, 110];

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 lg:p-12 max-w-6xl mx-auto relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-12">
        {/* Header Section */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-blue-400 border border-blue-400/30 px-3.5 py-1 rounded-full bg-blue-500/10">
                  The Campus, Right Now
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white leading-tight tracking-tight">
                What's happening<br />on campus?
              </h1>
              <p className="text-lg md:text-xl text-white/60 font-body mt-3">
                GenZen turns everyday campus activity into signals worth knowing.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                <span className="text-sm font-medium text-white">Campus activity: Live</span>
              </div>

              {/* Time filter switcher */}
              <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10 shadow-sm">
                <button
                  onClick={() => setTimeFilter('today')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeFilter === 'today'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeFilter('this_week')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeFilter === 'this_week'
                      ? 'bg-white/15 text-white shadow-sm border border-white/10'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setTimeFilter('this_month')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    timeFilter === 'this_month'
                      ? 'bg-white/15 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xl">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              search
            </span>
            <input
              type="text"
              value={searchPulse}
              onChange={(e) => setSearchPulse(e.target.value)}
              placeholder="Search campus signals..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-2xl pl-12 pr-4 py-3.5 shadow-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all placeholder:text-white/40 text-sm"
            />
          </div>
        </header>

        {/* Subtle Prototype Divider */}
        <div className="flex items-center justify-center gap-4 opacity-50">
          <div className="h-px bg-white/20 flex-1 max-w-[120px]"></div>
          <p className="text-[10px] text-white/50 italic font-semibold tracking-[0.2em] uppercase">
            Prototype Campus Data
          </p>
          <div className="h-px bg-white/20 flex-1 max-w-[120px]"></div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Hero Signal: Trending Right Now (8 cols) */}
          <div className="md:col-span-8 glass-card border border-white/10 rounded-[2rem] p-8 lg:p-10 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-blue-400 text-xl">trending_up</span>
                <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                  Trending Right Now
                </span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-2 tracking-tight">
                Generative AI
              </h2>
              
              <div className="flex items-end gap-3 mb-6">
                <span className="text-xl font-light text-white/70">Interest surging</span>
                <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> 24%
                </span>
              </div>

              {expandedWhy && (
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-2 mb-6 animate-in fade-in duration-300">
                  <p className="font-semibold text-white">Why is Generative AI surging on campus?</p>
                  <p>• 42 new students registered for the AI for Good Hackathon today.</p>
                  <p>• 3 research professors announced funded undergraduate LLM lab assistantships.</p>
                  <p>• AI Club membership grew +18% over the past 72 hours.</p>
                </div>
              )}
            </div>

            {/* Abstract Sparkline Bar Visualization */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 relative z-10">
              <div className="flex-1 h-20 flex items-end gap-2 px-2 w-full max-w-sm">
                {sparklineData.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group/bar">
                    <div
                      style={{ height: `${(val / 110) * 100}%` }}
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        idx === sparklineData.length - 1
                          ? 'bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.6)]'
                          : 'bg-blue-500/40 hover:bg-blue-500/70'
                      }`}
                    ></div>
                    <span className="text-[9px] text-white/40">d{idx + 1}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setExpandedWhy(!expandedWhy)}
                className="group-hover:bg-blue-500 group-hover:text-white border border-blue-500/40 text-blue-400 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 bg-blue-500/10 active:scale-95"
              >
                <span>{expandedWhy ? 'Close insight' : 'Explore why'}</span>
                <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Personalized Pulse: Your Pulse Manasvi (4 cols) */}
          <div className="md:col-span-4 glass-card border border-white/10 rounded-[2rem] p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center gap-3.5 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c2652a]/40 p-0.5 shrink-0">
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Your Pulse</p>
                <h3 className="text-xl font-headline font-bold text-white leading-tight">{user.name}</h3>
              </div>
            </div>

            <p className="text-white/60 text-sm leading-relaxed mb-6 relative z-10">
              Based on your {user.department} background, here's what matters to you this week.
            </p>

            <div className="space-y-3 relative z-10">
              {/* Notification 1 */}
              <div
                onClick={() => onNavigate('clubs')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-purple-400 mt-0.5 text-xl">campaign</span>
                <p className="text-sm text-white font-medium leading-snug group-hover:text-purple-300 transition-colors">
                  3 new ML project openings match your skills.
                </p>
              </div>

              {/* Notification 2 */}
              <div
                onClick={() => onNavigate('connect')}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-start gap-3 transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-blue-400 mt-0.5 text-xl">group_add</span>
                <p className="text-sm text-white font-medium leading-snug group-hover:text-blue-300 transition-colors">
                  4 teams looking for Frontend devs for the Hackathon.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Signals Stream */}
        <section className="space-y-4 pt-4">
          <h3 className="font-headline text-2xl font-bold text-white">Live Activity Stream</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span className="font-semibold uppercase tracking-wider text-orange-400">Hackathons</span>
                <span>5m ago</span>
              </div>
              <p className="text-sm text-white font-medium">Team "Algoverse" submitted project demo in AI & Healthcare.</p>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span className="font-semibold uppercase tracking-wider text-emerald-400">Robotics</span>
                <span>25m ago</span>
              </div>
              <p className="text-sm text-white font-medium">Rover telemetry test completed with 99.4% precision.</p>
            </div>

            <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span className="font-semibold uppercase tracking-wider text-cyan-400">Senior Advice</span>
                <span>1h ago</span>
              </div>
              <p className="text-sm text-white font-medium">45 upvotes on placement preparation roadmap guide.</p>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <footer className="text-center pt-8 border-t border-white/10">
          <p className="text-xs text-white/40 font-medium tracking-wide">
            GenZen Campus Pulse © 2026 • Real-Time Campus Intelligence Network
          </p>
        </footer>
      </div>
    </div>
  );
};
