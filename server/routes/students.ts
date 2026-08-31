import { Router } from 'express';
import { getTableColumns, query } from '../db.js';
import { ApiError } from '../errors.js';

const router = Router();

const REQUIRED_COLUMNS = [
  'student_id',
  'auth_user_id',
  'email',
  'name',
  'role',
  'year',
  'branch',
  'department',
  'connections_count',
  'avatar',
  'avatar_url',
  'skills',
  'interests',
  'looking_for',
  'availability',
  'bio',
  'clubs',
  'events',
  'connections',
  'created_at',
  'last_active'
];

let validated = false;

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

const normalizeStudent = (row: Record<string, unknown>) => {
  const avatar = typeof row.avatar === 'string' && row.avatar ? row.avatar : '';
  const avatarUrl = typeof row.avatar_url === 'string' && row.avatar_url ? row.avatar_url : avatar;

  return {
    student_id: String(row.student_id || ''),
    auth_user_id: String(row.auth_user_id || ''),
    email: String(row.email || ''),
    name: String(row.name || ''),
    role: String(row.role || 'Student'),
    year: String(row.year || ''),
    branch: String(row.branch || row.department || ''),
    department: String(row.department || row.branch || ''),
    connectionsCount: Number(row.connections_count || 0),
    avatar: avatar || avatarUrl,
    avatarUrl: avatarUrl || avatar,
    skills: asStringArray(row.skills),
    interests: asStringArray(row.interests),
    lookingFor: asStringArray(row.looking_for),
    availability: asStringArray(row.availability),
    bio: String(row.bio || ''),
    clubs: asStringArray(row.clubs),
    events: asStringArray(row.events),
    connections: asStringArray(row.connections),
    created_at: String(row.created_at || new Date().toISOString()),
    last_active: String(row.last_active || new Date().toISOString())
  };
};

const ensureSchema = async (): Promise<void> => {
  if (validated) {
    return;
  }

  const columns = await getTableColumns('students');
  const columnNames = new Set(columns.map((column) => column.column_name));
  const missing = REQUIRED_COLUMNS.filter((column) => !columnNames.has(column));

  if (missing.length > 0) {
    throw new ApiError(
      500,
      `students table is missing expected columns: ${missing.join(', ')}`
    );
  }

  validated = true;
};

