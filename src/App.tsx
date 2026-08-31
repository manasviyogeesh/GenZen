import React, { useEffect, useState } from 'react';
import {
  ScreenType,
  UserProfile,
  CampusEvent,
  ChatMessage,
  SeniorQuestion,
} from './types';

import {
  loadSeniorResponses,
  SeniorResponse,
} from './services/seniorApi';

import {
  currentUser,
  initialSignals,
  mockCandidates,
  mockEvents,
  mockClubs,
  mockQuestions,
  initialChatMessages,
} from './data';

import { NavigationSidebar } from './components/NavigationSidebar';
import { TopAppBar } from './components/TopAppBar';
import { HomeScreen } from './components/screens/HomeScreen';
import { ConnectScreen } from './components/screens/ConnectScreen';
import { CampusPulseScreen } from './components/screens/CampusPulseScreen';
import { EventsScreen } from './components/screens/EventsScreen';
import { GenZenAIScreen } from './components/screens/GenZenAIScreen';
import { SeniorPOVScreen } from './components/screens/SeniorPOVScreen';
import { ClubsScreen } from './components/screens/ClubsScreen';

import { CreateEventModal } from './components/modals/CreateEventModal';
import { EditProfileModal } from './components/modals/EditProfileModal';
import { TeamBuilderModal } from './components/modals/TeamBuilderModal';

import {
  createEvent,
  loadEvents,
  toggleEventRsvp,
} from './services/eventsApi';

