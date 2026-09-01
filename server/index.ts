import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { getTableColumns, hasDbConfig, query } from './db.js';
import { ApiError, asErrorMessage } from './errors.js';
import authRoutes from './routes/auth.js';
import studentsRoutes from './routes/students.js';
import connectionsRoutes from './routes/connections.js';
import eventsRoutes from './routes/events.js';
import seniorPovRoutes from './routes/seniorPov.js';
import genieRoutes from './routes/genie.js';

const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  const started = Date.now();
  const safeQuery = Object.keys(req.query).join(',');
  console.info(`[${new Date().toISOString()}] ${req.method} ${req.path} query_keys=${safeQuery}`);
  res.on('finish', () => {
    const duration = Date.now() - started;
    console.info(`[${new Date().toISOString()}] ${req.method} ${req.path} status=${res.statusCode} duration=${duration}ms`);
  });

  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health/db', async (_req, res) => {
  if (!hasDbConfig) {
    res.status(503).json({
      status: 'error',
      message: 'Database environment variables are not fully configured on the server.'
    });
    return;
  }

  try {
    const identity = await query<{ current_user: string; session_user: string }>(
      'SELECT current_user, session_user'
    );
    res.json({
      status: 'ok',
      current_user: identity.rows[0]?.current_user,
      session_user: identity.rows[0]?.session_user
    });
  } catch (error) {
    const code = (error as { code?: string } | undefined)?.code;
    res.status(503).json({
      status: 'error',
      message: 'Database connectivity failed.',
      detail: asErrorMessage(error),
      code
    });
  }
});

const requireDbConfig: express.RequestHandler = (_req, res, next) => {
  if (!hasDbConfig) {
    res.status(503).json({
      error: 'Database environment variables are not fully configured on the server.'
    });
    return;
  }

  next();
};

app.get('/api/schema', requireDbConfig, async (_req, res, next) => {
  try {
    const [students, connections] = await Promise.all([
      getTableColumns('students'),
      getTableColumns('connections')
    ]);

    res.json({
      schema: 'public',
      tables: {
        students,
        connections
      }
    });
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/students', requireDbConfig, studentsRoutes);
app.use('/api/connections', requireDbConfig, connectionsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/senior-pov', requireDbConfig, seniorPovRoutes);
app.use('/api/genzen', genieRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distDir));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }

    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.use((req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
});

app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  let status = 500;
  let message = 'Internal server error';

  if (error instanceof ApiError) {
    status = error.status;
    message = error.message;
  }

  if (status >= 500) {
    const code = (error as { code?: string } | undefined)?.code;
    console.error(`[server-error] ${req.method} ${req.path} ${asErrorMessage(error)}${code ? ` (pg_code=${code})` : ''}`);
  }

  res.status(status).json({
    error: message
  });
});

const port = Number.parseInt(process.env.PORT || process.env.DATABRICKS_APP_PORT || '3001', 10);

app.listen(port, '0.0.0.0', () => {
  console.info(`GenZen API listening on 0.0.0.0:${port}`);
});
