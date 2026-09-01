import { apiClient } from './apiClient';
import {
  SeniorContributor,
  SeniorPovDashboard,
  SeniorPovInsights,
  SeniorQuestion
} from '../types';

export interface SeniorPovQuestionPayload {
  title: string;
  description: string;
  category: string;
}

export interface SeniorPovAnswerPayload {
  content: string;
}

export interface SeniorPovVotePayload {
  direction: 'up' | 'down';
}

export interface SeniorPovSavePayload {
}

const toQuery = (params: Record<string, string | undefined>): string => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
};

const formatRelativeTime = (value?: string): string => {
  if (!value) {
    return 'Just now';
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Just now';
  }

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const normalizeQuestion = (question: SeniorQuestion): SeniorQuestion => ({
  ...question,
  title: question.title || 'Untitled question',
  description: question.description || '',
  answers: question.answers || [],
  votes: Number(question.votes || 0),
  answersCount: Number(question.answersCount || 0),
  isSaved: Boolean(question.isSaved),
  userVote: question.userVote || null,
  timestamp: formatRelativeTime(question.created_at || question.timestamp),
  department: question.department || question.authorBranch || 'General',
  year: question.year || question.authorYear || '',
  authorAvatar: question.authorAvatar || '',
  authorBranch: question.authorBranch || question.department || 'General',
  authorYear: question.authorYear || question.year || '',
  authorName: question.authorName || '',
  isSynthetic: Boolean(question.isSynthetic)
});

const normalizeInsights = (insights: SeniorPovInsights): SeniorPovInsights => ({
  overview: insights.overview || [],
  contributors: insights.contributors || [],
  trendingCategories: insights.trendingCategories || [],
  unansweredQuestions: (insights.unansweredQuestions || []).map(normalizeQuestion)
});

const normalizeDashboard = (dashboard: SeniorPovDashboard): SeniorPovDashboard => ({
  questions: (dashboard.questions || []).map(normalizeQuestion),
  insights: normalizeInsights(dashboard.insights)
});

export const seniorPovService = {
  async getDashboard(category?: string): Promise<SeniorPovDashboard> {
    const response = await apiClient.get<SeniorPovDashboard>(`/api/senior-pov/questions${toQuery({ category })}`);

    return normalizeDashboard(response);
  },

  async getInsights(): Promise<SeniorPovInsights> {
    const response = await apiClient.get<SeniorPovInsights>('/api/senior-pov/insights');
    return normalizeInsights(response);
  },

  async askQuestion(payload: SeniorPovQuestionPayload): Promise<SeniorQuestion> {
    const response = await apiClient.post<SeniorQuestion>('/api/senior-pov/questions', payload);
    return normalizeQuestion(response);
  },

  async answerQuestion(questionId: string, payload: SeniorPovAnswerPayload): Promise<SeniorQuestion | null> {
    const response = await apiClient.post<SeniorQuestion | null>(`/api/senior-pov/questions/${encodeURIComponent(questionId)}/answers`, payload);
    return response ? normalizeQuestion(response) : null;
  },

  async voteQuestion(questionId: string, payload: SeniorPovVotePayload): Promise<SeniorQuestion | null> {
    const response = await apiClient.post<SeniorQuestion | null>(`/api/senior-pov/questions/${encodeURIComponent(questionId)}/vote`, payload);
    return response ? normalizeQuestion(response) : null;
  },

  async saveQuestion(questionId: string, payload: SeniorPovSavePayload): Promise<SeniorQuestion | null> {
    const response = await apiClient.post<SeniorQuestion | null>(`/api/senior-pov/questions/${encodeURIComponent(questionId)}/save`, payload);
    return response ? normalizeQuestion(response) : null;
  }
};
