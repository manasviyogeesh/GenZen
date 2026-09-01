export type ScreenType =
  | 'home'
  | 'connect'
  | 'pulse'
  | 'events'
  | 'ai'
  | 'senior_pov'
  | 'clubs';

export type ConnectionStatus = 'pending' | 'connected' | 'passed';

export interface UserProfile {
  student_id: string;
  auth_user_id: string;
  email: string;
  name: string;
  role: string;
  year: string;
  branch: string;
  department: string;
  connectionsCount: number;
  avatar: string;
  avatarUrl: string;
  skills: string[];
  interests: string[];
  lookingFor: string[];
  availability: string[];
  bio: string;
  clubs: string[];
  events: string[];
  connections: string[];
  created_at: string;
  last_active: string;
}

export interface AuthAccount {
  auth_user_id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  created_at: string;
  last_login_at?: string;
}

export interface AuthSession {
  auth_user_id: string;
  email: string;
  signed_in_at: string;
}

export interface ConnectionRecord {
  connection_id: string;
  student_id: string;
  connected_student_id: string;
  status: ConnectionStatus;
  requested_by: string;
  created_at: string;
  updated_at: string;
}

export interface MatchInsight {
  score: number;
  reasons: string[];
}

export interface StudentProfileDraft {
  name: string;
  branch: string;
  year: string;
  bio: string;
  avatar: string;
  interests: string[];
  skills: string[];
  lookingFor: string[];
  availability: string[];
}

export interface SignalItem {
  id: string;
  type: 'hackathon' | 'positions' | 'teammates' | 'trending';
  icon: string;
  title: string;
  subtitle: string;
  highlightText: string;
  timestamp: string;
  color: string;
  activeCount?: number;
}

export interface TeammateCandidate {
  id: string;
  student_id: string;
  auth_user_id: string;
  name: string;
  department: string;
  year: string;
  matchScore: number;
  avatarUrl: string;
  bio: string;
  skills: string[];
  interests: string[];
  lookingFor: string[];
  availability: string;
  matchReason: string;
  matchReasonBullets: string[];
  presenceLabel: 'Online now' | 'Active recently' | 'Offline';
  relationshipStatus: 'connect' | 'pass' | 'pending' | 'connected' | 'incoming_pending';
}

export interface CampusEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  time: string;
  category: 'Workshop' | 'Networking' | 'Club Event' | 'Hackathon' | 'Career';
  categoryColor: string;
  dotColor: string;
  attendeesCount?: number;
  description?: string;
  location?: string;
}

export interface ClubItem {
  id: string;
  name: string;
  iconName: string;
  activityLevel: 'Very Active' | 'Active' | 'Moderate';
  matchScore: number;
  description: string;
  membersCount: number;
  activeProjectsCount: number;
  matchReason: string;
  nextEvent?: {
    title: string;
    time: string;
  };
  category: 'Technical' | 'Cultural' | 'Sports' | 'Creative' | 'Entrepreneurship' | 'Research';
}

export interface SeniorQuestion {
  id: string;
  department: string;
  year: string;
  category: string;
  timestamp: string;
  title: string;
  description?: string;
  votes: number;
  answersCount: number;
  isSaved?: boolean;
  userVote?: 'up' | 'down' | null;
  answers?: {
    id: string;
    author: string;
    classInfo: string;
    verified: boolean;
    content: string;
    likes: number;
    badgeColor?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  cards?: {
    hackathon?: {
      title: string;
      daysLeft: number;
      attending: number;
    };
    potentialTeam?: {
      compatibility: number;
      members: {
        name: string;
        role: string;
        match: number;
        avatar: string;
      }[];
    };
  };
}
