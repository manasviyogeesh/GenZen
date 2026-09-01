import React, { useRef, useEffect, useState } from 'react';
import { UserProfile, ScreenType } from '../../types';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Message {
  id: string;
  sender: 'user' | 'ai' | 'error';
  text: string;
  suggestedQuestions?: string[];
}

interface GenZenAIScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onOpenTeamBuilder: () => void;
}

const BACKEND_URL = 'http://localhost:4000/api/genzen/ask';

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const GenZenAIScreen: React.FC<GenZenAIScreenProps> = ({
  user,
  onNavigate,
  onOpenTeamBuilder,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestedChips = [
    { label: 'Find my hackathon team', icon: 'ðŸ¤', prompt: 'I need a team for the upcoming AI Hackathon with backend and frontend teammates.' },
    { label: 'Which club should I join?', icon: 'ðŸ«', prompt: 'Which club is best for machine learning projects and networking in 3rd year?' },
    { label: 'What do seniors recommend?', icon: 'ðŸ‘´', prompt: 'What electives and interview prep do seniors recommend for ML engineering?' },
    { label: "What's happening this week?", icon: 'ðŸ“…', prompt: "Give me a summary of all high-impact hackathons, seminars and club meetups happening this week." },
  ];

  const submitQuestion = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
        signal: AbortSignal.timeout(40_000), // 40s client-side timeout
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer ?? "I couldn't generate a clear answer for that.",
        suggestedQuestions: Array.isArray(data.suggestedQuestions) && data.suggestedQuestions.length > 0
          ? data.suggestedQuestions
          : undefined,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === 'TimeoutError';
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'error',
        text: isTimeout
          ? "GenZen took too long to respond. Please try again in a moment."
          : "Something went wrong reaching the backend. Make sure the server is running and try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    submitQuestion(inputText);
  };

  return (
    <div className="flex-1 h-screen overflow-hidden flex flex-col lg:flex-row">
      {/* Center Chat Workspace */}
      <section className="flex-1 flex flex-col h-full bg-[#0a0a0c] relative overflow-hidden">
        {/* Ambient radial gradients */}
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-900/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Scrollable Conversation Container */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-12 pt-8 pb-48 custom-scrollbar space-y-8 z-10">
          {/* Header */}
          <header className="pt-8 pb-4 text-center">
            <h1 className="font-headline text-5xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-none mb-3">
              GENZEN AI
            </h1>
            <p className="font-headline text-2xl text-[#f0a878] mb-2">What can I help you figure out?</p>
            <p className="font-body text-white/60 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              Ask anything about campus. GenZen connects the answer to people, opportunities and experiences.
            </p>
          </header>

          {/* Messages Feed */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'user' ? (
                <div className="bg-[#1c1c22] text-white/90 rounded-3xl rounded-tr-sm px-6 py-4 max-w-2xl border border-white/10 shadow-xl text-base leading-relaxed">
                  <p>{msg.text}</p>
                </div>
              ) : msg.sender === 'error' ? (
                <div className="bg-rose-500/10 border border-rose-400/25 rounded-3xl rounded-tl-sm px-6 py-4 max-w-2xl shadow-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-300 text-xl shrink-0 mt-0.5">error</span>
                  <p className="text-rose-200/90 text-sm leading-relaxed">{msg.text}</p>
                </div>
              ) : (
                <div className="bg-[#121216]/90 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-sm p-6 max-w-3xl shadow-2xl space-y-4">
                  <div className="flex items-start gap-4">
                    <p className="font-body text-base sm:text-lg text-white/90 leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>

                  {/* Suggested follow-up chips from API */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2.5">Follow-up questions</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => submitQuestion(q)}
                            disabled={isLoading}
                            className="px-3.5 py-1.5 bg-[#1a1a24] border border-white/10 rounded-full text-xs text-white/70 hover:border-[#c2652a] hover:text-[#f0a878] transition-all active:scale-95 disabled:opacity-50 text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#121216]/90 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-2 text-white/50 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#f0a878] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#f0a878] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#f0a878] animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1">GenZen is querying campus intelligence...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 pt-12 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent z-20">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Starter chips (only shown when no conversation yet) */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedChips.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => submitQuestion(chip.prompt)}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 bg-[#141318]/90 backdrop-blur-md border border-white/10 rounded-full text-xs text-white/70 hover:border-[#c2652a] hover:text-[#f0a878] transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Magical Glowing Input Box */}
            <form
              onSubmit={handleSend}
              className="p-1 rounded-2xl bg-gradient-to-r from-[#c2652a]/40 via-purple-500/30 to-cyan-500/30 focus-within:from-[#c2652a] focus-within:via-purple-500 focus-within:to-cyan-500 transition-all shadow-[0_4px_30px_rgba(194,101,42,0.18)]"
            >
              <div className="bg-[#141318]/95 backdrop-blur-xl rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isLoading ? 'Waiting for GenZen...' : 'Ask GenZen anything...'}
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder:text-white/40 text-base font-body disabled:opacity-60"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isLoading}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[#c2652a] hover:bg-[#b05721] text-white transition-all shadow-md disabled:opacity-40 disabled:hover:bg-[#c2652a] active:scale-95"
                    >
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          arrow_upward
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 px-1 text-[11px] text-white/40">
                  <span>Find people, clubs, events, opportunities or advice</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Right Sidebar: Context Panel */}
      <aside className="w-full lg:w-80 bg-[#121216] border-l border-white/10 flex flex-col z-30 shrink-0">
        <div className="p-6 pb-4">
          <h3 className="font-headline text-2xl text-white font-bold flex items-center gap-2">
            <span>ðŸ§ </span>
            <span>Your Context</span>
          </h3>
        </div>

        <div className="px-6 pb-6 pt-2 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          {/* User Profile Summary */}
          <div className="flex items-center gap-3.5 bg-[#1a1a22] p-4 rounded-2xl border border-white/10">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#c2652a]/40 shrink-0">
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">{user.name}</h4>
              <p className="text-xs text-white/50">{user.department} â€¢ {user.year}</p>
            </div>
          </div>

          {/* Active Interests */}
          <div>
            <h5 className="font-bold text-[11px] text-white/40 uppercase tracking-wider mb-2.5">
              Active Interests
            </h5>
            <div className="flex flex-wrap gap-2">
              {(user.interests?.length ? user.interests : ['AI', 'Hackathons', 'Python', 'ML']).map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-[#1a1a22] border border-white/10 rounded-lg text-xs font-medium text-white/90"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Skills */}
          {user.skills?.length > 0 && (
            <div>
              <h5 className="font-bold text-[11px] text-white/40 uppercase tracking-wider mb-2.5">
                Skills
              </h5>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-[#1a1a22] border border-white/10 rounded-lg text-xs font-medium text-white/90"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Focus */}
          {user.bio && (
            <div>
              <h5 className="font-bold text-[11px] text-white/40 uppercase tracking-wider mb-2.5">
                Bio
              </h5>
              <div className="bg-[#c2652a]/15 p-4 rounded-2xl border border-[#c2652a]/30">
                <p className="text-xs text-white/90 leading-relaxed font-medium">{user.bio}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 mt-auto text-center border-t border-white/10">
          <p className="text-[11px] text-white/40 flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">info</span>
            GenZen uses this context to personalize your answers.
          </p>
        </div>
      </aside>
    </div>
  );
};