export function App() {
  const [currentScreen, setCurrentScreen] =
    useState<ScreenType>('home');

  const [user, setUser] =
    useState<UserProfile>(currentUser);

  const [events, setEvents] =
    useState<CampusEvent[]>(mockEvents);

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>(initialChatMessages);

  const [questions, setQuestions] =
    useState<SeniorQuestion[]>(mockQuestions);

  // Senior responses from Databricks
  const [seniorResponses, setSeniorResponses] =
    useState<SeniorResponse[]>([]);

  const [seniorLoading, setSeniorLoading] =
    useState(false);

  const [seniorError, setSeniorError] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState('');

  // Modals state
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] =
    useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] =
    useState(false);

  const [isTeamBuilderModalOpen, setIsTeamBuilderModalOpen] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleNavigate = (screen: ScreenType) => {
    setCurrentScreen(screen);

    window.scrollTo({
      top: 0,
      behavior: 'instant',
    });
  };

  const handleAddEvent = (newEvent: CampusEvent) => {
    return createEvent(newEvent)
      .then(() => {
        setEvents((previous) => [
          newEvent,
          ...previous,
        ]);

        showToast(
          `🎉 Event "${newEvent.title}" published!`,
        );
      })
      .catch((error: unknown) => {
        showToast(
          error instanceof Error
            ? error.message
            : 'Unable to publish event.',
        );

        throw error;
      });
  };

  // Load events from backend
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

  // Load senior responses from Databricks
  useEffect(() => {
    setSeniorLoading(true);

    loadSeniorResponses()
      .then((data) => {
        setSeniorResponses(data);
        setSeniorError(null);
      })
      .catch((error: unknown) => {
        console.error(
          'Failed to load senior responses:',
          error,
        );

        setSeniorError(
          error instanceof Error
            ? error.message
            : 'Unable to load senior responses.',
        );
      })
      .finally(() => {
        setSeniorLoading(false);
      });
  }, []);

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [
      ...prev,
      userMsg,
    ]);

    // Intelligent automated response simulator for GenZen AI
    setTimeout(() => {
      let aiResponseText =
        `I analyzed campus activity for: "${text}". Here is what our campus intelligence graph recommends.`;

      let cards: ChatMessage['cards'] =
        undefined;

      const lower = text.toLowerCase();

      if (
        lower.includes('hackathon') ||
        lower.includes('team') ||
        lower.includes('python')
      ) {
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
                avatar:
                  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
              },
              {
                name: 'Priya',
                role: 'UI/UX • 91%',
                match: 91,
                avatar:
                  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
              },
              {
                name: 'Karthik',
                role: 'Cloud • 89%',
                match: 89,
                avatar:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
              },
            ],
          },
        };
      } else if (
        lower.includes('club') ||
        lower.includes('join')
      ) {
        aiResponseText =
          'Based on your focus on UX research and Machine Learning, the AI & Machine Learning Club (98% match) and Design Collective (85% match) have active recruiting projects this week.';
      } else if (
        lower.includes('senior') ||
        lower.includes('elective') ||
        lower.includes('internship')
      ) {
        aiResponseText =
          'Top seniors recommend CS401 (Advanced ML) for project depth and beginning daily LeetCode practice early in your 4th semester for product firm interviews.';
      } else if (
        lower.includes('week') ||
        lower.includes('event') ||
        lower.includes('schedule')
      ) {
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

      setChatMessages((prev) => [
        ...prev,
        aiMsg,
      ]);
    }, 600);
  };

  const handleAskQuestion = (
    title: string,
    category: string,
    description: string,
  ) => {
    showToast(
      `Question "${title}" submitted to seniors.`,
    );
  };

  const handleInviteCandidate = (
    name: string,
  ) => {
    showToast(
      `Invitation dispatched to ${name}!`,
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0c0f] text-[#f5f1eb] flex flex-col antialiased selection:bg-[#c2652a]/30">

      {/* Toast Notification */}
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

      {/* Shared Navigation Sidebar */}
      <NavigationSidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onOpenCreateModal={() =>
          setIsCreateEventModalOpen(true)
        }
        searchQuery={searchQuery}
        onToggleRsvp={async (
          eventId,
          title,
          registered,
        ) => {
          await toggleEventRsvp(
            eventId,
            registered,
          );

          showToast(
            registered
              ? `RSVP cancelled for "${title}".`
              : `RSVP confirmed for "${title}".`,
          );
        }}
        user={user}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">

        {/* Top App Bar */}
        <TopAppBar
          user={user}
          onNavigate={handleNavigate}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Screen View Container */}
        <main className="flex-1 md:pt-16">

          {/* Home */}
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

          {/* Connect */}
          {currentScreen === 'connect' && (
            <ConnectScreen
              user={user}
              candidates={mockCandidates}
              onNavigate={handleNavigate}
              onOpenTeamBuilder={() =>
                setIsTeamBuilderModalOpen(true)
              }
            />
          )}

          {/* Campus Pulse */}
          {currentScreen === 'pulse' && (
            <CampusPulseScreen
              user={user}
              onNavigate={handleNavigate}
            />
          )}

          {/* Events */}
          {currentScreen === 'events' && (
            <EventsScreen
              events={events}
              onNavigate={handleNavigate}
              onOpenCreateModal={() =>
                setIsCreateEventModalOpen(true)
              }
            />
          )}

          {/* GenZen AI */}
          {currentScreen === 'ai' && (
            <GenZenAIScreen
              user={user}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onNavigate={handleNavigate}
              onOpenTeamBuilder={() =>
                setIsTeamBuilderModalOpen(true)
              }
            />
          )}

          {/* Senior POV */}
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

          {/* Clubs */}
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

      {/* Modals */}

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() =>
          setIsCreateEventModalOpen(false)
        }
        onAddEvent={handleAddEvent}
      />

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() =>
          setIsEditProfileModalOpen(false)
        }
        user={user}
        onSave={(updated) => {
          setUser(updated);
          showToast(
            'Profile updated successfully.',
          );
        }}
      />

      <TeamBuilderModal
        isOpen={isTeamBuilderModalOpen}
        onClose={() =>
          setIsTeamBuilderModalOpen(false)
        }
        candidates={mockCandidates}
        onInviteCandidate={handleInviteCandidate}
      />
    </div>
  );
}

export default App;