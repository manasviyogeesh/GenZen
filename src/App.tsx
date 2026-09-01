import React, { useCallback, useEffect, useState } from 'react';

import {
  AlumniProfile,
  AuthSession,
  CampusEvent,
  ChatMessage,
  SeniorQuestion,
  ScreenType,
  StudentProfileDraft,
  TeammateCandidate,
  UserProfile,
} from './types';

import {
  initialSignals,
  mockAlumni,
  mockClubs,
  mockEvents,
  mockQuestions,
  initialChatMessages,
} from './data';

import { loadSeniorResponses, SeniorResponse } from './services/seniorApi';
import { authService } from './services/authService';
import { studentService } from './services/studentService';
import { matchingService } from './services/matchingService';
import { connectionService } from './services/connectionService';

import { NavigationSidebar } from './components/NavigationSidebar';
import { TopAppBar } from './components/TopAppBar';

import { HomeScreen } from './components/screens/HomeScreen';
import { ConnectScreen } from './components/screens/ConnectScreen';
import { CampusPulseScreen } from './components/screens/CampusPulseScreen';
import { EventsScreen } from './components/screens/EventsScreen';
import { GenZenAIScreen } from './components/screens/GenZenAIScreen';
import { SeniorPOVScreen } from './components/screens/SeniorPOVScreen';
import { AlumniNetworkScreen } from './components/screens/AlumniNetworkScreen';
import { ClubsScreen } from './components/screens/ClubsScreen';
import { LoginScreen } from './components/screens/LoginScreen';
import { ProfileSetupScreen } from './components/screens/ProfileSetupScreen';
import { ProfileSetupSuccessScreen } from './components/screens/ProfileSetupSuccessScreen';

import { CreateEventModal } from './components/modals/CreateEventModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { TeamBuilderModal } from './components/modals/TeamBuilderModal';

import { createEvent, loadEvents } from './services/eventsApi';
import { loadAlumniProfiles, updateAlumniLinkedInProfile } from './services/alumniApi';

