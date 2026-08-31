import React, { useState } from 'react';
import { SeniorQuestion, UserProfile, ScreenType } from '../../types';

interface SeniorPOVScreenProps {
  user: UserProfile;
  questions: SeniorQuestion[];
  onNavigate: (screen: ScreenType) => void;
  onAskQuestion: (title: string, category: string, description: string) => void;
}

export const SeniorPOVScreen: React.FC<SeniorPOVScreenProps> = ({
  user,
  questions: initialQuestions,
  onNavigate,
  onAskQuestion
}) => {
  const [questions, setQuestions] = useState<SeniorQuestion[]>(initialQuestions);
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Electives');
  const [newDesc, setNewDesc] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<{ [qId: string]: string }>({});

  const topics = ['All Topics', 'Internships', 'Electives', 'Clubs', 'Placements', 'Professors'];

  const seniorContributors = [
    { name: "Rahul Sharma", details: "Class of '24 • Amazon SDE", answers: 142, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80" },
    { name: "Ananya Patel", details: "Class of '24 • Stanford MS", answers: 98, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80" },
    { name: "Devika Menon", details: "Class of '25 • Google SWE", answers: 74, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80" }
  ];

  const handleVote = (id: string, dir: 'up' | 'down') => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (q.userVote === dir) {
          return { ...q, votes: q.votes + (dir === 'up' ? -1 : 1), userVote: null };
        }
        const delta = q.userVote ? (dir === 'up' ? 2 : -2) : (dir === 'up' ? 1 : -1);
        return { ...q, votes: q.votes + delta, userVote: dir };
      })
    );
  };

  const handleToggleSave = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isSaved: !q.isSaved } : q))
    );
  };

  const handleAddAnswer = (qId: string) => {
    const text = replyTextMap[qId]?.trim();
    if (!text) return;

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newAns = {
          id: `ans-${Date.now()}`,
          author: user.name,
          classInfo: `${user.department} • ${user.year}`,
          verified: false,
          content: text,
          likes: 1,
          badgeColor: 'text-[#f0a878]'
        };
        return {
          ...q,
          answersCount: q.answersCount + 1,
          answers: q.answers ? [...q.answers, newAns] : [newAns]
        };
      })
    );

    setReplyTextMap({ ...replyTextMap, [qId]: '' });
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: SeniorQuestion = {
      id: `q-${Date.now()}`,
      department: user.department,
      year: user.year,
      category: newCategory,
      timestamp: 'Just now',
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      votes: 1,
      answersCount: 0,
      isSaved: false,
      userVote: 'up'
    };

    setQuestions([created, ...questions]);
    onAskQuestion(newTitle, newCategory, newDesc);
    setNewTitle('');
    setNewDesc('');
    setShowAskModal(false);
  };

  const filteredQuestions = questions.filter(
    (q) => selectedTopic === 'All Topics' || q.category.toLowerCase() === selectedTopic.toLowerCase()
  );

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 lg:p-12 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Center Feed Column (8 cols) */}
      <div className="flex-1 space-y-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-white tracking-tight">
              SENIOR POV
            </h1>
            <p className="font-body text-white/60 mt-1.5 text-lg">
              Wisdom from those who've been there.
            </p>
          </div>

          <button
            onClick={() => setShowAskModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#c2652a] hover:bg-[#b05721] text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2 shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_comment</span>
            Ask a Senior
          </button>
        </header>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTopic === t
                  ? 'bg-[#c2652a] text-white shadow-sm'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Question Cards Feed */}
        <div className="space-y-6">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 space-y-6 hover:border-white/20 transition-all shadow-xl"
            >
              {/* Question Top Metadata & Votes */}
              <div className="flex items-start gap-4">
                {/* Voting Capsule */}
                <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 shrink-0">
                  <button
                    onClick={() => handleVote(q.id, 'up')}
                    className={`p-1 hover:text-[#f0a878] transition-colors ${
                      q.userVote === 'up' ? 'text-[#f0a878]' : 'text-white/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">arrow_upward</span>
                  </button>
                  <span className="font-bold text-sm text-white px-1">{q.votes}</span>
                  <button
                    onClick={() => handleVote(q.id, 'down')}
                    className={`p-1 hover:text-rose-400 transition-colors ${
                      q.userVote === 'down' ? 'text-rose-400' : 'text-white/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">arrow_downward</span>
                  </button>
                </div>

                {/* Main Question Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mb-2">
                    <span className="text-[#f0a878] font-bold">{q.department}</span>
                    <span>•</span>
                    <span>{q.year}</span>
                    <span>•</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-[11px] font-medium text-white/80 border border-white/10">
                      {q.category}
                    </span>
                    <span>•</span>
                    <span>{q.timestamp}</span>
                  </div>

                  <h3 className="font-headline text-2xl font-bold text-white mb-2 leading-snug">
                    {q.title}
                  </h3>

                  {q.description && (
                    <p className="font-body text-white/70 text-sm leading-relaxed mb-3">
                      {q.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-white/60 pt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-cyan-400">chat_bubble</span>
                      {q.answersCount} answers
                    </span>

                    <button
                      onClick={() => handleToggleSave(q.id)}
                      className={`flex items-center gap-1 hover:text-white transition-colors ${
                        q.isSaved ? 'text-yellow-400' : ''
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: q.isSaved ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bookmark
                      </span>
                      {q.isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Answers Thread (if any) */}
              {q.answers && q.answers.length > 0 && (
                <div className="border-t border-white/10 pt-5 space-y-4 pl-4 sm:pl-8 border-l-2 border-l-[#c2652a]/40">
                  {q.answers.map((ans) => (
                    <div key={ans.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{ans.author}</span>
                          <span className="text-xs text-white/50">{ans.classInfo}</span>
                          {ans.verified && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Verified Senior
                            </span>
                          )}
                        </div>
                        <button className="flex items-center gap-1 text-xs text-white/60 hover:text-rose-400">
                          <span className="material-symbols-outlined text-[14px]">favorite</span>
                          <span>{ans.likes}</span>
                        </button>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed font-body">
                        {ans.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Box */}
              <div className="pt-2 flex gap-3">
                <input
                  type="text"
                  value={replyTextMap[q.id] || ''}
                  onChange={(e) => setReplyTextMap({ ...replyTextMap, [q.id]: e.target.value })}
                  placeholder="Add your perspective or senior advice..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#c2652a]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddAnswer(q.id);
                  }}
                />
                <button
                  onClick={() => handleAddAnswer(q.id)}
                  className="px-4 py-2 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar (4 cols) */}
      <aside className="w-full lg:w-80 space-y-6">
        {/* Senior Contributors */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-400 text-xl">military_tech</span>
            <h3 className="font-headline font-bold text-lg text-white">Top Senior Mentors</h3>
          </div>

          <div className="space-y-3">
            {seniorContributors.map((c) => (
              <div key={c.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                  <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-sm text-white truncate">{c.name}</h5>
                  <p className="text-xs text-white/50 truncate">{c.details}</p>
                </div>
                <span className="text-[11px] text-[#f0a878] font-bold shrink-0">{c.answers} ans</span>
              </div>
            ))}
          </div>
        </div>

        {/* Waiting for a Senior */}
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <h3 className="font-headline font-bold text-base text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">hourglass_empty</span>
            Waiting for Senior Answers
          </h3>
          <div className="space-y-2.5 text-xs text-white/70">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer">
              <p className="font-medium text-white">"Is the premium hostel worth the extra fee for 2nd year?"</p>
              <span className="text-[10px] text-white/40 block mt-1">ISE • 2nd Year • 0 answers</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer">
              <p className="font-medium text-white">"How do I approach a professor for a research assistant position?"</p>
              <span className="text-[10px] text-white/40 block mt-1">CSE • 2nd Year • 1 answer</span>
            </div>
          </div>
        </div>

        {/* Trending Tags */}
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-headline font-bold text-base text-white mb-3">Trending Discussions</h3>
          <div className="flex flex-wrap gap-2">
            {['#Placements2024', '#ProfMentorship', '#DSA-vs-Projects', '#ClubLeadership', '#StanfordMS'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTopic('All Topics')}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-[#f0a878] hover:bg-white/10 transition-colors border border-white/5"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#16151b] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h3 className="font-headline text-2xl font-bold text-white">Ask a Senior</h3>
              <button
                onClick={() => setShowAskModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                >
                  <option value="Electives" className="bg-[#16151b]">Electives</option>
                  <option value="Internships" className="bg-[#16151b]">Internships</option>
                  <option value="Clubs" className="bg-[#16151b]">Clubs</option>
                  <option value="Placements" className="bg-[#16151b]">Placements</option>
                  <option value="Professors" className="bg-[#16151b]">Professors</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                  Question Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Which elective prepares you best for NLP interviews?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#c2652a]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                  Details / Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide any helpful context about your current semester, skills, or dilemmas..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#c2652a] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAskModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
