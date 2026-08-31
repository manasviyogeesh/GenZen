import { CampusEvent } from '../types';

type EventRow = {
  id: string;
  event_day: number;
  title: string;
  event_time: string;
  category: CampusEvent['category'];
  location?: string;
  description?: string;
  attendees_count?: number;
};

const colors: Record<CampusEvent['category'], { bg: string; dot: string }> = {
  Workshop: { bg: 'bg-[#c2652a]/20 text-[#f0a878] border-[#c2652a]/30', dot: '#f0a878' },
  Networking: { bg: 'bg-pink-500/20 text-pink-300 border-pink-500/30', dot: '#ec4899' },
  'Club Event': { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', dot: '#06b6d4' },
  Hackathon: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: '#f59e0b' },
  Career: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: '#8b5cf6' },
};

export const fromEventRow = (row: EventRow): CampusEvent => ({
  id: row.id, day: row.event_day, title: row.title, time: row.event_time,
  category: row.category, categoryColor: colors[row.category].bg, dotColor: colors[row.category].dot,
  location: row.location, description: row.description, attendeesCount: row.attendees_count ?? 0,
});

export async function loadEvents(): Promise<CampusEvent[]> {
  const response = await fetch('/api/events');
  if (!response.ok) throw new Error((await response.json()).error ?? 'Unable to load events.');
  return (await response.json() as EventRow[]).map(fromEventRow);
}

export async function createEvent(event: CampusEvent) {
  const response = await fetch('/api/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...event, event_day: event.day, event_time: event.time }),
  });
  if (!response.ok) throw new Error((await response.json()).error ?? 'Unable to create event.');
}

export async function toggleEventRsvp(eventId: string, registered: boolean) {
  const response = await fetch(`/api/events/${encodeURIComponent(eventId)}/rsvp`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'demo-user' }),
  });
  if (!response.ok) throw new Error((await response.json()).error ?? 'Unable to update RSVP.');
  return (await response.json() as { registered: boolean }).registered;
}
