import React, { useMemo, useState } from 'react';
import { AlumniProfile, ScreenType, UserProfile } from '../../types';

interface AlumniNetworkScreenProps {
  user: UserProfile;
  alumni: AlumniProfile[];
  onNavigate: (screen: ScreenType) => void;
  onUpdateLinkedIn: (
    alumniId: string,
    linkedinUrl: string,
  ) => Promise<void> | void;
}

const validateLinkedInUrl = (rawUrl: string | null | undefined) => {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      valid: false,
      message: 'LinkedIn profile URL is required.',
    };
  }

  const value = rawUrl.trim();

  if (!/^https:\/\//i.test(value)) {
    return {
      valid: false,
      message: 'LinkedIn URL must use HTTPS.',
    };
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== 'https:') {
      return {
        valid: false,
        message: 'LinkedIn URL must use HTTPS.',
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (hostname !== 'linkedin.com' && hostname !== 'www.linkedin.com') {
      return {
        valid: false,
        message: 'LinkedIn URL must point to linkedin.com.',
      };
    }

    const pathname = parsed.pathname.toLowerCase();

    if (!pathname.startsWith('/in/')) {
      return {
        valid: false,
        message: 'LinkedIn profile URLs must use the /in/ format.',
      };
    }

    const slug = parsed.pathname.replace(/^\/in\//i, '').replace(/\/+$/, '');

    if (!slug) {
      return {
        valid: false,
        message: 'LinkedIn profile URL is missing the profile slug.',
      };
    }

    return {
      valid: true,
      normalizedUrl: `https://www.linkedin.com/in/${slug}`,
    };
  } catch {
    return {
      valid: false,
      message: 'Enter a valid LinkedIn profile URL.',
    };
  }
};

const isDemoLinkedInUrl = (rawUrl: string | null | undefined) => {
  if (!rawUrl || !rawUrl.trim()) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    const hostname = parsed.hostname.toLowerCase();

    if (hostname !== 'linkedin.com' && hostname !== 'www.linkedin.com') {
      return false;
    }

    const slug = parsed.pathname.replace(/^\/in\//i, '').replace(/\/+$/, '').toLowerCase();

    return /^(demo|example|placeholder|fake)/i.test(slug) || /demo|example|placeholder|fake/i.test(slug);
  } catch {
    return false;
  }
};

const hasRealLinkedInProfile = (profile: AlumniProfile | null | undefined) => {
  if (!profile?.linkedInUrl) {
    return false;
  }

  const result = validateLinkedInUrl(profile.linkedInUrl);
  return result.valid && !isDemoLinkedInUrl(profile.linkedInUrl);
};

export const AlumniNetworkScreen: React.FC<AlumniNetworkScreenProps> = ({
  user,
  alumni,
  onNavigate,
  onUpdateLinkedIn,
}) => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'mentorship' | 'product'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(alumni[0]?.id ?? null);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const [linkedinInput, setLinkedInInput] = useState('');
  const [linkedinError, setLinkedInError] = useState('');
  const [linkedinSuccess, setLinkedInSuccess] = useState('');
  const [isSubmittingLinkedIn, setIsSubmittingLinkedIn] = useState(false);

  const filteredAlumni = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return alumni.filter((profile) => {
      const matchesQuery =
        !normalizedQuery ||
        `${profile.name} ${profile.role} ${profile.company} ${profile.department} ${profile.skills.join(' ')} ${profile.mentorshipTopics.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesFilter = (() => {
        switch (activeFilter) {
          case 'verified':
            return profile.verified;
          case 'mentorship':
            return profile.mentorshipTopics.length > 0;
          case 'product':
            return profile.mentorshipTopics.some((topic) =>
              topic.toLowerCase().includes('product') || topic.toLowerCase().includes('career') || topic.toLowerCase().includes('startup'),
            );
          default:
            return true;
        }
      })();

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, alumni, query]);

  const selectedProfile =
    filteredAlumni.find((profile) => profile.id === selectedId) ??
    filteredAlumni[0] ??
    null;

  const verifiedCount = alumni.filter((profile) => profile.verified).length;
  const mentorshipCount = new Set(alumni.flatMap((profile) => profile.mentorshipTopics)).size;

  const openLinkedInModal = () => {
    if (!selectedProfile) {
      return;
    }

    setLinkedInInput(selectedProfile.linkedInUrl ?? '');
    setLinkedInError('');
    setLinkedInSuccess('');
    setIsLinkedInModalOpen(true);
  };

  const closeLinkedInModal = () => {
    setIsLinkedInModalOpen(false);
    setLinkedInInput('');
    setLinkedInError('');
    setLinkedInSuccess('');
  };

  const handleLinkedInSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedProfile) {
      return;
    }

    const validation = validateLinkedInUrl(linkedinInput);

    if (!validation.valid) {
      setLinkedInError(validation.message ?? 'Invalid LinkedIn URL.');
      return;
    }

    setIsSubmittingLinkedIn(true);
    setLinkedInError('');

    try {
      await onUpdateLinkedIn(selectedProfile.id, validation.normalizedUrl ?? linkedinInput.trim());
      setLinkedInSuccess('LinkedIn profile registered successfully.');
      setIsLinkedInModalOpen(false);
      setLinkedInInput('');
    } catch (error) {
      setLinkedInError(
        error instanceof Error
          ? error.message
          : 'Unable to update LinkedIn profile.',
      );
    } finally {
      setIsSubmittingLinkedIn(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#f0a878] font-semibold">GenZen Alumni Network</p>
          <h2 className="font-headline text-4xl sm:text-5xl font-bold text-white tracking-tight mt-2">CONNECT WITH ALUMNI</h2>
          <p className="mt-2 text-white/60 text-base max-w-2xl">
            Discover verified alumni for career guidance, internship direction, and mentorship.
          </p>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-white/80">
          <span className="material-symbols-outlined text-[#f0a878] text-lg">verified_user</span>
          <span className="text-sm font-medium">{verifiedCount} verified</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Directory</p>
          <p className="mt-3 text-3xl font-bold text-white">{alumni.length}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Mentorship Topics</p>
          <p className="mt-3 text-3xl font-bold text-white">{mentorshipCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Claimed Profiles</p>
          <p className="mt-3 text-3xl font-bold text-white">{alumni.filter((profile) => profile.claimed).length}</p>
        </div>
      </div>

      <div className="mb-8 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search alumni, company, skills, or topic"
            className="w-full bg-[#17161d] border border-white/10 rounded-2xl px-12 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[#c2652a]/60"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'verified', label: 'Verified' },
            { id: 'mentorship', label: 'Mentorship' },
            { id: 'product', label: 'Career + Product' },
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setActiveFilter(filterOption.id as 'all' | 'verified' | 'mentorship' | 'product')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeFilter === filterOption.id
                  ? 'bg-[#c2652a] text-white'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <div className="space-y-4">
          {filteredAlumni.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#121217] p-8 text-center text-white/50">
              No alumni match your current filters.
            </div>
          ) : (
            filteredAlumni.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                className={`w-full text-left rounded-3xl border p-4 transition-all ${
                  selectedProfile?.id === profile.id
                    ? 'border-[#c2652a]/60 bg-[#1a1718] shadow-lg shadow-[#c2652a]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-[#1f1d22] shrink-0">
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-lg">{profile.name}</p>
                        {profile.verified && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#f0a878] font-medium">{profile.role}</p>
                      <p className="text-xs text-white/45 mt-1">
                        {profile.company} • {profile.department} • {profile.graduationYear}
                      </p>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-white/30">chevron_right</span>
                </div>

                <p className="mt-3 text-sm text-white/70 line-clamp-3">{profile.bio}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.mentorshipTopics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-full border border-white/10 bg-[#111318] text-[10px] uppercase tracking-wide text-white/70"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#121217] p-6 min-h-[560px]">
          {selectedProfile ? (
            <>
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10">
                    <img
                      src={selectedProfile.avatarUrl}
                      alt={selectedProfile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-2xl font-bold text-white">{selectedProfile.name}</h3>
                      {selectedProfile.verified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                          VERIFIED ALUMNI
                        </span>
                      )}
                    </div>
                    <p className="text-[#f0a878] font-medium">{selectedProfile.role}</p>
                    <p className="text-sm text-white/55">
                      {selectedProfile.company} • {selectedProfile.department} • {selectedProfile.graduationYear}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onNavigate('connect')}
                    className="px-3 py-2 rounded-xl bg-white/5 text-white hover:bg-white/10 text-sm font-medium"
                  >
                    Message
                  </button>

                  {hasRealLinkedInProfile(selectedProfile) ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProfile.linkedInUrl) {
                          window.open(selectedProfile.linkedInUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[#c2652a] text-white text-sm font-semibold hover:bg-[#b05721]"
                    >
                      LinkedIn
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openLinkedInModal}
                      className="px-3 py-2 rounded-xl bg-[#c2652a] text-white text-sm font-semibold hover:bg-[#b05721]"
                    >
                      Register LinkedIn
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">About</p>
                  <p className="text-white/80 leading-relaxed">{selectedProfile.bio}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Location</p>
                    <p className="text-white/80">{selectedProfile.location}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Availability</p>
                    <p className="text-white/80">{selectedProfile.availability}</p>
                  </div>
                  <div>
                   <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">LinkedIn Status</p>
                   <p className={`font-medium ${hasRealLinkedInProfile(selectedProfile) ? 'text-emerald-300' : 'text-amber-300'}`}>
                     {hasRealLinkedInProfile(selectedProfile) ? 'LinkedIn profile registered' : 'LinkedIn not registered'}
                    </p>
                   {linkedinSuccess && (
                     <p className="mt-2 text-sm text-emerald-300">{linkedinSuccess}</p>
                   )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Mentorship topics</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.mentorshipTopics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1.5 rounded-full bg-[#1c1d24] border border-white/10 text-sm text-white/80"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Areas of strength</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-full bg-[#f0a878]/10 border border-[#f0a878]/25 text-sm text-[#fbe8d8]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-white/50">
              Select an alumni profile to view details.
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="mt-8 text-sm text-white/55">
          Viewing alumni directory for <span className="text-[#f0a878]">{user.name}</span>
        </div>
      )}

      {isLinkedInModalOpen && selectedProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16151b] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-white/10">
              <div>
                <h3 className="font-headline text-2xl font-bold text-white">Register LinkedIn Profile</h3>
                <p className="mt-1 text-sm text-white/60">Connect your professional profile to your GenZen alumni profile.</p>
              </div>
              <button
                type="button"
                onClick={closeLinkedInModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleLinkedInSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  value={linkedinInput}
                  onChange={(event) => setLinkedInInput(event.target.value)}
                  placeholder="https://www.linkedin.com/in/................"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-[#c2652a]"
                />
              </div>

              <p className="text-xs text-white/55 leading-relaxed">
                We only store your LinkedIn profile URL. GenZen does not collect your LinkedIn password or scrape your LinkedIn account.
              </p>

              {linkedinError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {linkedinError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeLinkedInModal}
                  className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLinkedIn}
                  className="px-6 py-2 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-xl text-sm font-bold shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingLinkedIn ? 'Registering...' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
