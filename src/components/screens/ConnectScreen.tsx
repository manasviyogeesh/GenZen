import React, { useState } from 'react';
import { UserProfile, TeammateCandidate, ScreenType } from '../../types';

interface ConnectScreenProps {
  user: UserProfile;
  candidates: TeammateCandidate[];
  onNavigate: (screen: ScreenType) => void;
  onOpenTeamBuilder: () => void;
  onSendConnectionRequest: (candidate: TeammateCandidate) => void;
  onAcceptConnection: (candidate: TeammateCandidate) => void;
  onPassCandidate: (candidate: TeammateCandidate) => void;
  connectedCount: number;
  recentConnections: { id: string; name: string; relation: string; avatar: string }[];
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({
  user,
  candidates,
  onNavigate,
  onOpenTeamBuilder,
  onSendConnectionRequest,
  onAcceptConnection,
  onPassCandidate,
  connectedCount,
  recentConnections
}) => {
  const [activeTab, setActiveTab] = useState<'for_you' | 'looking_for_teams' | 'looking_for_projects'>('for_you');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [starredList, setStarredList] = useState<string[]>([]);

  const hasCandidates = candidates.length > 0;
  const currentCandidate = hasCandidates ? candidates[candidateIndex % candidates.length] : null;

  const handleSkip = () => {
    if (!currentCandidate) {
      return;
    }

    onPassCandidate(currentCandidate);
    setActionFeedback(`Passed on ${currentCandidate.name}. Showing next match.`);
    setTimeout(() => setActionFeedback(null), 2500);
    setCandidateIndex((prev) => prev + 1);
  };

  const handleStar = () => {
    if (!currentCandidate) {
      return;
    }

    if (!starredList.includes(currentCandidate.id)) {
      setStarredList([...starredList, currentCandidate.id]);
      setActionFeedback(`Saved ${currentCandidate.name} to your starred shortlist.`);
    } else {
      setStarredList(starredList.filter(id => id !== currentCandidate.id));
      setActionFeedback(`Removed ${currentCandidate.name} from shortlist.`);
    }
    setTimeout(() => setActionFeedback(null), 2500);
  };

  const handleConnect = () => {
    if (!currentCandidate) {
      return;
    }

    if (currentCandidate.relationshipStatus === 'incoming_pending') {
      onAcceptConnection(currentCandidate);
      setActionFeedback(`Connected with ${currentCandidate.name}.`);
    } else if (currentCandidate.relationshipStatus === 'connect' || currentCandidate.relationshipStatus === 'pass') {
      onSendConnectionRequest(currentCandidate);
      setActionFeedback(`Connection request sent to ${currentCandidate.name}.`);
    }

    setTimeout(() => setActionFeedback(null), 3000);
    setCandidateIndex((prev) => prev + 1);
  };

  const connectLabel = !currentCandidate
    ? 'Connect'
    : currentCandidate.relationshipStatus === 'connected'
      ? 'Connected'
      : currentCandidate.relationshipStatus === 'pending'
        ? 'Pending'
        : currentCandidate.relationshipStatus === 'incoming_pending'
          ? 'Accept'
          : 'Connect';

  const connectDisabled = !currentCandidate
    || currentCandidate.relationshipStatus === 'connected'
    || currentCandidate.relationshipStatus === 'pending';

  return (
    <div className="flex-1 min-h-screen p-6 md:p-8 lg:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Left/Center Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="mb-6">
          <h2 className="font-headline text-4xl sm:text-5xl font-bold text-white tracking-tight">CONNECT</h2>
          <p className="font-body text-white/60 mt-1.5 text-lg">Find your people.</p>
        </header>

        {/* Sub Nav Tabs */}
        <div className="flex gap-6 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('for_you')}
            className={`pb-3 text-sm font-semibold transition-all relative ${
              activeTab === 'for_you'
                ? 'text-white border-b-2 border-[#c2652a]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setActiveTab('looking_for_teams')}
            className={`pb-3 text-sm font-medium transition-all ${
              activeTab === 'looking_for_teams'
                ? 'text-white border-b-2 border-[#c2652a]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Looking for Teams
          </button>
          <button
            onClick={() => setActiveTab('looking_for_projects')}
            className={`pb-3 text-sm font-medium transition-all ${
              activeTab === 'looking_for_projects'
                ? 'text-white border-b-2 border-[#c2652a]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Looking for Projects
          </button>
        </div>

        {/* Action toast feedback */}
        {actionFeedback && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#c2652a]/20 border border-[#c2652a]/40 text-[#fbe8d8] text-sm flex items-center gap-2 animate-in fade-in duration-200">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Main Discovery Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 flex-1 flex flex-col relative overflow-hidden border border-white/10 shadow-2xl">
          {!currentCandidate ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-14 px-4">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-white/70">group_off</span>
              </div>
              <h3 className="font-headline text-3xl font-bold text-white">No profiles yet</h3>
              <p className="text-white/60 mt-2 max-w-md">
                As more students sign up and complete profiles, they will appear here automatically.
              </p>
            </div>
          ) : (
            <>
          {/* Match Score Badge */}
          <div className="absolute top-6 right-6 bg-[#c2652a]/20 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-[#c2652a]/40 shadow-sm backdrop-blur-md">
            <span className="material-symbols-outlined text-sm text-cyan-400" style={{ fontVariationSettings: "'FILL' 1" }}>
              stars
            </span>
            <span>{currentCandidate.matchScore}% Match</span>
          </div>

          <div className={`absolute top-16 right-6 text-[10px] px-2 py-0.5 rounded-full border font-bold ${
            currentCandidate.presenceLabel === 'Online now'
              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
              : currentCandidate.presenceLabel === 'Active recently'
                ? 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
                : 'text-white/60 border-white/15 bg-white/5'
          }`}>
            {currentCandidate.presenceLabel}
          </div>

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8 relative z-10">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/15 shrink-0 shadow-2xl">
              <img
                src={currentCandidate.avatarUrl}
                alt={currentCandidate.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pt-1">
              <h3 className="font-headline text-3xl font-bold text-white mb-1">{currentCandidate.name}</h3>
              <p className="font-body text-white/60 text-sm font-medium mb-3 tracking-wide">
                {currentCandidate.department} • {currentCandidate.year}
              </p>
              <p className="font-body text-white/90 text-base max-w-lg leading-relaxed italic">
                {currentCandidate.bio}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 flex-1 relative z-10">
            {/* Skills */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest text-white/50 mb-2.5 font-semibold">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {currentCandidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest text-white/50 mb-2.5 font-semibold">Interests</h4>
              <div className="flex flex-wrap gap-2">
                {currentCandidate.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white/90"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {/* Looking for */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest text-white/50 mb-2.5 font-semibold">Looking for</h4>
              <div className="flex flex-wrap gap-2">
                {currentCandidate.lookingFor.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 bg-[#c2652a]/10 border border-dashed border-[#c2652a]/40 rounded-full text-xs font-medium text-white"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <h4 className="text-[11px] uppercase tracking-widest text-white/50 mb-2.5 font-semibold">Availability</h4>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[18px]">event</span>
                <span>{currentCandidate.availability}</span>
              </p>
            </div>
          </div>

          {/* Match Reason Banner */}
          <div className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/10 relative z-10">
            <p className="text-sm text-white/80 leading-relaxed">
              <strong className="text-white font-semibold">Why this match?</strong> {currentCandidate.matchReason}
            </p>
            <div className="mt-2.5 space-y-1 text-xs text-white/75">
              {currentCandidate.matchReasonBullets.map((reason) => (
                <p key={reason}>✓ {reason}</p>
              ))}
            </div>
          </div>

          {/* Tinder/Discovery Controls */}
          <div className="flex justify-center items-center gap-6 mt-auto relative z-10 pt-4 border-t border-white/10">
            {/* Skip */}
            <button
              onClick={handleSkip}
              title="Pass / Next"
              className="w-14 h-14 rounded-full border border-white/20 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center bg-[#141318]/70 backdrop-blur-sm active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Star Shortlist */}
            <button
              onClick={handleStar}
              title="Bookmark / Shortlist"
              className={`w-14 h-14 rounded-full border transition-all flex items-center justify-center backdrop-blur-sm active:scale-95 shadow-md ${
                starredList.includes(currentCandidate.id)
                  ? 'border-yellow-400/50 bg-yellow-400/20 text-yellow-400'
                  : 'border-white/20 bg-white/5 text-yellow-400 hover:bg-white/10'
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ fontVariationSettings: starredList.includes(currentCandidate.id) ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>

            {/* Handshake Connect */}
            <button
              onClick={handleConnect}
              disabled={connectDisabled}
              title="Connect / Collaborate"
              className="w-16 h-16 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-white/20 disabled:text-white/50 text-white shadow-[0_4px_20px_rgba(8,145,178,0.5)] transition-all flex items-center justify-center active:scale-95"
            >
              <span className="material-symbols-outlined text-3xl">
                {connectLabel === 'Accept' ? 'done_all' : 'handshake'}
              </span>
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Right Aside Panel */}
      <aside className="w-full lg:w-80 flex flex-col gap-6">
        {/* Current User Context Capsule */}
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/10">
          <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-white/20">
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-headline font-bold text-lg leading-tight text-white">{user.name}</h4>
            <p className="text-xs text-white/60 mt-0.5">{user.role} • Connect Mode</p>
          </div>
        </div>

        {/* Build Team Action */}
        <button
          onClick={onOpenTeamBuilder}
          className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">group_add</span>
          Build My Team
        </button>

        {/* Connections List */}
        <div className="glass-card rounded-2xl p-5 flex flex-col border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-headline font-bold text-lg text-white">Your connections</h3>
            <span className="text-xs bg-white/10 text-white/90 px-2.5 py-0.5 rounded-full font-bold border border-white/10">
              {connectedCount}
            </span>
          </div>

          <div className="space-y-3">
            {recentConnections.length === 0 && (
              <p className="text-xs text-white/50">No connections yet. Send your first request.</p>
            )}
            {recentConnections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 shrink-0 overflow-hidden border border-white/10">
                  <img src={conn.avatar} alt={conn.name} className="w-full h-full object-cover" />
                </div>
                <div className="overflow-hidden">
                  <h5 className="text-sm font-semibold truncate text-white/90 group-hover:text-white">
                    {conn.name}
                  </h5>
                  <p className="text-xs text-white/50 truncate">{conn.relation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Serendipity Card */}
        <div
          onClick={() => onNavigate('clubs')}
          className="bg-cyan-950/30 border border-cyan-700/30 rounded-2xl p-5 relative overflow-hidden group hover:bg-cyan-950/50 transition-all cursor-pointer shadow-lg"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-bl-full blur-xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-cyan-400 text-sm">auto_awesome</span>
              <h4 className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Serendipity</h4>
            </div>
            <p className="text-xs text-white/60 italic mb-4">You didn't search for this...</p>

            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-white/10 shrink-0 overflow-hidden border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80"
                  alt="Rohan"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h5 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Meet Rohan
                </h5>
                <p className="text-xs text-white/70 leading-relaxed mt-0.5">
                  Mechanical Eng student building an agricultural robotics project.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
