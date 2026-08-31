import React, { useState } from 'react';
import { StudentProfileDraft } from '../../types';
import {
  AVAILABILITY_OPTIONS,
  DEFAULT_AVATAR,
  INTEREST_OPTIONS,
  LOOKING_FOR_OPTIONS,
  SKILL_OPTIONS
} from '../../services/constants';

interface ProfileSetupScreenProps {
  email: string;
  onComplete: (draft: StudentProfileDraft) => void;
}

const stepTitles = ['About You', 'Interests', 'Skills', 'Looking For', 'Availability'];

const ChipSelector: React.FC<{
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}> = ({ options, values, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((option) => {
        const isSelected = values.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold border transition-colors ${
              isSelected
                ? 'bg-[#c2652a]/25 border-[#c2652a]/50 text-[#fbe8d8]'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ email, onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value));
      return;
    }
    setter([...values, value]);
  };

  const uploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const canContinue = () => {
    if (step === 1) {
      return Boolean(name.trim() && branch.trim() && year.trim());
    }
    if (step === 2) {
      return interests.length > 0;
    }
    if (step === 3) {
      return skills.length > 0;
    }
    if (step === 4) {
      return lookingFor.length > 0;
    }
    if (step === 5) {
      return availability.length > 0;
    }
    return false;
  };

  const handleCreateProfile = () => {
    const draft: StudentProfileDraft = {
      name: name.trim(),
      branch: branch.trim(),
      year: year.trim(),
      bio: bio.trim(),
      avatar,
      interests,
      skills,
      lookingFor,
      availability
    };

    onComplete(draft);
  };

  return (
    <div className="min-h-screen bg-[#0d0c0f] text-[#f5f1eb] px-5 py-8 md:py-12">
      <div className="max-w-3xl mx-auto glass-card rounded-3xl border border-white/10 p-6 sm:p-8 md:p-10">
        <div className="mb-6 border-b border-white/10 pb-5">
          <p className="text-xs text-[#f0a878] tracking-[0.2em] uppercase font-bold">Step {step} / 5</p>
          <h2 className="font-headline text-3xl sm:text-4xl font-bold text-white mt-1">{stepTitles[step - 1]}</h2>
          <p className="text-white/55 text-sm mt-1">{email}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-headline text-white font-bold">Let's build your campus profile.</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a]"
              />
              <input
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                placeholder="Branch"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a]"
              />
            </div>

            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Year"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a]"
            />

            <textarea
              rows={3}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Bio (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a] resize-none"
            />

            <div className="flex items-center gap-4">
              <img src={avatar} alt="avatar" className="w-14 h-14 rounded-full object-cover border border-white/20" />
              <label className="text-sm text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl cursor-pointer">
                Upload profile photo
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-headline text-white font-bold">What are you into?</h3>
            <p className="text-white/60">Pick the things you actually care about.</p>
            <ChipSelector options={INTEREST_OPTIONS} values={interests} onToggle={(value) => toggle(value, interests, setInterests)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-headline text-white font-bold">What can you bring to a team?</h3>
            <ChipSelector options={SKILL_OPTIONS} values={skills} onToggle={(value) => toggle(value, skills, setSkills)} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-headline text-white font-bold">What brings you here?</h3>
            <ChipSelector options={LOOKING_FOR_OPTIONS} values={lookingFor} onToggle={(value) => toggle(value, lookingFor, setLookingFor)} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-headline text-white font-bold">When are you usually free?</h3>
            <ChipSelector options={AVAILABILITY_OPTIONS} values={availability} onToggle={(value) => toggle(value, availability, setAvailability)} />
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/10">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl text-sm text-white/70 hover:text-white disabled:opacity-30"
          >
            Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={!canContinue()}
              onClick={() => setStep((prev) => Math.min(5, prev + 1))}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#c2652a] hover:bg-[#b05721] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue()}
              onClick={handleCreateProfile}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#c2652a] hover:bg-[#b05721] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Create My Profile →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
