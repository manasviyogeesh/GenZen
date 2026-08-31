import React, { useState } from 'react';
import { ClubItem, UserProfile, ScreenType } from '../../types';

interface ClubsScreenProps {
  user: UserProfile;
  clubs: ClubItem[];
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateClub: () => void;
}

export const ClubsScreen: React.FC<ClubsScreenProps> = ({
  user,
  clubs,
  onNavigate,
  onOpenCreateClub
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Clubs');
  const [joinedClubIds, setJoinedClubIds] = useState<string[]>(['club-ai']);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const categories = [
    'All Clubs',
    'Technical',
    'Cultural',
    'Sports',
    'Creative',
    'Entrepreneurship',
    'Research'
  ];

  const handleToggleJoin = (clubId: string, name: string) => {
    if (joinedClubIds.includes(clubId)) {
      setJoinedClubIds(joinedClubIds.filter((id) => id !== clubId));
      setFeedbackNotice(`Left ${name}.`);
    } else {
      setJoinedClubIds([...joinedClubIds, clubId]);
      setFeedbackNotice(`🎉 Successfully joined ${name}! Welcome to the circle.`);
    }
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const filteredClubs = clubs.filter(
    (c) => selectedCategory === 'All Clubs' || c.category === selectedCategory
  );

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 lg:p-12 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Center Feed Column */}
      <div className="flex-1 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f0a878] block mb-1">
              Clubs & Communities
            </span>
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Find your circle.
            </h1>
            <p className="font-body text-white/60 mt-1.5 text-lg">
              Connect with fellow builders, designers, researchers, and campus innovators.
            </p>
          </div>

          <button
            onClick={onOpenCreateClub}
            className="px-5 py-2.5 rounded-xl bg-[#c2652a] hover:bg-[#b05721] text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            Register Club
          </button>
        </header>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#c2652a] text-white shadow-sm'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {feedbackNotice && (
          <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl text-sm flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClubs.map((club) => {
            const isMember = joinedClubIds.includes(club.id);
            return (
              <div
                key={club.id}
                className="glass-card rounded-3xl p-6 md:p-7 border border-white/10 flex flex-col justify-between hover:border-[#c2652a]/40 transition-all shadow-xl group relative overflow-hidden"
              >
                <div>
                  {/* Top Bar: Icon + Activity + Match */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#c2652a]/20 border border-[#c2652a]/30 text-[#f0a878] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-2xl">{club.iconName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        {club.activityLevel}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-bold border border-cyan-500/20">
                        {club.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <h3 className="font-headline text-2xl font-bold text-white mb-2 group-hover:text-[#f0a878] transition-colors">
                    {club.name}
                  </h3>

                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-4">
                    {club.description}
                  </p>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-white/50 mb-4 pb-4 border-b border-white/10">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-white/40">groups</span>
                      {club.membersCount} Members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-white/40">account_tree</span>
                      {club.activeProjectsCount} Active Projects
                    </span>
                  </div>

                  {/* Match Reason */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-white/80 leading-snug mb-4">
                    <span className="text-[#f0a878] font-bold">Why it matches: </span>
                    {club.matchReason}
                  </div>

                  {club.nextEvent && (
                    <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-200 flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-sm text-cyan-400">event</span>
                      <span>Next: {club.nextEvent.title} ({club.nextEvent.time})</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleToggleJoin(club.id, club.name)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isMember
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-[#c2652a] hover:bg-[#b05721] text-white shadow-md'
                    }`}
                  >
                    {isMember ? 'Joined Circle ✓' : 'Join Community'}
                  </button>

                  <button
                    onClick={() => onNavigate('connect')}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Find Peers
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar (4 cols) */}
      <aside className="w-full lg:w-80 space-y-6">
        {/* Active Projects Recruiting */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-xl">rocket_launch</span>
            <h3 className="font-headline font-bold text-lg text-white">Projects Recruiting</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-2 hover:border-white/15 transition-all">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-white">Campus AI Assistant</h4>
                <span className="text-[10px] text-[#f0a878] font-bold">AI Club</span>
              </div>
              <p className="text-xs text-white/60">
                Building a multi-agent campus navigation bot.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {['Python', 'NLP', 'React Native'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-white/5 text-white/80 rounded border border-white/5">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-2 hover:border-white/15 transition-all">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-bold text-white">Smart Ag Robot</h4>
                <span className="text-[10px] text-cyan-400 font-bold">Robotics</span>
              </div>
              <p className="text-xs text-white/60">
                Autonomous soil quality sensor rover telemetry.
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {['C++', 'Arduino', 'Computer Vision'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-white/5 text-white/80 rounded border border-white/5">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Senior Quote Capsule */}
        <div className="bg-gradient-to-br from-[#c2652a]/20 to-purple-900/20 border border-[#c2652a]/30 rounded-2xl p-6 relative overflow-hidden shadow-xl space-y-4">
          <span className="material-symbols-outlined text-4xl text-[#f0a878]/30 absolute right-4 top-4">
            format_quote
          </span>

          <p className="text-sm text-white/90 italic leading-relaxed relative z-10">
            "Joining the AI club in my second semester completely changed my trajectory. I met my current co-founder there and we built three hackathon winners before graduating."
          </p>

          <div className="flex items-center gap-3 pt-2 border-t border-white/10 relative z-10">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Sarah Jenkins"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-headline font-bold text-base text-white">Sarah Jenkins</p>
              <p className="text-xs text-[#f0a878]">Class of '24 • Comp Sci</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
