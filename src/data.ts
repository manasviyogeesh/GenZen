import {
  UserProfile,
  SignalItem,
  CampusEvent,
  ClubItem,
  AlumniProfile,
  SeniorQuestion,
  ChatMessage,
} from './types';

export const currentUser: UserProfile = {
  student_id: 'stu-demo-001',
  auth_user_id: 'dev-user-001',
  email: 'manasvi@example.com',
  name: 'Manasvi Y',
  role: 'UX Researcher',
  year: '3rd Year',
  branch: 'CSE',
  department: 'CSE',
  connectionsCount: 24,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  skills: ['Python', 'SQL', 'Java', 'UI/UX', 'ML Basics'],
  interests: ['AI', 'Hackathons', 'Startups', 'Design'],
  lookingFor: ['Project teammates', 'Hackathons', 'Research opportunities'],
  availability: ['Weekends & Evenings'],
  bio: 'CSE 3rd Year student passionate about AI interfaces and collaborative builder culture.',
  clubs: [],
  events: [],
  connections: [],
  created_at: new Date().toISOString(),
  last_active: new Date().toISOString(),
};

export const initialSignals: SignalItem[] = [
  {
    id: 'sig-1',
    type: 'hackathon',
    icon: 'local_fire_department',
    title: 'AI Hackathon registrations are trending.',
    subtitle: '127 students joined this week.',
    highlightText: '127 students',
    timestamp: 'Just now',
    color: '#c2652a',
    activeCount: 127
  },
  {
    id: 'sig-2',
    type: 'positions',
    icon: 'emoji_objects',
    title: 'The Robotics Club just opened',
    subtitle: '5 project positions.',
    highlightText: '5 project positions',
    timestamp: '2h ago',
    color: '#06b6d4',
    activeCount: 5
  },
  {
    id: 'sig-3',
    type: 'teammates',
    icon: 'group_add',
    title: '24 students are actively looking for',
    subtitle: 'teammates for the upcoming Game Jam.',
    highlightText: '24 students',
    timestamp: '4h ago',
    color: '#e08850',
    activeCount: 24
  }
];

export const mockEvents: CampusEvent[] = [
  {
    id: 'evt-2',
    day: 2,
    title: 'AI & Ethics Seminar',
    time: '14:00 - 16:30',
    category: 'Workshop',
    categoryColor: 'bg-[#c2652a]/20 text-[#f0a878] border-[#c2652a]/30',
    dotColor: '#f0a878',
    attendeesCount: 64,
    description: 'Deep dive into responsible generative model deployments and governance.',
    location: 'Auditorium Hall B'
  },
  {
    id: 'evt-3',
    day: 3,
    title: 'Startup Pitch Night',
    time: '18:00 - 20:00',
    category: 'Networking',
    categoryColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    dotColor: '#ec4899',
    attendeesCount: 92,
    description: 'Campus founders pitch to angel investors and venture scouts.',
    location: 'Incubation Center Lounge'
  },
  {
    id: 'evt-6',
    day: 6,
    title: 'Robotics Club Meetup',
    time: '15:30 - 17:00',
    category: 'Club Event',
    categoryColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    dotColor: '#06b6d4',
    attendeesCount: 45,
    description: 'Autonomous rover telemetry sprint & hands-on PCB soldering.',
    location: 'Robotics Lab 3'
  },
  {
    id: 'evt-10',
    day: 10,
    title: 'Design Jam 2023',
    time: '09:00 - 18:00',
    category: 'Hackathon',
    categoryColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dotColor: '#f59e0b',
    attendeesCount: 118,
    description: 'Full-day sprint prototyping next-gen educational interfaces.',
    location: 'Design Studio & Innovation Hub'
  },
  {
    id: 'evt-14',
    day: 14,
    title: 'Career Fair Prep',
    time: '13:00 - 15:00',
    category: 'Career',
    categoryColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    dotColor: '#8b5cf6',
    attendeesCount: 180,
    description: 'Resume teardowns, technical interview mock sessions with alumni.',
    location: 'Placement Cell Seminar Hall'
  },
  {
    id: 'evt-18',
    day: 18,
    title: 'Open Source Hackathon Meetup',
    time: '16:00 - 18:00',
    category: 'Workshop',
    categoryColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dotColor: '#10b981',
    attendeesCount: 52,
    description: 'Contributing to high-impact open source repositories.',
    location: 'CS Lab 2'
  },
  {
    id: 'evt-25',
    day: 25,
    title: 'GenAI Product Showcase',
    time: '14:30 - 17:30',
    category: 'Hackathon',
    categoryColor: 'bg-[#c2652a]/20 text-[#f0a878] border-[#c2652a]/30',
    dotColor: '#f0a878',
    attendeesCount: 140,
    description: 'Final demos and live agentic web deployments.',
    location: 'Main Auditorium'
  }
];

