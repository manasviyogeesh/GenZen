// Event types for backend API

export interface EventRecord {
  event_id: string;
  title: string;
  description: string | null;
  event_date: string; // DATE in Databricks, comes as string YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  category: 'Workshop' | 'Networking' | 'Club Event' | 'Hackathon' | 'Career';
  location: string | null;
  created_by: string | null;
  created_at: string; // TIMESTAMP in Databricks, comes as ISO string
  updated_at: string; // TIMESTAMP in Databricks, comes as ISO string
  dot_color: string | null;
  category_color: string | null;
  attendees_count: number | null;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  category: 'Workshop' | 'Networking' | 'Club Event' | 'Hackathon' | 'Career';
  location?: string;
  created_by?: string;
}

export interface EventResponse {
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
