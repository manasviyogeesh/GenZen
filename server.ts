import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json());

const host = (process.env.DATABRICKS_HOST ?? '').replace(/\/$/, '');
const token = process.env.DATABRICKS_TOKEN;
const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;
const catalog = process.env.DATABRICKS_CATALOG ?? 'main';
const schema = process.env.DATABRICKS_SCHEMA ?? 'default';
const configured = Boolean(host && token && warehouseId);

type DatabricksResponse = {
  statement_id?: string;
  status?: { state?: string; error?: { message?: string } };
  manifest?: { schema?: { columns?: { name: string }[] } };
  result?: { data_array?: unknown[][] };
};

const sqlLiteral = (value: string | number | null) => {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
};

async function execute(statement: string): Promise<DatabricksResponse> {
  if (!configured) {
    throw new Error('Databricks is not configured. Set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_WAREHOUSE_ID.');
  }
  const response = await fetch(`${host}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ statement, warehouse_id: warehouseId, catalog, schema, wait_timeout: '10s' }),
  });
  if (!response.ok) throw new Error(`Databricks returned HTTP ${response.status}: ${await response.text()}`);
  let result = await response.json() as DatabricksResponse;
  while (result.statement_id && ['PENDING', 'RUNNING'].includes(result.status?.state ?? '')) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const poll = await fetch(`${host}/api/2.0/sql/statements/${result.statement_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!poll.ok) throw new Error(`Databricks polling returned HTTP ${poll.status}`);
    result = await poll.json() as DatabricksResponse;
  }
  if (result.status?.state === 'FAILED' || result.status?.state === 'CANCELED') {
    throw new Error(result.status.error?.message ?? 'Databricks statement failed.');
  }
  return result;
}

async function ensureTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS campus_events (
      id STRING, event_day INT, title STRING, event_time STRING, category STRING,
      location STRING, description STRING, attendees_count INT, created_at TIMESTAMP
    ) USING DELTA
  `);
  await execute(`
    CREATE TABLE IF NOT EXISTS campus_event_rsvps (
      event_id STRING, user_id STRING, created_at TIMESTAMP
    ) USING DELTA
  `);
}

function rows(result: DatabricksResponse) {
  const columns = result.manifest?.schema?.columns?.map((column) => column.name) ?? [];
  return (result.result?.data_array ?? []).map((row) =>
    Object.fromEntries(columns.map((column, index) => [column, row[index]])),
  );
}

app.get('/api/health', (_req, response) => response.json({ configured }));

app.get('/api/events', async (_req, response) => {
  try {
    await ensureTables();
    const result = await execute('SELECT id, event_day, title, event_time, category, location, description, attendees_count FROM campus_events ORDER BY event_day, created_at DESC');
    response.json(rows(result));
  } catch (error) {
    response.status(503).json({ error: error instanceof Error ? error.message : 'Unable to load events.' });
  }
});

app.post('/api/events', async (request, response) => {
  const event = request.body as Record<string, unknown>;
  if (!event.id || !event.title || !event.event_day || !event.event_time || !event.category) {
    response.status(400).json({ error: 'id, title, event_day, event_time, and category are required.' });
    return;
  }
  try {
    await ensureTables();
    await execute(`INSERT INTO campus_events VALUES (
      ${sqlLiteral(String(event.id))}, ${sqlLiteral(Number(event.event_day))},
      ${sqlLiteral(String(event.title))}, ${sqlLiteral(String(event.event_time))},
      ${sqlLiteral(String(event.category))}, ${sqlLiteral(event.location ? String(event.location) : null)},
      ${sqlLiteral(event.description ? String(event.description) : null)}, 0, current_timestamp()
    )`);
    response.status(201).json(event);
  } catch (error) {
    response.status(503).json({ error: error instanceof Error ? error.message : 'Unable to create event.' });
  }
});

app.post('/api/events/:id/rsvp', async (request, response) => {
  const eventId = request.params.id;
  const userId = String(request.body?.userId ?? 'demo-user');
  try {
    await ensureTables();
    const existing = rows(await execute(`SELECT event_id FROM campus_event_rsvps WHERE event_id = ${sqlLiteral(eventId)} AND user_id = ${sqlLiteral(userId)} LIMIT 1`));
    if (existing.length) {
      await execute(`DELETE FROM campus_event_rsvps WHERE event_id = ${sqlLiteral(eventId)} AND user_id = ${sqlLiteral(userId)}`);
      await execute(`UPDATE campus_events SET attendees_count = greatest(coalesce(attendees_count, 0) - 1, 0) WHERE id = ${sqlLiteral(eventId)}`);
      response.json({ registered: false });
    } else {
      await execute(`INSERT INTO campus_event_rsvps VALUES (${sqlLiteral(eventId)}, ${sqlLiteral(userId)}, current_timestamp())`);
      await execute(`UPDATE campus_events SET attendees_count = coalesce(attendees_count, 0) + 1 WHERE id = ${sqlLiteral(eventId)}`);
      response.json({ registered: true });
    }
  } catch (error) {
    response.status(503).json({ error: error instanceof Error ? error.message : 'Unable to update RSVP.' });
  }
});

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
app.use(express.static(dist));
app.get('*', (_request, response) => response.sendFile(path.join(dist, 'index.html')));

app.listen(Number(process.env.PORT ?? 8787), () => {
  console.log(`GenZen server listening on port ${process.env.PORT ?? 8787}${configured ? ' (Databricks enabled)' : ' (Databricks not configured)'}`);
});