export const mockClubs: ClubItem[] = [
  {
    id: 'club-ai',
    name: 'AI & Machine Learning Club',
    iconName: 'memory',
    activityLevel: 'Very Active',
    matchScore: 98,
    description: 'Exploring the frontiers of neural networks and generative AI through practical campus projects.',
    membersCount: 142,
    activeProjectsCount: 4,
    matchReason: "You selected AI + Hackathons and you're looking for project opportunities.",
    category: 'Technical',
    nextEvent: {
      title: 'LLM Fine-Tuning Session',
      time: 'Tomorrow, 5:00 PM • Lab 4'
    }
  },
  {
    id: 'club-design',
    name: 'Design Collective',
    iconName: 'brush',
    activityLevel: 'Active',
    matchScore: 85,
    description: 'A community of UI/UX designers, illustrators, and visual storytellers creating beautiful digital experiences.',
    membersCount: 86,
    activeProjectsCount: 2,
    matchReason: 'Matches your interest in UX research and digital interface craftsmanship.',
    category: 'Creative',
    nextEvent: {
      title: 'Design System Workshop',
      time: 'Tomorrow, 4:00 PM • Design Studio'
    }
  },
  {
    id: 'club-ecell',
    name: 'E-Cell (Entrepreneurship)',
    iconName: 'rocket_launch',
    activityLevel: 'Very Active',
    matchScore: 72,
    description: 'Building the next generation of founders. Pitch ideas, find co-founders, and secure seed funding.',
    membersCount: 210,
    activeProjectsCount: 8,
    matchReason: 'Your profile indicates interest in Leadership & Product Management.',
    category: 'Entrepreneurship',
    nextEvent: {
      title: 'Founder Fireside Chat',
      time: 'Friday, 6:00 PM • Aud Hall'
    }
  },
  {
    id: 'club-robotics',
    name: 'Robotics & Automation Society',
    iconName: 'precision_manufacturing',
    activityLevel: 'Active',
    matchScore: 68,
    description: 'Hardware, firmware, and embedded computing enthusiasts building autonomous rovers and drones.',
    membersCount: 95,
    activeProjectsCount: 3,
    matchReason: 'Hardware integration opportunities complementary to your software skills.',
    category: 'Technical',
    nextEvent: {
      title: 'Drone PID Calibration',
      time: 'Thursday, 3:30 PM • Makerspace'
    }
  }
];

export const mockAlumni: AlumniProfile[] = [
  {
    id: 'alumni-arya',
    name: 'Arya Mehta',
    role: 'Senior Product Engineer',
    company: 'Google',
    department: 'CSE',
    graduationYear: '2019',
    location: 'Bengaluru, India',
    bio: 'Former GenZen campus builder now working on AI-powered developer tooling and mentoring students on product and career growth.',
    linkedInUrl: 'https://www.linkedin.com/in/arya-mehta-demo',
    mentorshipTopics: ['Product strategy', 'AI careers', 'System design'],
    skills: ['Product', 'System Design', 'AI', 'Leadership'],
    verified: true,
    claimed: true,
    availability: 'Open for 1:1 mentoring every Saturday',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'alumni-rhea',
    name: 'Rhea Kapoor',
    role: 'ML Engineer',
    company: 'NVIDIA',
    department: 'CSE',
    graduationYear: '2020',
    location: 'Hyderabad, India',
    bio: 'Builds robust ML systems and helps students navigate research, internships, and domain-specific learning roadmaps.',
    linkedInUrl: 'https://www.linkedin.com/in/rhea-kapoor-demo',
    mentorshipTopics: ['Machine learning', 'Internships', 'Research paths'],
    skills: ['Python', 'PyTorch', 'MLOps', 'Data'],
    verified: true,
    claimed: true,
    availability: 'Open to monthly mentor check-ins',
    avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'alumni-vasu',
    name: 'Vasu Nair',
    role: 'Software Engineer, Platform',
    company: 'Microsoft',
    department: 'IT',
    graduationYear: '2018',
    location: 'Pune, India',
    bio: 'Helps students learn startup thinking, product engineering, and how to move from campus projects to high-impact roles.',
    linkedInUrl: 'https://www.linkedin.com/in/vasu-nair-demo',
    mentorshipTopics: ['Career strategy', 'Startup journeys', 'Software engineering'],
    skills: ['JavaScript', 'Cloud', 'Distributed Systems', 'Leadership'],
    verified: true,
    claimed: false,
    availability: 'Available for project feedback and mock interviews',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  },
  {
    id: 'alumni-neha',
    name: 'Neha Sethi',
    role: 'UX Research Lead',
    company: 'Adobe',
    department: 'Design',
    graduationYear: '2021',
    location: 'Delhi, India',
    bio: 'Advises students on design careers, portfolio building, and transitioning from campus experiences into industry roles.',
    linkedInUrl: 'https://www.linkedin.com/in/neha-sethi-demo',
    mentorshipTopics: ['UX research', 'Portfolio critique', 'Design careers'],
    skills: ['UX', 'Research', 'Product Thinking', 'Figma'],
    verified: false,
    claimed: true,
    availability: 'Weekend office hours for design students',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'
  }
];

