import React, { useEffect, useMemo, useState } from 'react';
import { ScreenType, SeniorPovInsights, SeniorQuestion, UserProfile } from '../../types';
import { seniorPovService } from '../../services/seniorPovService';

interface SeniorPOVScreenProps {
  user: UserProfile;
  onNavigate: (screen: ScreenType) => void;
  onAskQuestion: (title: string, category: string, description: string) => void;
}

const TOPICS = ['All Topics', 'Internships', 'Electives', 'Clubs', 'Placements', 'Professors'];

const EMPTY_INSIGHTS: SeniorPovInsights = {
  overview: [],
  contributors: [],
  trendingCategories: [],
  unansweredQuestions: []
};

const getCardBorderClass = (index: number) => {
  if (index === 0) {
    return 'border-[#c2652a]/25';
  }

  if (index === 1) {
    return 'border-cyan-500/25';
  }

  return 'border-white/10';
};

export const SeniorPOVScreen: React.FC<SeniorPOVScreenProps> = ({
  user,
  onNavigate,
  onAskQuestion
}) => {
  const [questions, setQuestions] = useState<SeniorQuestion[]>([]);
  const [insights, setInsights] = useState<SeniorPovInsights>(EMPTY_INSIGHTS);
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Electives');
  const [newDesc, setNewDesc] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDashboard = async () => {
    const dashboard = await seniorPovService.getDashboard();
    setQuestions(dashboard.questions);
    setInsights(dashboard.insights);
  };

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const dashboard = await seniorPovService.getDashboard();
        if (!mounted) {
          return;
        }

        setQuestions(dashboard.questions);
        setInsights(dashboard.insights);
        setErrorMessage(null);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load Senior POV right now.');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user.student_id]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((question) => (
      selectedTopic === 'All Topics'
        || question.category.toLowerCase() === selectedTopic.toLowerCase()
    ));
  }, [questions, selectedTopic]);

  const showMessage = (message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleVote = async (questionId: string, direction: 'up' | 'down') => {
    try {
      await seniorPovService.voteQuestion(questionId, {
        direction
      });

      await refreshDashboard();
      showMessage(direction === 'up' ? 'Upvote saved.' : 'Downvote saved.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save your vote.');
    }
  };

  const handleToggleSave = async (questionId: string) => {
    try {
      await seniorPovService.saveQuestion(questionId, {
      });

      await refreshDashboard();
      showMessage('Question saved to your shortlist.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save this question.');
    }
  };

  const handleAddAnswer = async (questionId: string) => {
    const text = replyTextMap[questionId]?.trim();
    if (!text) {
      return;
    }

    try {
      await seniorPovService.answerQuestion(questionId, {
        content: text
      });

      await refreshDashboard();
      setReplyTextMap((prev) => ({ ...prev, [questionId]: '' }));
      showMessage('Your answer was posted.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to post your answer.');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = newTitle.trim();
    const description = newDesc.trim();

    if (!title) {
      return;
    }

    try {
      await seniorPovService.askQuestion({
        title,
        category: newCategory,
        description
      });

      await refreshDashboard();
      onAskQuestion(title, newCategory, description);
      setNewTitle('');
      setNewDesc('');
      setShowAskModal(false);
      showMessage('Your question is now live.');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to post your question.');
    }
  };

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 lg:p-12 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-white tracking-tight">
              SENIOR POV
            </h1>
            <p className="font-body text-white/60 mt-1.5 text-lg">
              Wisdom from those who have been there.
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

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedTopic === topic
                  ? 'bg-[#c2652a] text-white shadow-sm'
                  : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {statusMessage && (
          <div className="px-4 py-2.5 rounded-xl bg-[#c2652a]/15 border border-[#c2652a]/30 text-[#fbe8d8] text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#f0a878]">info</span>
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="px-4 py-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-100 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-300">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-6">
          {isLoading && questions.length === 0 && (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl text-white/70">
              Loading senior advice...
            </div>
          )}

          {!isLoading && filteredQuestions.length === 0 && (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl text-center text-white/70">
              No questions found in this category yet.
            </div>
          )}

          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className={`glass-card rounded-3xl p-6 md:p-8 border space-y-6 hover:border-white/20 transition-all shadow-xl ${question.isSynthetic ? 'border-[#c2652a]/20' : 'border-white/10'}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 shrink-0">
                  <button
                    onClick={() => void handleVote(question.id, 'up')}
                    className={`p-1 hover:text-[#f0a878] transition-colors ${question.userVote === 'up' ? 'text-[#f0a878]' : 'text-white/40'}`}
                  >
                    <span className="material-symbols-outlined text-lg">arrow_upward</span>
                  </button>
                  <span className="font-bold text-sm text-white px-1">{question.votes}</span>
                  <button
                    onClick={() => void handleVote(question.id, 'down')}
                    className={`p-1 hover:text-rose-400 transition-colors ${question.userVote === 'down' ? 'text-rose-400' : 'text-white/40'}`}
                  >
                    <span className="material-symbols-outlined text-lg">arrow_downward</span>
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/50 mb-2">
                    <span className="text-[#f0a878] font-bold">{question.department}</span>
                    <span>•</span>
                    <span>{question.year}</span>
                    <span>•</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-[11px] font-medium text-white/80 border border-white/10">
                      {question.category}
                    </span>
                    {question.isSynthetic && (
                      <>
                        <span>•</span>
                        <span className="bg-[#c2652a]/15 px-2 py-0.5 rounded text-[10px] font-bold text-[#fbe8d8] border border-[#c2652a]/25">
                          Synthetic mentor post
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>{question.timestamp}</span>
                  </div>

                  <h3 className="font-headline text-2xl font-bold text-white mb-2 leading-snug">
                    {question.title}
                  </h3>

                  {question.description && (
                    <p className="font-body text-white/70 text-sm leading-relaxed mb-3">
                      {question.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-white/60 pt-2">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-cyan-400">chat_bubble</span>
                      {question.answersCount} answers
                    </span>

                    <button
                      onClick={() => void handleToggleSave(question.id)}
                      className={`flex items-center gap-1 hover:text-white transition-colors ${question.isSaved ? 'text-yellow-400' : ''}`}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: question.isSaved ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bookmark
                      </span>
                      {question.isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>

              {question.answers && question.answers.length > 0 && (
                <div className="border-t border-white/10 pt-5 space-y-4 pl-4 sm:pl-8 border-l-2 border-l-[#c2652a]/40">
                  {question.answers.map((answer) => (
                    <div key={answer.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{answer.author}</span>
                          <span className="text-xs text-white/50">{answer.classInfo}</span>
                          {answer.verified && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Verified Senior
                            </span>
                          )}
                        </div>
                        <button className="flex items-center gap-1 text-xs text-white/60 hover:text-rose-400">
                          <span className="material-symbols-outlined text-[14px]">favorite</span>
                          <span>{answer.likes}</span>
                        </button>
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed font-body">
                        {answer.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <input
                  type="text"
                  value={replyTextMap[question.id] || ''}
                  onChange={(event) => setReplyTextMap({ ...replyTextMap, [question.id]: event.target.value })}
                  placeholder="Add your perspective or senior advice..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#c2652a]"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleAddAnswer(question.id);
                    }
                  }}
                />
                <button
                  onClick={() => void handleAddAnswer(question.id)}
                  className="px-4 py-2 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Answer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="w-full lg:w-80 space-y-6">
        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-400 text-xl">military_tech</span>
            <h3 className="font-headline font-bold text-lg text-white">Senior Insights</h3>
          </div>

          <div className="space-y-3">
            {insights.overview.map((card, index) => (
              <div
                key={card.id}
                className={`p-3 rounded-2xl bg-white/5 border ${getCardBorderClass(index)} flex items-start justify-between gap-3`}
              >
                <div>
                  <div className="flex items-center gap-2 text-[#f0a878] text-[10px] uppercase tracking-widest font-bold mb-1">
                    <span className="material-symbols-outlined text-[14px]">{card.icon}</span>
                    <span>{card.title}</span>
                  </div>
                  <p className="text-xs text-white/55">{card.subtitle}</p>
                </div>
                <span className="text-xl font-headline font-bold text-white">{card.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
          <h3 className="font-headline font-bold text-lg text-white">Top Senior Contributors</h3>
          <div className="space-y-3">
            {insights.contributors.length === 0 && (
              <p className="text-xs text-white/50">No senior answers yet.</p>
            )}

            {insights.contributors.map((contributor) => (
              <div key={`${contributor.name}-${contributor.details}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                  <img src={contributor.avatar} alt={contributor.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-sm text-white truncate">{contributor.name}</h5>
                  <p className="text-xs text-white/50 truncate">{contributor.details}</p>
                </div>
                <span className="text-[11px] text-[#f0a878] font-bold shrink-0">{contributor.answers} ans</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-3">
          <h3 className="font-headline font-bold text-base text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">hourglass_empty</span>
            Waiting for Senior Answers
          </h3>
          <div className="space-y-2.5 text-xs text-white/70">
            {insights.unansweredQuestions.length === 0 && (
              <p className="text-xs text-white/50">Every visible thread has at least one answer.</p>
            )}

            {insights.unansweredQuestions.map((question) => (
              <div key={question.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 cursor-pointer">
                <p className="font-medium text-white">{question.title}</p>
                <span className="text-[10px] text-white/40 block mt-1">{question.department} • {question.year} • {question.answersCount} answers</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="font-headline font-bold text-base text-white mb-3">Trending Discussions</h3>
          <div className="flex flex-wrap gap-2">
            {insights.trendingCategories.map((tag) => (
              <button
                key={tag.category}
                onClick={() => setSelectedTopic(tag.category)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-[#f0a878] hover:bg-white/10 transition-colors border border-white/5"
              >
                {tag.category} • {tag.count}
              </button>
            ))}
          </div>
        </div>
      </aside>

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
                  onChange={(event) => setNewCategory(event.target.value)}
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
                  onChange={(event) => setNewTitle(event.target.value)}
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
                  onChange={(event) => setNewDesc(event.target.value)}
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
