import React, { useState } from 'react';
import { UserProfile, ChatMessage, ScreenType } from '../../types';

interface GenZenAIScreenProps {
  user: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenTeamBuilder: () => void;
}

export const GenZenAIScreen: React.FC<GenZenAIScreenProps> = ({
  user,
  messages,
  onSendMessage,
  onNavigate,
  onOpenTeamBuilder
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedChips = [
    { label: 'Find my hackathon team', icon: '🤝', prompt: 'I need a team for the upcoming AI Hackathon with backend and frontend teammates.' },
    { label: 'Which club should I join?', icon: '🏫', prompt: 'Which club is best for machine learning projects and networking in 3rd year?' },
    { label: 'What do seniors recommend?', icon: '👴', prompt: 'What electives and interview prep do seniors recommend for ML engineering?' },
    { label: "What's happening this week?", icon: '📅', prompt: "Give me a summary of all high-impact hackathons, seminars and club meetups happening this week." },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const query = inputText.trim();
    setInputText('');
    setIsTyping(true);

    onSendMessage(query);

    setTimeout(() => {
      setIsTyping(false);
    }, 800);
  };

  const handleChipClick = (prompt: string) => {
    setInputText(prompt);
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
              ) : (
                <div className="bg-[#121216]/90 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-sm p-6 max-w-3xl shadow-2xl space-y-5">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl shrink-0">🧞</span>
                    <p className="font-body text-base sm:text-lg text-white/90 leading-relaxed">
                      {msg.text}
                    </p>
                  </div>

                  {/* Render interactive cards if present */}
                  {msg.cards && (
                    <div className="space-y-4 pt-2">
                      {/* Hackathon Link Card */}
                      {msg.cards.hackathon && (
                        <div
                          onClick={() => onNavigate('events')}
                          className="bg-[#1a1a20] hover:bg-[#22222a] rounded-2xl p-4 flex items-center justify-between border border-white/10 transition-colors cursor-pointer group shadow-md"
                        >
                          <div>
                            <h4 className="font-headline text-xl text-white font-bold flex items-center gap-2">
                              <span>🏆</span>
                              <span>{msg.cards.hackathon.title}</span>
                            </h4>
                            <div className="flex gap-4 mt-2 text-xs text-white/60">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-[#f0a878]">schedule</span>
                                {msg.cards.hackathon.daysLeft} days left
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[15px] text-cyan-400">group</span>
                                {msg.cards.hackathon.attending} attending
                              </span>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-[#f0a878] group-hover:translate-x-1 transition-transform">
                            chevron_right
                          </span>
                        </div>
                      )}

                      {/* Potential Team Card */}
                      {msg.cards.potentialTeam && (
                        <div className="bg-[#1a1a20] rounded-2xl p-5 border border-white/10 shadow-md">
                          <h4 className="font-headline text-xl text-white font-bold mb-4 flex items-center gap-2">
                            <span>👥</span> Your potential team
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                            {msg.cards.potentialTeam.members.map((member) => (
                              <div
                                key={member.name}
                                onClick={() => onNavigate('connect')}
                                className="bg-[#22222a] hover:bg-[#2a2a34] p-3.5 rounded-xl border border-white/5 flex items-center gap-3 transition-colors cursor-pointer"
                              >
                                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/15">
                                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-sm truncate">{member.name}</p>
                                  <p className="text-xs text-white/50 truncate">{member.role}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/10 pt-4 gap-3">
                            <p className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[#f0a878] text-[18px]">
                                stacked_line_chart
                              </span>
                              Team compatibility: {msg.cards.potentialTeam.compatibility}%
                            </p>

                            <div className="flex gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => onNavigate('connect')}
                                className="flex-1 sm:flex-initial px-4 py-2 border border-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
                              >
                                Find more
                              </button>
                              <button
                                onClick={onOpenTeamBuilder}
                                className="flex-1 sm:flex-initial px-4 py-2 bg-[#c2652a] text-white rounded-xl text-xs font-bold hover:bg-[#b05721] transition-colors shadow-md"
                              >
                                Build my team
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#121216]/90 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-2 text-white/50 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#f0a878] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#f0a878] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#f0a878] animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1">GenZen is indexing campus intelligence...</span>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 pt-12 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/90 to-transparent z-20">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Suggested Question Chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.prompt)}
                  className="px-3.5 py-1.5 bg-[#141318]/90 backdrop-blur-md border border-white/10 rounded-full text-xs text-white/70 hover:border-[#c2652a] hover:text-[#f0a878] transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>

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
                    placeholder="Ask GenZen anything..."
                    className="flex-1 bg-transparent border-none focus:outline-none text-white placeholder:text-white/40 text-base font-body"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">mic</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[#c2652a] hover:bg-[#b05721] text-white transition-all shadow-md disabled:opacity-40 disabled:hover:bg-[#c2652a] active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        arrow_upward
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 px-1 text-[11px] text-white/40">
                  <span>Find people, clubs, events, opportunities or advice</span>
                  <button
                    type="button"
                    onClick={() => handleChipClick('Summarize my campus context & match potential')}
                    className="text-[#f0a878] font-bold hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Add context
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Right Sidebar: Context Panel (W-80) */}
      <aside className="w-full lg:w-80 bg-[#121216] border-l border-white/10 flex flex-col z-30 shrink-0">
        <div className="p-6 pb-4">
          <h3 className="font-headline text-2xl text-white font-bold flex items-center gap-2">
            <span>🧠</span>
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
              <p className="text-xs text-white/50">{user.department} • {user.year}</p>
            </div>
          </div>

          {/* Active Interests */}
          <div>
            <h5 className="font-bold text-[11px] text-white/40 uppercase tracking-wider mb-2.5">
              Active Interests
            </h5>
            <div className="flex flex-wrap gap-2">
              {['AI', 'Hackathons', 'Python', 'ML', 'SQL'].map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-[#1a1a22] border border-white/10 rounded-lg text-xs font-medium text-white/90"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Current Focus */}
          <div>
            <h5 className="font-bold text-[11px] text-white/40 uppercase tracking-wider mb-2.5">
              Current Focus
            </h5>
            <div className="bg-[#c2652a]/15 p-4 rounded-2xl border border-[#c2652a]/30">
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                Looking to build a portfolio project before summer internships.
              </p>
            </div>
          </div>
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
