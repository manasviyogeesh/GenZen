import { createHash } from 'node:crypto';
import { Router } from 'express';
import { query } from '../db.js';
import { ApiError } from '../errors.js';

interface PrototypeAuthBody {
  email?: string;
  auth_user_id?: string;
}

const router = Router();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const deriveStableAuthUserId = (email: string): string => {
  const digest = createHash('sha256').update(normalizeEmail(email)).digest('hex');
  return `auth_${digest.slice(0, 24)}`;
};

router.post('/prototype-session', async (req, res, next) => {
  try {
    const body = req.body as PrototypeAuthBody;
    const email = body?.email ? normalizeEmail(body.email) : '';

    if (!email) {
      throw new ApiError(400, 'email is required');
    }

    const result = await query<Record<string, unknown>>(
      `SELECT student_id, auth_user_id, email FROM public.students WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    const existing = result.rows[0] || {};
    const authUserId = typeof existing.auth_user_id === 'string' && existing.auth_user_id
      ? existing.auth_user_id
      : (body.auth_user_id || deriveStableAuthUserId(email));

    res.json({
      auth_user_id: authUserId,
      email,
      student_id: typeof existing.student_id === 'string' ? existing.student_id : null,
      signed_in_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