router.get('/', async (req, res, next) => {
  try {
    await ensureSchema();

    const excludeId = typeof req.query.excludeId === 'string' ? req.query.excludeId : '';
    const authUserId = typeof req.query.authUserId === 'string' ? req.query.authUserId : '';

    if (authUserId) {
      const byAuth = await query<Record<string, unknown>>(
        `SELECT * FROM public.students WHERE auth_user_id = $1 ORDER BY created_at DESC NULLS LAST`,
        [authUserId]
      );
      res.json(byAuth.rows.map(normalizeStudent));
      return;
    }

    if (excludeId) {
      const result = await query<Record<string, unknown>>(
        `SELECT * FROM public.students WHERE student_id <> $1 ORDER BY created_at DESC NULLS LAST`,
        [excludeId]
      );
      res.json(result.rows.map(normalizeStudent));
      return;
    }

    const result = await query<Record<string, unknown>>(
      `SELECT * FROM public.students ORDER BY created_at DESC NULLS LAST`
    );

    res.json(result.rows.map(normalizeStudent));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    await ensureSchema();

    const result = await query<Record<string, unknown>>(
      `SELECT * FROM public.students WHERE student_id = $1 LIMIT 1`,
      [req.params.id]
    );

    const profile = result.rows[0];
    if (!profile) {
      throw new ApiError(404, 'Student not found');
    }

    res.json(normalizeStudent(profile));
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await ensureSchema();

    const body = req.body as Record<string, unknown>;
    const studentId = String(body.student_id || '').trim();
    const authUserId = String(body.auth_user_id || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();

    if (!studentId || !authUserId || !email || !name) {
      throw new ApiError(400, 'student_id, auth_user_id, email, and name are required');
    }

    const timestamp = new Date().toISOString();
    const profile = {
      student_id: studentId,
      auth_user_id: authUserId,
      email,
      name,
      role: String(body.role || 'Student').trim() || 'Student',
      year: String(body.year || '').trim(),
      branch: String(body.branch || '').trim(),
      department: String(body.department || body.branch || '').trim(),
      connections_count: Number(body.connectionsCount || 0),
      avatar: String(body.avatar || body.avatarUrl || '').trim(),
      avatar_url: String(body.avatarUrl || body.avatar || '').trim(),
      skills: JSON.stringify(Array.isArray(body.skills) ? body.skills : []),
      interests: JSON.stringify(Array.isArray(body.interests) ? body.interests : []),
      looking_for: JSON.stringify(Array.isArray(body.lookingFor) ? body.lookingFor : []),
      availability: JSON.stringify(Array.isArray(body.availability) ? body.availability : []),
      bio: String(body.bio || '').trim(),
      clubs: JSON.stringify(Array.isArray(body.clubs) ? body.clubs : []),
      events: JSON.stringify(Array.isArray(body.events) ? body.events : []),
      connections: JSON.stringify(Array.isArray(body.connections) ? body.connections : []),
      created_at: String(body.created_at || timestamp),
      last_active: String(body.last_active || timestamp)
    };

    await query(
      `
        INSERT INTO public.students (
          student_id, auth_user_id, email, name, role, year, branch, department,
          connections_count, avatar, avatar_url, skills, interests, looking_for,
          availability, bio, clubs, events, connections, created_at, last_active
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb,
          $15::jsonb, $16, $17::jsonb, $18::jsonb, $19::jsonb, $20, $21
        )
        ON CONFLICT (student_id)
        DO UPDATE SET
          auth_user_id = EXCLUDED.auth_user_id,
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          year = EXCLUDED.year,
          branch = EXCLUDED.branch,
          department = EXCLUDED.department,
          connections_count = EXCLUDED.connections_count,
          avatar = EXCLUDED.avatar,
          avatar_url = EXCLUDED.avatar_url,
          skills = EXCLUDED.skills,
          interests = EXCLUDED.interests,
          looking_for = EXCLUDED.looking_for,
          availability = EXCLUDED.availability,
          bio = EXCLUDED.bio,
          clubs = EXCLUDED.clubs,
          events = EXCLUDED.events,
          connections = EXCLUDED.connections,
          last_active = EXCLUDED.last_active
      `,
      [
        profile.student_id,
        profile.auth_user_id,
        profile.email,
        profile.name,
        profile.role,
        profile.year,
        profile.branch,
        profile.department,
        profile.connections_count,
        profile.avatar,
        profile.avatar_url,
        profile.skills,
        profile.interests,
        profile.looking_for,
        profile.availability,
        profile.bio,
        profile.clubs,
        profile.events,
        profile.connections,
        profile.created_at,
        profile.last_active
      ]
    );

    const created = await query<Record<string, unknown>>(
      `SELECT * FROM public.students WHERE student_id = $1 LIMIT 1`,
      [profile.student_id]
    );

    res.status(201).json(normalizeStudent(created.rows[0]));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    await ensureSchema();

    const existing = await query<Record<string, unknown>>(
      `SELECT * FROM public.students WHERE student_id = $1 LIMIT 1`,
      [req.params.id]
    );

    const current = existing.rows[0];
    if (!current) {
      throw new ApiError(404, 'Student not found');
    }

    const body = req.body as Record<string, unknown>;
    const merged = {
      ...normalizeStudent(current),
      ...body,
      student_id: String(current.student_id),
      auth_user_id: String(current.auth_user_id),
      email: String(current.email),
      last_active: new Date().toISOString()
    };

    await query(
      `
        UPDATE public.students
        SET
          name = $1,
          role = $2,
          year = $3,
          branch = $4,
          department = $5,
          connections_count = $6,
          avatar = $7,
          avatar_url = $8,
          skills = $9::jsonb,
          interests = $10::jsonb,
          looking_for = $11::jsonb,
          availability = $12::jsonb,
          bio = $13,
          clubs = $14::jsonb,
          events = $15::jsonb,
          connections = $16::jsonb,
          last_active = $17
        WHERE student_id = $18
      `,
      [
        String(merged.name || ''),
        String(merged.role || 'Student'),
        String(merged.year || ''),
        String(merged.branch || merged.department || ''),
        String(merged.department || merged.branch || ''),
        Number(merged.connectionsCount || 0),
        String(merged.avatar || merged.avatarUrl || ''),
        String(merged.avatarUrl || merged.avatar || ''),
        JSON.stringify(Array.isArray(merged.skills) ? merged.skills : []),
        JSON.stringify(Array.isArray(merged.interests) ? merged.interests : []),
        JSON.stringify(Array.isArray(merged.lookingFor) ? merged.lookingFor : []),
        JSON.stringify(Array.isArray(merged.availability) ? merged.availability : []),
        String(merged.bio || ''),
        JSON.stringify(Array.isArray(merged.clubs) ? merged.clubs : []),
        JSON.stringify(Array.isArray(merged.events) ? merged.events : []),
        JSON.stringify(Array.isArray(merged.connections) ? merged.connections : []),
        String(merged.last_active),
        req.params.id
      ]
    );

    const updated = await query<Record<string, unknown>>(
      `SELECT * FROM public.students WHERE student_id = $1 LIMIT 1`,
      [req.params.id]
    );

    res.json(normalizeStudent(updated.rows[0]));
  } catch (error) {
    next(error);
  }
});

export default router;
