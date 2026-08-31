import React, { useState } from 'react';
import { TeammateCandidate } from '../../types';

interface TeamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: TeammateCandidate[];
  onInviteCandidate: (candidateName: string) => void;
}

export const TeamBuilderModal: React.FC<TeamBuilderModalProps> = ({
  isOpen,
  onClose,
  candidates,
  onInviteCandidate
}) => {
  const [selectedRole, setSelectedRole] = useState('All');
  const [invitedMap, setInvitedMap] = useState<{ [id: string]: boolean }>({});

  if (!isOpen) return null;

  const handleInvite = (c: TeammateCandidate) => {
    setInvitedMap({ ...invitedMap, [c.id]: true });
    onInviteCandidate(c.name);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#16151b] border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div>
            <h3 className="font-headline text-2xl font-bold text-white flex items-center gap-2">
              <span>👥</span>
              <span>AI Team Builder</span>
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              GenZen AI synthesized candidate combinations with optimal skill coverage.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Compatibility Overview */}
        <div className="bg-gradient-to-r from-[#c2652a]/20 to-purple-900/20 p-4 rounded-2xl border border-[#c2652a]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#f0a878] tracking-widest">
              Team Synergy Index
            </span>
            <h4 className="text-xl font-headline font-bold text-white">96.2% Fullstack Synergy</h4>
            <p className="text-xs text-white/70">
              Covers Backend (Python/AWS) + Frontend (React/Figma) + Cloud Infra (Docker/GCP)
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-headline font-bold text-cyan-300">4/4</span>
            <span className="text-[10px] text-white/50 block">Roles Filled</span>
          </div>
        </div>

        {/* Candidates in proposed roster */}
        <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
          {candidates.map((cand) => {
            const isInvited = invitedMap[cand.id];
            return (
              <div
                key={cand.id}
                className="p-3.5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/20">
                    <img src={cand.avatarUrl} alt={cand.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-sm text-white">{cand.name}</h5>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {cand.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{cand.department} • {cand.skills.slice(0, 3).join(', ')}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleInvite(cand)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isInvited
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#c2652a] hover:bg-[#b05721] text-white'
                  }`}
                >
                  {isInvited ? 'Invited ✓' : 'Send Invite'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
