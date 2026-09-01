import { StudentProfileDraft, UserProfile } from '../types';
import { apiClient } from './apiClient';
import { DEFAULT_AVATAR } from './constants';

const nowIso = (): string => new Date().toISOString();

const normalizeProfile = (profile: UserProfile): UserProfile => {
  const branch = profile.branch || profile.department;
  const avatar = profile.avatar || profile.avatarUrl || DEFAULT_AVATAR;

  return {
    ...profile,
    branch,
    department: profile.department || branch,
    avatar,
    avatarUrl: profile.avatarUrl || avatar,
    role: profile.role || 'Student',
    interests: profile.interests || [],
    skills: profile.skills || [],
    lookingFor: profile.lookingFor || [],
    availability: profile.availability || [],
    clubs: profile.clubs || [],
    events: profile.events || [],
    connections: profile.connections || []
  };
};

export const studentService = {
  async getStudents(excludeId?: string): Promise<UserProfile[]> {
    const query = excludeId ? `?excludeId=${encodeURIComponent(excludeId)}` : '';
    const profiles = await apiClient.get<UserProfile[]>(`/api/students${query}`);
    return profiles.map(normalizeProfile);
  },

  async getStudentByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    const profiles = await apiClient.get<UserProfile[]>(`/api/students?authUserId=${encodeURIComponent(authUserId)}`);
    return profiles.length > 0 ? normalizeProfile(profiles[0]) : null;
  },

  async getStudentByStudentId(studentId: string): Promise<UserProfile | null> {
    try {
      const profile = await apiClient.get<UserProfile>(`/api/students/${encodeURIComponent(studentId)}`);
      return normalizeProfile(profile);
    } catch {
      return null;
    }
  },

  async createStudentProfile(authUserId: string, email: string, draft: StudentProfileDraft): Promise<UserProfile> {
    const existing = await this.getStudentByAuthUserId(authUserId);
    if (existing) {
      return existing;
    }

    const createdAt = nowIso();
    const profile: UserProfile = normalizeProfile({
      student_id: window.crypto.randomUUID(),
      auth_user_id: authUserId,
      email,
      name: draft.name.trim(),
      role: 'Student',
      year: draft.year.trim(),
      branch: draft.branch.trim(),
      department: draft.branch.trim(),
      connectionsCount: 0,
      avatar: draft.avatar || DEFAULT_AVATAR,
      avatarUrl: draft.avatar || DEFAULT_AVATAR,
      skills: draft.skills,
      interests: draft.interests,
      lookingFor: draft.lookingFor,
      availability: draft.availability,
      bio: draft.bio.trim(),
      clubs: [],
      events: [],
      connections: [],
      created_at: createdAt,
      last_active: createdAt
    });

    const created = await apiClient.post<UserProfile>('/api/students', profile);
    return normalizeProfile(created);
  },

  async updateStudentProfile(studentId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const updated = await apiClient.put<UserProfile>(`/api/students/${encodeURIComponent(studentId)}`, {
      ...updates,
      last_active: nowIso()
    });
    return normalizeProfile(updated);
  },

  async touchActive(authUserId: string): Promise<UserProfile | null> {
    const profile = await this.getStudentByAuthUserId(authUserId);
    if (!profile) {
      return null;
    }

    return this.updateStudentProfile(profile.student_id, { last_active: nowIso() });
  }
};
