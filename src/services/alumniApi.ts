import { AlumniProfile } from '../types';

export async function loadAlumniProfiles(): Promise<AlumniProfile[]> {
  const response = await fetch('/api/alumni');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error ?? 'Unable to load alumni profiles.',
    );
  }

  const result = await response.json();
  const data = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];

  return data as AlumniProfile[];
}

export async function updateAlumniLinkedInProfile(
  alumniId: string,
  linkedinUrl: string,
): Promise<AlumniProfile> {
  const response = await fetch(`/api/alumni/${encodeURIComponent(alumniId)}/linkedin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ linkedin_url: linkedinUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error ?? 'Unable to update LinkedIn profile.',
    );
  }

  const result = await response.json();
  const data = result?.data ?? result;

  return data as AlumniProfile;
}
