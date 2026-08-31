export type SeniorResponse = {
  response_id: string;
  submitted_at: string;
  graduating_year: string;
  branch: string;
  primary_elective: string;
  elective_rating: string;
  elective_recommend: string;
  career_interest: string;
  internship_experience: string;
  internship_company_type: string;
  club_name: string;
  club_engagement: string;
  biggest_challenge: string;
  lesson_learned: string;
  is_synthetic: string;
};

export async function loadSeniorResponses(): Promise<SeniorResponse[]> {
  const response = await fetch('/api/senior-responses');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? 'Unable to load senior responses.');
  }

  const result = await response.json();

  return result.data;
}