import React from 'react';
import { UserProfile } from '../../types';

interface ProfileSetupSuccessScreenProps {
  profile: UserProfile;
  onContinue: () => void;
}

export const ProfileSetupSuccessScreen: React.FC<ProfileSetupSuccessScreenProps> = ({ profile, onContinue }) => {
  return (
    <div className="min-h-screen bg-[#0d0c0f] text-[#f5f1eb] flex items-center justify-center px-5 py-10">
      <div className="max-w-xl w-full glass-card rounded-3xl p-8 sm:p-10 border border-white/10">
        <h2 className="font-headline text-4xl text-white font-bold">You're all set, {profile.name}! 🎉</h2>
        <p className="text-white/70 mt-2">GenZen is ready to help you find your people.</p>

        <div className="mt-6 space-y-4 text-sm">
          <div>
            <p className="text-white/50 uppercase tracking-wider text-xs">Your interests</p>
            <p className="text-white mt-1">{profile.interests.slice(0, 3).join(' · ') || 'Not set yet'}</p>
          </div>
          <div>
            <p className="text-white/50 uppercase tracking-wider text-xs">Your skills</p>
            <p className="text-white mt-1">{profile.skills.slice(0, 3).join(' · ') || 'Not set yet'}</p>
          </div>
          <div>
            <p className="text-white/50 uppercase tracking-wider text-xs">Looking for</p>
            <p className="text-white mt-1">{profile.lookingFor.slice(0, 2).join(' · ') || 'Not set yet'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="mt-8 w-full py-3 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-2xl font-bold"
        >
          Let's find your people →
        </button>
      </div>
    </div>
  );
};
