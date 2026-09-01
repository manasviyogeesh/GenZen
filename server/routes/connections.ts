import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { getTableColumns, query } from '../db.js';
import { ApiError } from '../errors.js';

const router = Router();

const REQUIRED_COLUMNS = [
  'connection_id',
  'student_id',
  'connected_student_id',
  'status',
  'requested_by',
  'created_at',
  'updated_at'
];

let validated = false;

const ensureSchema = async (): Promise<void> => {
  if (validated) {
    return;
  }

  const columns = await getTableColumns('connections');
  const names = new Set(columns.map((column) => column.column_name));
  const missing = REQUIRED_COLUMNS.filter((column) => !names.has(column));

  if (missing.length > 0) {
    throw new ApiError(500, `connections table is missing expected columns: ${missing.join(', ')}`);
  }

  validated = true;
};

const normalizeConnection = (row: Record<string, unknown>) => ({
  connection_id: String(row.connection_id || ''),
  student_id: String(row.student_id || ''),
  connected_student_id: String(row.connected_student_id || ''),
  status: String(row.status || 'pending'),
  requested_by: String(row.requested_by || ''),
  created_at: String(row.created_at || new Date().toISOString()),
  updated_at: String(row.updated_at || new Date().toISOString())
});

const findPair = async (studentId: string, otherStudentId: string): Promise<Record<string, unknown> | null> => {
  const result = await query<Record<string, unknown>>(
    `
      SELECT *
      FROM public.connections
      WHERE (student_id = $1 AND connected_student_id = $2)
         OR (student_id = $2 AND connected_student_id = $1)
      ORDER BY created_at DESC NULLS LAST
      LIMIT 1
    `,
    [studentId, otherStudentId]
  );

  return result.rows[0] || null;
};

router.get('/', async (req, res, next) => {
  try {
    await ensureSchema();

    const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : '';
    if (studentId) {
      const result = await query<Record<string, unknown>>(
        `
          SELECT * FROM public.connections
          WHERE student_id = $1 OR connected_student_id = $1
          ORDER BY updated_at DESC NULLS LAST
        `,
        [studentId]
      );

      res.json(result.rows.map(normalizeConnection));
      return;
    }

    const result = await query<Record<string, unknown>>(
      `SELECT * FROM public.connections ORDER BY updated_at DESC NULLS LAST`
    );
    res.json(result.rows.map(normalizeConnection));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await ensureSchema();

    const body = req.body as Record<string, unknown>;
    const studentId = String(body.student_id || '').trim();
    const otherStudentId = String(body.connected_student_id || '').trim();
    const action = String(body.action || 'send');

    if (!studentId || !otherStudentId) {
      throw new ApiError(400, 'student_id and connected_student_id are required');
    }

    const existing = await findPair(studentId, otherStudentId);
    const timestamp = new Date().toISOString();

    if (action === 'accept') {
      if (!existing) {
        throw new ApiError(404, 'No pending request found to accept');
      }

      if (existing.status !== 'pending' || existing.requested_by !== otherStudentId) {
        throw new ApiError(400, 'No incoming pending request to accept');
      }

      await query(
        `UPDATE public.connections SET status = 'connected', updated_at = $1 WHERE connection_id = $2`,
        [timestamp, existing.connection_id]
      );
    } else if (action === 'pass') {
      if (existing) {
        await query(
          `
            UPDATE public.connections
            SET student_id = $1, connected_student_id = $2, status = 'passed', requested_by = $1, updated_at = $3
            WHERE connection_id = $4
          `,
          [studentId, otherStudentId, timestamp, existing.connection_id]
        );
      } else {
        const connectionId = randomUUID();
        await query(
          `
            INSERT INTO public.connections (
              connection_id, student_id, connected_student_id, status, requested_by, created_at, updated_at
            ) VALUES ($1, $2, $3, 'passed', $2, $4, $4)
          `,
          [connectionId, studentId, otherStudentId, timestamp]
        );
      }
    } else {
      if (existing?.status === 'connected') {
        res.json(normalizeConnection(existing));
        return;
      }

      if (existing?.status === 'pending' && existing.requested_by === otherStudentId) {
        await query(
          `UPDATE public.connections SET status = 'connected', updated_at = $1 WHERE connection_id = $2`,
          [timestamp, existing.connection_id]
        );
      } else if (existing) {
        await query(
          `
            UPDATE public.connections
            SET student_id = $1, connected_student_id = $2, status = 'pending', requested_by = $1, updated_at = $3
            WHERE connection_id = $4
          `,
          [studentId, otherStudentId, timestamp, existing.connection_id]
        );
      } else {
        const connectionId = randomUUID();
        await query(
          `
            INSERT INTO public.connections (
              connection_id, student_id, connected_student_id, status, requested_by, created_at, updated_at
            ) VALUES ($1, $2, $3, 'pending', $2, $4, $4)
          `,
          [connectionId, studentId, otherStudentId, timestamp]
        );
      }
    }

    const finalRecord = await findPair(studentId, otherStudentId);
    if (!finalRecord) {
      throw new ApiError(500, 'Unable to persist connection');
    }

    res.status(existing ? 200 : 201).json(normalizeConnection(finalRecord));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    await ensureSchema();

    const body = req.body as Record<string, unknown>;
    const status = String(body.status || '').trim();

    if (!status) {
      throw new ApiError(400, 'status is required');
    }

    if (!['pending', 'connected', 'passed'].includes(status)) {
      throw new ApiError(400, 'status must be one of: pending, connected, passed');
    }

    const result = await query<Record<string, unknown>>(
      `
        UPDATE public.connections
        SET status = $1, updated_at = $2
        WHERE connection_id = $3
        RETURNING *
      `,
      [status, new Date().toISOString(), req.params.id]
    );

    const updated = result.rows[0];
    if (!updated) {
      throw new ApiError(404, 'Connection not found');
    }

    res.json(normalizeConnection(updated));
  } catch (error) {
    next(error);
  }
});

export default router;
