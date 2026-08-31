import { ConnectionRecord, MatchInsight, TeammateCandidate, UserProfile } from '../types';
import { connectionService } from './connectionService';

const intersect = (left: string[], right: string[]): string[] => {
  const rightSet = new Set(right.map((item) => item.toLowerCase()));
  return left.filter((item) => rightSet.has(item.toLowerCase()));
};

const uniqueCount = (values: string[]): number => new Set(values.map((item) => item.toLowerCase())).size;

const getPresenceLabel = (lastActiveIso: string): 'Online now' | 'Active recently' | 'Offline' => {
  const diffMinutes = (Date.now() - new Date(lastActiveIso).getTime()) / (1000 * 60);

  if (diffMinutes <= 5) {
    return 'Online now';
  }
  if (diffMinutes <= 60 * 24) {
    return 'Active recently';
  }
  return 'Offline';
};

export const matchingService = {
  calculateMatch(currentUser: UserProfile, candidate: UserProfile): MatchInsight {
    const sharedInterests = intersect(currentUser.interests, candidate.interests);
    const sharedGoals = intersect(currentUser.lookingFor, candidate.lookingFor);
    const sharedAvailability = intersect(currentUser.availability, candidate.availability);
    const sharedSkills = intersect(currentUser.skills, candidate.skills);

    const interestScore = Math.min(40, sharedInterests.length * 10);
    const goalsScore = Math.min(25, sharedGoals.length * 9);
    const availabilityScore = Math.min(15, sharedAvailability.length * 7);

    const totalUniqueSkills = uniqueCount([...currentUser.skills, ...candidate.skills]);
    const overlapSkillRatio = totalUniqueSkills > 0 ? (sharedSkills.length / totalUniqueSkills) : 0;
    const complementaryScore = Math.min(20, Math.round((1 - overlapSkillRatio) * 20));

    const score = Math.max(35, Math.min(99, interestScore + goalsScore + availabilityScore + complementaryScore));

    const reasons: string[] = [];
    if (sharedInterests.length > 0) {
      reasons.push(`Shared interest: ${sharedInterests[0]}`);
    }
    if (sharedGoals.length > 0) {
      reasons.push(`Shared goal: ${sharedGoals[0]}`);
    }
    if (sharedAvailability.length > 0) {
      reasons.push(`Similar availability: ${sharedAvailability[0]}`);
    }
    if (complementaryScore >= 10) {
      reasons.push('Complementary skills can strengthen team balance');
    }
    if (reasons.length === 0) {
      reasons.push('Compatible collaboration profile based on your preferences');
    }

    return { score, reasons };
  },

  buildCandidates(currentUser: UserProfile, allStudents: UserProfile[], connections: ConnectionRecord[]): TeammateCandidate[] {
    return allStudents
      .filter((student) => student.student_id !== currentUser.student_id)
      .map((student) => {
        const match = this.calculateMatch(currentUser, student);
        const status = connectionService.getConnectionStatusFromRecords(
          currentUser.student_id,
          student.student_id,
          connections
        );

        return {
          id: student.student_id,
          student_id: student.student_id,
          auth_user_id: student.auth_user_id,
          name: student.name,
          department: student.branch,
          year: student.year,
          matchScore: match.score,
          avatarUrl: student.avatar,
          bio: student.bio || 'Open to collaborate across campus projects.',
          skills: student.skills,
          interests: student.interests,
          lookingFor: student.lookingFor,
          availability: student.availability.join(' • '),
          matchReason: match.reasons.join('. '),
          matchReasonBullets: match.reasons,
          presenceLabel: getPresenceLabel(student.last_active),
          relationshipStatus: status
        };
      })
      .sort((left, right) => right.matchScore - left.matchScore);
  }
};