export const mockQuestions: SeniorQuestion[] = [
  {
    id: 'q-1',
    department: 'CSE',
    year: '3rd Year',
    category: 'Electives',
    timestamp: '2h ago',
    title: "Which elective should I take if I'm interested in AI/ML?",
    votes: 42,
    answersCount: 18,
    isSaved: false,
    description: 'Deciding between Advanced Machine Learning (CS401) and Applied Natural Language Processing (CS408). Which professor gives better project mentorship?'
  },
  {
    id: 'q-2',
    department: 'ISE',
    year: '2nd Year',
    category: 'Internships',
    timestamp: '5h ago',
    title: 'How early should I start preparing for internships?',
    description: "I'm in my 3rd semester and feeling slightly overwhelmed by seniors already doing LeetCode. Should I focus on my CGPA right now or start grinding DSA?",
    votes: 57,
    answersCount: 24,
    isSaved: true,
    answers: [
      {
        id: 'ans-1',
        author: 'Aarav',
        classInfo: 'CSE • Class of 2025',
        verified: true,
        content: "Don't panic yet. Focus on keeping your CGPA above 8.5 for this semester. However, starting DSA (just 1-2 problems a day) will give you a massive compounding advantage by the time 5th semester rolls around.",
        likes: 24,
        badgeColor: 'text-purple-400'
      },
      {
        id: 'ans-2',
        author: 'Priya',
        classInfo: 'CSE • Class of 2024',
        verified: true,
        content: 'I started in my 4th semester and did just fine. What mattered more was building one really solid full-stack project that I could talk about in depth during interviews.',
        likes: 15,
        badgeColor: 'text-orange-400'
      }
    ]
  },
  {
    id: 'q-3',
    department: 'CSE',
    year: '2nd Year',
    category: 'Clubs',
    timestamp: '1d ago',
    title: 'Is joining a club in 3rd year still worth it?',
    votes: 31,
    answersCount: 12,
    isSaved: false,
    description: 'I was busy with coursework in 1st & 2nd year. Will lead positions still be open to 3rd years?'
  }
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: "I want to participate in a hackathon, but I don't have a team. I know Python and ML.",
    timestamp: '10:42 AM'
  },
  {
    id: 'msg-2',
    sender: 'ai',
    text: "You're actually in a good position to build a team. I found an upcoming AI hackathon and 3 students whose skills complement yours.",
    timestamp: '10:42 AM',
    cards: {
      hackathon: {
        title: 'AI for Good Hackathon',
        daysLeft: 6,
        attending: 42
      },
      potentialTeam: {
        compatibility: 94,
        members: [
          {
            name: 'Aarav',
            role: 'Backend • 93%',
            match: 93,
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'
          },
          {
            name: 'Priya',
            role: 'UI/UX • 91%',
            match: 91,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
          },
          {
            name: 'Karthik',
            role: 'Cloud • 89%',
            match: 89,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
          }
        ]
      }
    }
  }
];