export function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authService.getSession());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [setupSuccessProfile, setSetupSuccessProfile] = useState<UserProfile | null>(null);

  const [connectCandidates, setConnectCandidates] = useState<TeammateCandidate[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [recentConnections, setRecentConnections] = useState<
    Array<{ id: string; name: string; relation: string; avatar: string }>
  >([]);

  const [events, setEvents] = useState<CampusEvent[]>(mockEvents);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [questions, setQuestions] = useState<SeniorQuestion[]>(mockQuestions);

  const [alumniProfiles, setAlumniProfiles] = useState<AlumniProfile[]>(mockAlumni);
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [alumniError, setAlumniError] = useState<string | null>(null);

  const [seniorResponses, setSeniorResponses] = useState<SeniorResponse[]>([]);
  const [seniorLoading, setSeniorLoading] = useState(false);
  const [seniorError, setSeniorError] = useState<string | null>(null);

  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isTeamBuilderModalOpen, setIsTeamBuilderModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const hydrateConnectData = useCallback(async (currentUserProfile: UserProfile) => {
    try {
      const [allStudents, connections] = await Promise.all([
        studentService.getStudents(currentUserProfile.student_id),
        connectionService.getConnections(currentUserProfile.student_id),
      ]);

      const candidates = matchingService.buildCandidates(currentUserProfile, allStudents, connections);
      const connectedStudentIds = connectionService.getConnectedStudentIds(
        currentUserProfile.student_id,
        connections,
      );

      const studentMap = new Map(allStudents.map((student) => [student.student_id, student]));

      const recent = connectedStudentIds
        .map((studentId) => studentMap.get(studentId))
        .filter((profile): profile is UserProfile => Boolean(profile))
        .sort(
          (left, right) =>
            new Date(right.last_active).getTime() - new Date(left.last_active).getTime(),
        )
        .slice(0, 8)
        .map((profile) => ({
          id: profile.student_id,
          name: profile.name,
          relation: `${profile.branch} • ${profile.year}`,
          avatar: profile.avatar || profile.avatarUrl || '',
        }));

      setConnectCandidates(candidates);
      setConnectedCount(connectedStudentIds.length);
      setRecentConnections(recent);
      setUser({
        ...currentUserProfile,
        connectionsCount: connectedStudentIds.length,
        connections: connectedStudentIds,
      });
      setErrorMessage(null);
    } catch (error) {
      console.error('hydrateConnectData failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to refresh student data right now.',
      );
    }
  }, []);

  useEffect(() => {
    loadEvents()
      .then((storedEvents) => {
        if (storedEvents.length) {
          setEvents(storedEvents);
        }
      })
      .catch(() => {
        // Demo data remains visible when the optional server is not running.
      });
  }, []);

  useEffect(() => {
    setAlumniLoading(true);

    loadAlumniProfiles()
      .then((data) => {
        if (data.length) {
          setAlumniProfiles(data);
        }
        setAlumniError(null);
      })
      .catch((error: unknown) => {
        console.error('Failed to load alumni profiles:', error);
        setAlumniError(
          error instanceof Error ? error.message : 'Unable to load alumni profiles.',
        );
      })
      .finally(() => {
        setAlumniLoading(false);
      });
  }, []);

  useEffect(() => {
    setSeniorLoading(true);

    loadSeniorResponses()
      .then((data) => {
        setSeniorResponses(data);
        setSeniorError(null);
      })
      .catch((error: unknown) => {
        console.error('Failed to load senior responses:', error);
        setSeniorError(
          error instanceof Error ? error.message : 'Unable to load senior responses.',
        );
      })
      .finally(() => {
        setSeniorLoading(false);
      });
  }, []);

  const handleNavigate = useCallback(
    (screen: ScreenType) => {
      setCurrentScreen(screen);

      if (session && user) {
        void (async () => {
          try {
            const refreshed = await studentService.touchActive(session.auth_user_id);
            if (refreshed) {
              await hydrateConnectData(refreshed);
            }
          } catch (error) {
            console.error('Navigation refresh failed:', error);
          }
        })();
      }

      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    },
    [hydrateConnectData, session, user],
  );

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);

    window.setTimeout(() => {
      let aiResponseText = `I analyzed campus activity for: "${text}". Here is what our campus intelligence graph recommends.`;
      let cards: ChatMessage['cards'] = undefined;

      const lower = text.toLowerCase();

      if (lower.includes('alumni') || lower.includes('mentor') || lower.includes('linkedin')) {
        aiResponseText =
          'I found a curated list of verified alumni across product, AI, and engineering. Their mentorship focus includes career strategy, internships, and startup journeys.';
      } else if (lower.includes('hackathon') || lower.includes('team') || lower.includes('python')) {
        aiResponseText =
          "You're in a great position to build a winning team. I matched you with 3 peers whose skills complement your Python and ML background perfectly.";

        cards = {
          hackathon: {
            title: 'AI for Good Hackathon',
            daysLeft: 6,
            attending: 42,
          },
          potentialTeam: {
            compatibility: 95,
            members: [
              {
                name: 'Aarav',
                role: 'Backend • 94%',
                match: 94,
                avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
              },
              {
                name: 'Priya',
                role: 'UI/UX • 91%',
                match: 91,
                avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
              },
              {
                name: 'Karthik',
                role: 'Cloud • 89%',
                match: 89,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
              },
            ],
          },
        };
      } else if (lower.includes('club') || lower.includes('join')) {
        aiResponseText =
          'Based on your focus on UX research and Machine Learning, the AI & Machine Learning Club (98% match) and Design Collective (85% match) have active recruiting projects this week.';
      } else if (lower.includes('senior') || lower.includes('elective') || lower.includes('internship')) {
        aiResponseText =
          'Top seniors recommend CS401 (Advanced ML) for project depth and beginning daily LeetCode practice early in your 4th semester for product firm interviews.';
      } else if (lower.includes('week') || lower.includes('event') || lower.includes('schedule')) {
        aiResponseText =
          'This week features 7 campus events, including the Design Jam 2023 tomorrow and Open Source Hackathon Meetup on October 18th.';
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: 'Just now',
        cards,
      };

      setChatMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  const handleAskQuestion = (title: string, category: string, description: string) => {
    console.log('Question submitted:', { title, category, description });
    showToast(`Question "${title}" submitted to seniors.`);
  };

  const handleInviteCandidate = (name: string) => {
    showToast(`Invitation dispatched to ${name}!`);
  };

  const handleUpdateLinkedIn = async (alumniId: string, linkedinUrl: string) => {
    const updatedProfile = await updateAlumniLinkedInProfile(alumniId, linkedinUrl);

    setAlumniProfiles((previous) =>
      previous.map((profile) =>
        profile.id === alumniId
          ? {
              ...profile,
              ...updatedProfile,
              linkedInUrl: updatedProfile.linkedInUrl ?? profile.linkedInUrl,
            }
          : profile,
      ),
    );

    showToast('LinkedIn profile registered successfully.');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const nextSession = await authService.login(email, password);
      setErrorMessage(null);
      setSetupSuccessProfile(null);
      setSession(nextSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      setErrorMessage(message);
      throw error;
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const nextSession = await authService.signUp(email, password);
      setErrorMessage(null);
      setSetupSuccessProfile(null);
      setSession(nextSession);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed.';
      setErrorMessage(message);
      throw error;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setSession(null);
    setUser(null);
    setSetupSuccessProfile(null);
    setConnectCandidates([]);
    setConnectedCount(0);
    setRecentConnections([]);
    setCurrentScreen('home');
    setErrorMessage(null);
  };

  const handleCreateProfile = (draft: StudentProfileDraft) => {
    if (!session) {
      return;
    }

    void (async () => {
      try {
        const profile = await studentService.createStudentProfile(
          session.auth_user_id,
          session.email,
          draft,
        );

        await hydrateConnectData(profile);
        setSetupSuccessProfile(profile);
        setErrorMessage(null);
      } catch (error) {
        console.error('Profile creation failed:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to save your profile right now.',
        );
      }
    })();
  };

  const sendConnectionRequest = (candidate: TeammateCandidate) => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await connectionService.sendRequest(user.student_id, candidate.student_id);

        const refreshed = await studentService.getStudentByAuthUserId(user.auth_user_id);
        if (refreshed) {
          await hydrateConnectData(refreshed);
        }

        showToast(`Connection request sent to ${candidate.name}.`);
      } catch (error) {
        console.error('Send connection request failed:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to send request right now.',
        );
      }
    })();
  };

  const acceptConnectionRequest = (candidate: TeammateCandidate) => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await connectionService.acceptRequest(user.student_id, candidate.student_id);

        const refreshed = await studentService.getStudentByAuthUserId(user.auth_user_id);
        if (refreshed) {
          await hydrateConnectData(refreshed);
        }

        showToast(`You are now connected with ${candidate.name}.`);
      } catch (error) {
        console.error('Accept connection failed:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to accept request right now.',
        );
      }
    })();
  };

  const passCandidate = (candidate: TeammateCandidate) => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await connectionService.pass(user.student_id, candidate.student_id);

        const refreshed = await studentService.getStudentByAuthUserId(user.auth_user_id);
        if (refreshed) {
          await hydrateConnectData(refreshed);
        }
      } catch (error) {
        console.error('Pass candidate failed:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to update this match right now.',
        );
      }
    })();
  };

  const handleAddEvent = async (newEvent: CampusEvent) => {
    try {
      await createEvent(newEvent);
      setEvents((previous) => [newEvent, ...previous]);
      showToast(`🎉 Event "${newEvent.title}" published!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to publish event.';
      showToast(message);
      throw error;
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!session) {
        if (mounted) {
          setUser(null);
          setConnectCandidates([]);
          setConnectedCount(0);
          setRecentConnections([]);
          setIsBootstrapping(false);
        }
        return;
      }

      if (session.auth_user_id === 'dev-user-001') {
        if (mounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        let activeProfile: UserProfile | null = null;

        try {
          activeProfile = await studentService.touchActive(session.auth_user_id);
        } catch (error) {
          console.error('touchActive failed:', error);
        }

        if (!activeProfile) {
          try {
            activeProfile = await studentService.getStudentByAuthUserId(session.auth_user_id);
          } catch (error) {
            console.error('getStudentByAuthUserId failed:', error);
          }
        }

        if (!mounted) {
          return;
        }

        if (!activeProfile) {
          setIsBootstrapping(false);
          return;
        }

        await hydrateConnectData(activeProfile);
      } catch (error) {
        console.error('Application bootstrap failed:', error);
        if (mounted) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Unable to load your profile right now.',
          );
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [session, hydrateConnectData]);

  useEffect(() => {
    if (!session || !user) {
      return;
    }

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const refreshed = await studentService.touchActive(session.auth_user_id);
          if (refreshed) {
            await hydrateConnectData(refreshed);
          }
        } catch (error) {
          console.error('Background profile refresh failed:', error);
        }
      })();
    }, 60000);

    return () => window.clearInterval(interval);
  }, [session, user, hydrateConnectData]);

  if (isBootstrapping) {
    return <div className="min-h-screen bg-[#0d0c0f]" />;
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} onSignUp={handleSignUp} />;
  }

  if (setupSuccessProfile) {
    return (
      <ProfileSetupSuccessScreen
        profile={setupSuccessProfile}
        onContinue={() => {
          setSetupSuccessProfile(null);
          setCurrentScreen('connect');
        }}
      />
    );
  }

  if (!user) {
    return <ProfileSetupScreen email={session.email} onComplete={handleCreateProfile} />;
  }

  return (
    <div className="min-h-screen bg-[#0d0c0f] text-[#f5f1eb] flex flex-col antialiased selection:bg-[#c2652a]/30">
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e1d24] border border-[#c2652a]/40 text-[#fbe8d8] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-[#f0a878] text-lg">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-500/15 border border-rose-400/30 text-rose-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[90vw]">
          <span className="material-symbols-outlined text-rose-300 text-lg">error</span>
          <span className="text-sm font-medium">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-rose-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      <NavigationSidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenCreateModal={() => setIsCreateEventModalOpen(true)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">
        <TopAppBar
          user={user}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 md:pt-16">
          {currentScreen === 'home' && (
            <HomeScreen
              user={user}
              signals={initialSignals}
              onNavigate={handleNavigate}
              onOpenCreateModal={() => setIsCreateEventModalOpen(true)}
              onEditProfile={() => setIsEditProfileModalOpen(true)}
            />
          )}

          {currentScreen === 'connect' && (
            <ConnectScreen
              user={user}
              candidates={connectCandidates}
              onNavigate={handleNavigate}
              onOpenTeamBuilder={() => setIsTeamBuilderModalOpen(true)}
              onSendConnectionRequest={sendConnectionRequest}
              onAcceptConnection={acceptConnectionRequest}
              onPassCandidate={passCandidate}
              connectedCount={connectedCount}
              recentConnections={recentConnections}
            />
          )}

          {currentScreen === 'alumni' && (
            <AlumniNetworkScreen
              user={user}
              alumni={alumniProfiles}
              onNavigate={handleNavigate}
              onUpdateLinkedIn={handleUpdateLinkedIn}
            />
          )}

          {currentScreen === 'pulse' && (
            <CampusPulseScreen user={user} onNavigate={handleNavigate} />
          )}

          {currentScreen === 'events' && (
            <EventsScreen
              events={events}
              onNavigate={handleNavigate}
              onOpenCreateModal={() => setIsCreateEventModalOpen(true)}
            />
          )}

          {currentScreen === 'ai' && (
            <GenZenAIScreen
              user={user}
              onNavigate={handleNavigate}
              onOpenTeamBuilder={() => setIsTeamBuilderModalOpen(true)}
            />
          )}

          {currentScreen === 'senior_pov' && (
            <SeniorPOVScreen
              user={user}
              questions={questions}
              seniorResponses={seniorResponses}
              seniorLoading={seniorLoading}
              seniorError={seniorError}
              onNavigate={handleNavigate}
              onAskQuestion={handleAskQuestion}
            />
          )}

          {currentScreen === 'clubs' && (
            <ClubsScreen
              user={user}
              clubs={mockClubs}
              onNavigate={handleNavigate}
              onOpenCreateClub={() => setIsCreateEventModalOpen(true)}
            />
          )}
        </main>
      </div>

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onAddEvent={handleAddEvent}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={user}
        onSave={(updated) => {
          if (!session) {
            return;
          }

          void (async () => {
            try {
              const saved = await studentService.updateStudentProfile(user.student_id, updated);
              await hydrateConnectData(saved);
              showToast('Profile updated successfully.');
              setErrorMessage(null);
            } catch (error) {
              console.error('Profile update failed:', error);
              setErrorMessage(
                error instanceof Error ? error.message : 'Unable to update profile right now.',
              );
            }
          })();
        }}
      />

      <TeamBuilderModal
        isOpen={isTeamBuilderModalOpen}
        onClose={() => setIsTeamBuilderModalOpen(false)}
        candidates={connectCandidates}
        onInviteCandidate={(candidate) => {
          sendConnectionRequest(candidate);
          handleInviteCandidate(candidate.name);
        }}
      />
    </div>
  );
}

export default App;
