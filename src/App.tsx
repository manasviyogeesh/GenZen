import React, { useCallback, useEffect, useState } from 'react';

import {
  AuthSession,
  ScreenType,
  UserProfile,
  CampusEvent,
  SeniorQuestion,
  StudentProfileDraft,
  TeammateCandidate,
} from './types';

import {
  initialSignals,
  mockEvents,
  mockClubs,
  mockQuestions,
} from './data';

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
import { ClubsScreen } from './components/screens/ClubsScreen';

import { LoginScreen } from './components/screens/LoginScreen';
import { ProfileSetupScreen } from './components/screens/ProfileSetupScreen';
import { ProfileSetupSuccessScreen } from './components/screens/ProfileSetupSuccessScreen';

import { CreateEventModal } from './components/modals/CreateEventModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { TeamBuilderModal } from './components/modals/TeamBuilderModal';

export function App() {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const [session, setSession] = useState<AuthSession | null>(() =>
    authService.getSession()
  );

  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // =========================================================
  // USER / CONNECT DATA
  // =========================================================

  const [user, setUser] = useState<UserProfile | null>(null);

  const [setupSuccessProfile, setSetupSuccessProfile] =
    useState<UserProfile | null>(null);

  const [connectCandidates, setConnectCandidates] = useState<
    TeammateCandidate[]
  >([]);

  const [connectedCount, setConnectedCount] = useState(0);

  const [recentConnections, setRecentConnections] = useState<
    Array<{
      id: string;
      name: string;
      relation: string;
      avatar: string;
    }>
  >([]);

  // =========================================================
  // OTHER APP DATA
  // =========================================================

  const [events, setEvents] =
    useState<CampusEvent[]>(mockEvents);

  const [questions, setQuestions] =
    useState<SeniorQuestion[]>(mockQuestions);

  const [currentScreen, setCurrentScreen] =
    useState<ScreenType>('home');

  const [searchQuery, setSearchQuery] = useState('');

  // =========================================================
  // MODALS / UI
  // =========================================================

  const [isCreateEventModalOpen, setIsCreateEventModalOpen] =
    useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] =
    useState(false);

  const [isTeamBuilderModalOpen, setIsTeamBuilderModalOpen] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  // =========================================================
  // TOAST
  // =========================================================

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // =========================================================
  // LOAD CONNECT DATA
  // =========================================================

  const hydrateConnectData = useCallback(
    async (currentUserProfile: UserProfile) => {
      try {
        const [allStudents, connections] = await Promise.all([
          studentService.getStudents(
            currentUserProfile.student_id
          ),

          connectionService.getConnections(
            currentUserProfile.student_id
          ),
        ]);

        const candidates =
          matchingService.buildCandidates(
            currentUserProfile,
            allStudents,
            connections
          );

        const connectedStudentIds =
          connectionService.getConnectedStudentIds(
            currentUserProfile.student_id,
            connections
          );

        const studentMap = new Map(
          allStudents.map((student) => [
            student.student_id,
            student,
          ])
        );

        const recent = connectedStudentIds
          .map((studentId) => studentMap.get(studentId))
          .filter(
            (profile): profile is UserProfile =>
              Boolean(profile)
          )
          .sort(
            (left, right) =>
              new Date(right.last_active).getTime() -
              new Date(left.last_active).getTime()
          )
          .slice(0, 8)
          .map((profile) => ({
            id: profile.student_id,
            name: profile.name,

            relation: `${profile.branch} • ${profile.year}`,

            avatar:
              profile.avatar ||
              profile.avatarUrl ||
              '',
          }));

        setConnectCandidates(candidates);

        setConnectedCount(
          connectedStudentIds.length
        );

        setRecentConnections(recent);

        /*
         * IMPORTANT:
         *
         * Only update the user after successful
         * database operations.
         *
         * If Lakebase temporarily fails,
         * the existing user remains on screen.
         */

        setUser({
          ...currentUserProfile,

          connectionsCount:
            connectedStudentIds.length,

          connections:
            connectedStudentIds,
        });

        setErrorMessage(null);
      } catch (error) {
        console.error(
          'hydrateConnectData failed:',
          error
        );

        /*
         * Do NOT setUser(null).
         *
         * A temporary backend/database error
         * must not blank the application.
         */

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to refresh student data right now.'
        );
      }
    },
    []
  );

  // =========================================================
  // BOOTSTRAP
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      // -----------------------------------------------------
      // No session
      // -----------------------------------------------------

      if (!session) {
        if (!mounted) {
          return;
        }

        setUser(null);
        setConnectCandidates([]);
        setConnectedCount(0);
        setRecentConnections([]);
        setIsBootstrapping(false);

        return;
      }

      // -----------------------------------------------------
      // Development mock session
      // -----------------------------------------------------

      if (
        session.auth_user_id ===
        'dev-user-001'
      ) {
        if (mounted) {
          setIsBootstrapping(false);
        }

        return;
      }

      try {
        let activeProfile: UserProfile | null = null;

        // ---------------------------------------------------
        // Try touchActive
        // ---------------------------------------------------

        try {
          activeProfile =
            await studentService.touchActive(
              session.auth_user_id
            );
        } catch (error) {
          console.error(
            'touchActive failed:',
            error
          );
        }

        // ---------------------------------------------------
        // If not found, get by auth user ID
        // ---------------------------------------------------

        if (!activeProfile) {
          try {
            activeProfile =
              await studentService.getStudentByAuthUserId(
                session.auth_user_id
              );
          } catch (error) {
            console.error(
              'getStudentByAuthUserId failed:',
              error
            );
          }
        }

        if (!mounted) {
          return;
        }

        // ---------------------------------------------------
        // No profile yet
        // ---------------------------------------------------

        if (!activeProfile) {
          /*
           * Leave user alone instead of forcing
           * an already-loaded user to null.
           */
          setIsBootstrapping(false);

          return;
        }

        // ---------------------------------------------------
        // Profile exists
        // ---------------------------------------------------

        await hydrateConnectData(
          activeProfile
        );
      } catch (error) {
        console.error(
          'Application bootstrap failed:',
          error
        );

        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load your profile right now.'
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
  }, [
    session,
    hydrateConnectData,
  ]);

  // =========================================================
  // BACKGROUND ACTIVE STATUS REFRESH
  // =========================================================

  useEffect(() => {
    if (!session || !user) {
      return;
    }

    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const refreshed =
            await studentService.touchActive(
              session.auth_user_id
            );

          /*
           * Only refresh when a real profile
           * comes back from the backend.
           */
          if (refreshed) {
            await hydrateConnectData(
              refreshed
            );
          }
        } catch (error) {
          console.error(
            'Background profile refresh failed:',
            error
          );

          /*
           * Never clear user here.
           */
        }
      })();
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    session,
    user,
    hydrateConnectData,
  ]);

  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleNavigate = useCallback(
    (screen: ScreenType) => {
      setCurrentScreen(screen);

      /*
       * Refresh data when navigating,
       * but never destroy the current user.
       */

      if (session && user) {
        void (async () => {
          try {
            const refreshed =
              await studentService.touchActive(
                session.auth_user_id
              );

            if (refreshed) {
              await hydrateConnectData(
                refreshed
              );
            }
          } catch (error) {
            console.error(
              'Navigation refresh failed:',
              error
            );
          }
        })();
      }

      window.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    },
    [
      session,
      user,
      hydrateConnectData,
    ]
  );

  // =========================================================
  // LOGIN
  // =========================================================

  const handleLogin = async (
    email: string,
    password: string
  ) => {
    try {
      const nextSession =
        await authService.login(
          email,
          password
        );

      setErrorMessage(null);
      setSetupSuccessProfile(null);
      setSession(nextSession);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Login failed.';

      setErrorMessage(message);

      throw error;
    }
  };

  // =========================================================
  // SIGN UP
  // =========================================================

  const handleSignUp = async (
    email: string,
    password: string
  ) => {
    try {
      const nextSession =
        await authService.signUp(
          email,
          password
        );

      setErrorMessage(null);
      setSetupSuccessProfile(null);
      setSession(nextSession);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Sign up failed.';

      setErrorMessage(message);

      throw error;
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

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

  // =========================================================
  // CREATE PROFILE
  // =========================================================

  const handleCreateProfile = (
    draft: StudentProfileDraft
  ) => {
    if (!session) {
      return;
    }

    void (async () => {
      try {
        const profile =
          await studentService.createStudentProfile(
            session.auth_user_id,
            session.email,
            draft
          );

        /*
         * Set/hydrate the newly created profile.
         */
        await hydrateConnectData(
          profile
        );

        setSetupSuccessProfile(
          profile
        );

        setErrorMessage(null);
      } catch (error) {
        console.error(
          'Profile creation failed:',
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to save your profile right now.'
        );
      }
    })();
  };

  // =========================================================
  // SEND CONNECTION REQUEST
  // =========================================================

  const sendConnectionRequest = (
    candidate: TeammateCandidate
  ) => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await connectionService.sendRequest(
          user.student_id,
          candidate.student_id
        );

        const refreshed =
          await studentService.getStudentByAuthUserId(
            user.auth_user_id
          );

        if (refreshed) {
          await hydrateConnectData(
            refreshed
          );
        }

        showToast(
          `Connection request sent to ${candidate.name}.`
        );
      } catch (error) {
        console.error(
          'Send connection request failed:',
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to send request right now.'
        );
      }
    })();
  };

  // =========================================================
  // ACCEPT CONNECTION
  // =========================================================

  const acceptConnectionRequest = (
    candidate: TeammateCandidate
  ) => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await connectionService.acceptRequest(
          user.student_id,
          candidate.student_id
        );

        const refreshed =
          await studentService.getStudentByAuthUserId(
            user.auth_user_id
          );

        if (refreshed) {
          await hydrateConnectData(
            refreshed
          );
        }

        showToast(
          `You are now connected with ${candidate.name}.`
        );
      } catch (error) {
        console.error(
          'Accept connection failed:',
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to accept request right now.'
        );
      }
    })();
  };

  // =========================================================
  // PASS
  // =========================================================

  const passCandidate = (
    candidate: TeammateCandidate
  ) => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await connectionService.pass(
          user.student_id,
          candidate.student_id
        );

        const refreshed =
          await studentService.getStudentByAuthUserId(
            user.auth_user_id
          );

        if (refreshed) {
          await hydrateConnectData(
            refreshed
          );
        }
      } catch (error) {
        console.error(
          'Pass candidate failed:',
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to update this match right now.'
        );
      }
    })();
  };

  // =========================================================
  // CREATE EVENT
  // =========================================================

  const handleAddEvent = (
    newEvent: CampusEvent
  ) => {
    setEvents((prev) => [
      newEvent,
      ...prev,
    ]);

    showToast(
      `🎉 Event "${newEvent.title}" published!`
    );
  };

  // =========================================================
  // SENIOR QUESTION
  // =========================================================

  const handleAskQuestion = (
    title: string,
    category: string,
    description: string
  ) => {
    console.log(
      'Question submitted:',
      {
        title,
        category,
        description,
      }
    );

    showToast(
      `Question "${title}" submitted to seniors.`
    );
  };

  // =========================================================
  // INVITE TEAM MEMBER
  // =========================================================

  const handleInviteCandidate = (
    name: string
  ) => {
    showToast(
      `Invitation dispatched to ${name}!`
    );
  };

  // =========================================================
  // BOOTSTRAP LOADING
  // =========================================================

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#0d0c0f]" />
    );
  }

  // =========================================================
  // LOGIN
  // =========================================================

  if (!session) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onSignUp={handleSignUp}
      />
    );
  }

  // =========================================================
  // PROFILE CREATION SUCCESS
  // =========================================================

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

  // =========================================================
  // PROFILE SETUP
  // =========================================================

  if (!user) {
    return (
      <ProfileSetupScreen
        email={session.email}
        onComplete={handleCreateProfile}
      />
    );
  }

  // =========================================================
  // MAIN APPLICATION
  // =========================================================

  return (
    <div className="min-h-screen bg-[#0d0c0f] text-[#f5f1eb] flex flex-col antialiased selection:bg-[#c2652a]/30">

      {/* ===================================================
          TOAST
      =================================================== */}

      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e1d24] border border-[#c2652a]/40 text-[#fbe8d8] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="material-symbols-outlined text-[#f0a878] text-lg">
            check_circle
          </span>

          <span className="text-sm font-medium">
            {toastMessage}
          </span>
        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-500/15 border border-rose-400/30 text-rose-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 max-w-[90vw]">

          <span className="material-symbols-outlined text-rose-300 text-lg">
            error
          </span>

          <span className="text-sm font-medium">
            {errorMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setErrorMessage(null)
            }
            className="ml-2 text-rose-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <NavigationSidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenCreateModal={() =>
          setIsCreateEventModalOpen(true)
        }
        user={user}
        onLogout={handleLogout}
      />

      {/* ===================================================
          MAIN CONTENT
      =================================================== */}

      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">

        <TopAppBar
          user={user}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 md:pt-16">

          {/* HOME */}

          {currentScreen === 'home' && (
            <HomeScreen
              user={user}
              signals={initialSignals}
              onNavigate={handleNavigate}
              onOpenCreateModal={() =>
                setIsCreateEventModalOpen(true)
              }
              onEditProfile={() =>
                setIsEditProfileModalOpen(true)
              }
            />
          )}

          {/* CONNECT */}

          {currentScreen === 'connect' && (
            <ConnectScreen
              user={user}
              candidates={connectCandidates}
              onNavigate={handleNavigate}
              onOpenTeamBuilder={() =>
                setIsTeamBuilderModalOpen(true)
              }
              onSendConnectionRequest={
                sendConnectionRequest
              }
              onAcceptConnection={
                acceptConnectionRequest
              }
              onPassCandidate={
                passCandidate
              }
              connectedCount={
                connectedCount
              }
              recentConnections={
                recentConnections
              }
            />
          )}

          {/* CAMPUS PULSE */}

          {currentScreen === 'pulse' && (
            <CampusPulseScreen
              user={user}
              onNavigate={handleNavigate}
            />
          )}

          {/* EVENTS */}

          {currentScreen === 'events' && (
            <EventsScreen
              events={events}
              onNavigate={handleNavigate}
              onOpenCreateModal={() =>
                setIsCreateEventModalOpen(true)
              }
            />
          )}

          {/* GENZEN AI */}

          {currentScreen === 'ai' && (
            <GenZenAIScreen
              user={user}
              onNavigate={handleNavigate}
              onOpenTeamBuilder={() =>
                setIsTeamBuilderModalOpen(true)
              }
            />
          )}

          {/* SENIOR POV */}

          {currentScreen === 'senior_pov' && (
            <SeniorPOVScreen
              user={user}
              questions={questions}
              onNavigate={handleNavigate}
              onAskQuestion={
                handleAskQuestion
              }
            />
          )}

          {/* CLUBS */}

          {currentScreen === 'clubs' && (
            <ClubsScreen
              user={user}
              clubs={mockClubs}
              onNavigate={handleNavigate}
              onOpenCreateClub={() =>
                setIsCreateEventModalOpen(true)
              }
            />
          )}

        </main>
      </div>

      {/* ===================================================
          CREATE EVENT MODAL
      =================================================== */}

      <CreateEventModal
        isOpen={
          isCreateEventModalOpen
        }
        onClose={() =>
          setIsCreateEventModalOpen(false)
        }
        onAddEvent={
          handleAddEvent
        }
      />

      {/* ===================================================
          EDIT PROFILE MODAL
      =================================================== */}

      <EditProfileModal
        isOpen={
          isEditProfileModalOpen
        }
        onClose={() =>
          setIsEditProfileModalOpen(false)
        }
        user={user}
        onSave={(updated) => {
          if (!session) {
            return;
          }

          void (async () => {
            try {
              const saved =
                await studentService.updateStudentProfile(
                  user.student_id,
                  updated
                );

              await hydrateConnectData(
                saved
              );

              showToast(
                'Profile updated successfully.'
              );

              setErrorMessage(null);
            } catch (error) {
              console.error(
                'Profile update failed:',
                error
              );

              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : 'Unable to update profile right now.'
              );
            }
          })();
        }}
      />

      {/* ===================================================
          TEAM BUILDER MODAL
      =================================================== */}

      <TeamBuilderModal
        isOpen={
          isTeamBuilderModalOpen
        }
        onClose={() =>
          setIsTeamBuilderModalOpen(false)
        }
        candidates={
          connectCandidates
        }
        onInviteCandidate={(
          candidate
        ) => {
          sendConnectionRequest(
            candidate
          );

          handleInviteCandidate(
            candidate.name
          );
        }}
      />
    </div>
  );
}

export default App;