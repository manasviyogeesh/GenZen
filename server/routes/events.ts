import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, hasDatabricksConfig } from '../databricks.js';
import { ApiError } from '../errors.js';
import type { EventRecord, CreateEventRequest, EventResponse } from '../types/events.js';

const router = express.Router();

// Category color mapping
const getCategoryColors = (category: string): { dotColor: string; categoryColor: string } => {
  const colorMap: Record<string, { dotColor: string; categoryColor: string }> = {
    Workshop: {
      dotColor: '#f0a878',
      categoryColor: 'bg-[#c2652a]/20 text-[#f0a878] border-[#c2652a]/30'
    },
    Networking: {
      dotColor: '#ec4899',
      categoryColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
    },
    'Club Event': {
      dotColor: '#06b6d4',
      categoryColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    Hackathon: {
      dotColor: '#f59e0b',
      categoryColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    Career: {
      dotColor: '#8b5cf6',
      categoryColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
  };

  return colorMap[category] || colorMap.Workshop;
};

// Transform database record to frontend response format
const transformEventRecord = (record: EventRecord): EventResponse => {
  const eventDate = new Date(record.event_date);
  const day = eventDate.getDate();

  const time = record.start_time && record.end_time
    ? `${record.start_time} - ${record.end_time}`
    : record.start_time || 'TBD';

  return {
    id: record.event_id,
    day,
    title: record.title,
    time,
    category: record.category,
    categoryColor: record.category_color || getCategoryColors(record.category).categoryColor,
    dotColor: record.dot_color || getCategoryColors(record.category).dotColor,
    attendeesCount: record.attendees_count || 0,
    description: record.description || undefined,
    location: record.location || undefined,
  };
};

// Middleware to check Databricks config
const requireDatabricksConfig: express.RequestHandler = (_req, res, next) => {
  if (!hasDatabricksConfig) {
    res.status(503).json({
      error: 'Databricks environment variables are not fully configured on the server.'
    });
    return;
  }
  next();
};

// GET /api/events - Get events by month or all events
router.get('/', requireDatabricksConfig, async (req, res, next) => {
  try {
    const { year, month } = req.query;

    let sql = 'SELECT * FROM events';
    const params: unknown[] = [];

    if (year && month) {
      // Filter by year and month
      const yearNum = parseInt(year as string, 10);
      const monthNum = parseInt(month as string, 10);

      sql += ' WHERE YEAR(event_date) = $1 AND MONTH(event_date) = $2';
      params.push(yearNum, monthNum);
    }

    sql += ' ORDER BY event_date ASC, start_time ASC';

    const result = await query<EventRecord>(sql, params);
    const events = result.rows.map(transformEventRecord);

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/date/:date - Get events by specific date
router.get('/date/:date', requireDatabricksConfig, async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError(400, 'Invalid date format. Use YYYY-MM-DD');
    }

    const sql = 'SELECT * FROM events WHERE event_date = $1 ORDER BY start_time ASC';
    const result = await query<EventRecord>(sql, [date]);
    const events = result.rows.map(transformEventRecord);

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/category/:category - Filter events by category
router.get('/category/:category', requireDatabricksConfig, async (req, res, next) => {
  try {
    const { category } = req.params;

    const sql = 'SELECT * FROM events WHERE category = $1 ORDER BY event_date ASC, start_time ASC';
    const result = await query<EventRecord>(sql, [category]);
    const events = result.rows.map(transformEventRecord);

    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:event_id - Get single event by ID
router.get('/:event_id', requireDatabricksConfig, async (req, res, next) => {
  try {
    const { event_id } = req.params;

    const sql = 'SELECT * FROM events WHERE event_id = $1';
    const result = await query<EventRecord>(sql, [event_id]);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Event not found');
    }

    const event = transformEventRecord(result.rows[0]);
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// POST /api/events - Create new event
router.post('/', requireDatabricksConfig, async (req, res, next) => {
  try {
    const eventData: CreateEventRequest = req.body;

    // Validate required fields
    if (!eventData.title || !eventData.event_date || !eventData.category) {
      throw new ApiError(400, 'Missing required fields: title, event_date, category');
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventData.event_date)) {
      throw new ApiError(400, 'Invalid date format. Use YYYY-MM-DD');
    }

    // Generate event ID
    const eventId = uuidv4();

    // Get category colors
    const colors = getCategoryColors(eventData.category);

    // Insert into database
    const sql = `
      INSERT INTO events (
        event_id, title, description, event_date, start_time, end_time,
        category, location, created_by, created_at, updated_at,
        dot_color, category_color, attendees_count
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), $10, $11, 0
      )
    `;

    await query(sql, [
      eventId,
      eventData.title,
      eventData.description || null,
      eventData.event_date,
      eventData.start_time || null,
      eventData.end_time || null,
      eventData.category,
      eventData.location || null,
      eventData.created_by || null,
      colors.dotColor,
      colors.categoryColor,
    ]);

    // Fetch the created event
    const result = await query<EventRecord>('SELECT * FROM events WHERE event_id = $1', [eventId]);
    const event = transformEventRecord(result.rows[0]);

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

export default router;
