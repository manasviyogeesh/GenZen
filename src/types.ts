export type ScreenType =
  | 'home'
  | 'connect'
  | 'pulse'
  | 'events'
  | 'ai'
  | 'senior_pov'
  | 'clubs';

export interface UserProfile {
  name: string;
  role: string;
  year: string;
  department: string;
  connectionsCount: number;
  avatarUrl: string;
  skills: string[];
  interests: string[];
  lookingFor: string[];
  availability: string;
  bio: string;
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
}

export interface CampusEvent {
  id: string;
  day: number;
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
