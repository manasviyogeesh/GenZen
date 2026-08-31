import { CampusEvent } from '../types';

const API_BASE = '/api/events';

export interface CreateEventPayload {
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  category: 'Workshop' | 'Networking' | 'Club Event' | 'Hackathon' | 'Career';
  location?: string;
  created_by?: string;
}

const monthCache = new Map<string, { events: CampusEvent[]; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export const eventsService = {
  /**
   * Clear cache
   */
  clearCache(): void {
    monthCache.clear();
  },

  /**
   * Get events by month and year
   */
  async getEventsByMonth(year: number, month: number, forceFresh = false): Promise<CampusEvent[]> {
    const cacheKey = `${year}-${month}`;
    const cached = monthCache.get(cacheKey);

    if (!forceFresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.events;
    }

    try {
      const response = await fetch(`${API_BASE}?year=${year}&month=${month}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }
      const data = await response.json();
      const events: CampusEvent[] = data.events || [];
      monthCache.set(cacheKey, { events, timestamp: Date.now() });
      return events;
    } catch (error) {
      console.error('Error fetching events by month:', error);
      // Return cached data if available on failure
      if (cached) return cached.events;
      throw error;
    }
  },

  /**
   * Get events for a specific date
   */
  async getEventsByDate(date: string): Promise<CampusEvent[]> {
    try {
      const response = await fetch(`${API_BASE}/date/${date}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch events for date: ${response.statusText}`);
      }
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching events by date:', error);
      throw error;
    }
  },

  /**
   * Get a single event by ID
   */
  async getEventById(eventId: string): Promise<CampusEvent> {
    try {
      const response = await fetch(`${API_BASE}/${eventId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch event: ${response.statusText}`);
      }
      const data = await response.json();
      return data.event;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      throw error;
    }
  },

  /**
   * Filter events by category
   */
  async getEventsByCategory(category: string): Promise<CampusEvent[]> {
    try {
      const response = await fetch(`${API_BASE}/category/${category}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch events by category: ${response.statusText}`);
      }
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching events by category:', error);
      throw error;
    }
  },

  /**
   * Create a new event
   */
  async createEvent(payload: CreateEventPayload): Promise<CampusEvent> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create event: ${response.statusText}`);
      }

      const data = await response.json();
      monthCache.clear(); // Invalidate cache on new event
      return data.event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
};
