import { Router } from 'express';
import { getTableColumns, query } from '../db.js';
import { ApiError } from '../errors.js';

const router = Router();

// ---------------------------------------------------------
// This matches the ACTUAL Lakebase students table
// ---------------------------------------------------------

const REQUIRED_COLUMNS = [
  'student_id',
  'auth_user_id',
  'name',
  'email',
  'branch',
  'year',
  'bio',
  'avatar',
  'interests',
  'skills',
  'looking_for',
  'availability',
  'created_at',
  'last_active'
];

let validated = false;

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

const asStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string'
    );
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === 'string'
        );
      }
    } catch {
      return value
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map((item) => item.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }

  return [];
};

// ---------------------------------------------------------
// Normalize DB row -> frontend student object
// ---------------------------------------------------------

const normalizeStudent = (
  row: Record<string, unknown>
) => {
  return {
    student_id: String(row.student_id || ''),
    auth_user_id: String(row.auth_user_id || ''),
    email: String(row.email || ''),
    name: String(row.name || ''),

    // These are not database columns.
    // They are frontend defaults.
    role: 'Student',

    year: String(row.year || ''),

    branch: String(row.branch || ''),
    department: String(row.branch || ''),

    connectionsCount: 0,

    avatar: String(row.avatar || ''),
    avatarUrl: String(row.avatar || ''),

    skills: asStringArray(row.skills),
    interests: asStringArray(row.interests),
    lookingFor: asStringArray(row.looking_for),
    availability: asStringArray(row.availability),

    bio: String(row.bio || ''),

    // These aren't stored in the current schema.
    clubs: [],
    events: [],
    connections: [],

    created_at: String(
      row.created_at ||
      new Date().toISOString()
    ),

    last_active: String(
      row.last_active ||
      new Date().toISOString()
    )
  };
};

// ---------------------------------------------------------
// Validate students table
// ---------------------------------------------------------

const ensureSchema = async (): Promise<void> => {
  if (validated) {
    return;
  }

  const columns = await getTableColumns('students');

  const columnNames = new Set(
    columns.map((column) => column.column_name)
  );

  const missing = REQUIRED_COLUMNS.filter(
    (column) => !columnNames.has(column)
  );

  if (missing.length > 0) {
    throw new ApiError(
      500,
      `students table is missing expected columns: ${missing.join(', ')}`
    );
  }

  validated = true;
};

// ---------------------------------------------------------
// GET all students / current student
// ---------------------------------------------------------

router.get('/', async (req, res, next) => {
  try {
    await ensureSchema();

    const excludeId =
      typeof req.query.excludeId === 'string'
        ? req.query.excludeId
        : '';

    const authUserId =
      typeof req.query.authUserId === 'string'
        ? req.query.authUserId
        : '';

    // Get student by authenticated user
    if (authUserId) {
      const result = await query<Record<string, unknown>>(
        `
          SELECT *
          FROM public.students
          WHERE auth_user_id = $1
          ORDER BY created_at DESC NULLS LAST
        `,
        [authUserId]
      );

      res.json(
        result.rows.map(normalizeStudent)
      );

      return;
    }

    // Get all except current student
    if (excludeId) {
      const result = await query<Record<string, unknown>>(
        `
          SELECT *
          FROM public.students
          WHERE student_id <> $1
          ORDER BY created_at DESC NULLS LAST
        `,
        [excludeId]
      );

      res.json(
        result.rows.map(normalizeStudent)
      );

      return;
    }

    // Get all students
    const result = await query<Record<string, unknown>>(
      `
        SELECT *
        FROM public.students
        ORDER BY created_at DESC NULLS LAST
      `
    );

    res.json(
      result.rows.map(normalizeStudent)
    );
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------
// GET student by ID
// ---------------------------------------------------------

router.get('/:id', async (req, res, next) => {
  try {
    await ensureSchema();

    const result = await query<Record<string, unknown>>(
      `
        SELECT *
        FROM public.students
        WHERE student_id = $1
        LIMIT 1
      `,
      [req.params.id]
    );

    const profile = result.rows[0];

    if (!profile) {
      throw new ApiError(
        404,
        'Student not found'
      );
    }

    res.json(
      normalizeStudent(profile)
    );
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------
// CREATE / UPSERT student
// ---------------------------------------------------------

router.post('/', async (req, res, next) => {
  try {
    await ensureSchema();

    const body =
      req.body as Record<string, unknown>;

    const studentId =
      String(body.student_id || '').trim();

    const authUserId =
      String(body.auth_user_id || '').trim();

    const email =
      String(body.email || '')
        .trim()
        .toLowerCase();

    const name =
      String(body.name || '').trim();

    if (
      !studentId ||
      !authUserId ||
      !email ||
      !name
    ) {
      throw new ApiError(
        400,
        'student_id, auth_user_id, email, and name are required'
      );
    }

    const timestamp =
      new Date().toISOString();

    const branch =
      String(body.branch || '').trim();

    const year =
      String(body.year || '').trim();

    const bio =
      String(body.bio || '').trim();

    const avatar =
      String(
        body.avatar ||
        body.avatarUrl ||
        ''
      ).trim();

    const skills =
      Array.isArray(body.skills)
        ? body.skills.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : [];

    const interests =
      Array.isArray(body.interests)
        ? body.interests.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : [];

    const lookingFor =
      Array.isArray(body.lookingFor)
        ? body.lookingFor.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : [];

    const availability =
      Array.isArray(body.availability)
        ? body.availability.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : [];

    const createdAt =
      String(
        body.created_at ||
        timestamp
      );

    const lastActive =
      String(
        body.last_active ||
        timestamp
      );

    await query(
      `
        INSERT INTO public.students (
          student_id,
          auth_user_id,
          name,
          email,
          branch,
          year,
          bio,
          avatar,
          interests,
          skills,
          looking_for,
          availability,
          created_at,
          last_active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14
        )
        ON CONFLICT (student_id)
        DO UPDATE SET
          auth_user_id = EXCLUDED.auth_user_id,
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          branch = EXCLUDED.branch,
          year = EXCLUDED.year,
          bio = EXCLUDED.bio,
          avatar = EXCLUDED.avatar,
          interests = EXCLUDED.interests,
          skills = EXCLUDED.skills,
          looking_for = EXCLUDED.looking_for,
          availability = EXCLUDED.availability,
          last_active = EXCLUDED.last_active
      `,
      [
        studentId,
        authUserId,
        name,
        email,
        branch,
        year,
        bio,
        avatar,
        interests,
        skills,
        lookingFor,
        availability,
        createdAt,
        lastActive
      ]
    );

    const created =
      await query<Record<string, unknown>>(
        `
          SELECT *
          FROM public.students
          WHERE student_id = $1
          LIMIT 1
        `,
        [studentId]
      );

    if (!created.rows[0]) {
      throw new ApiError(
        500,
        'Student was created but could not be retrieved'
      );
    }

    res
      .status(201)
      .json(
        normalizeStudent(
          created.rows[0]
        )
      );
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------
// UPDATE student
// ---------------------------------------------------------

router.put('/:id', async (req, res, next) => {
  try {
    await ensureSchema();

    const existing =
      await query<Record<string, unknown>>(
        `
          SELECT *
          FROM public.students
          WHERE student_id = $1
          LIMIT 1
        `,
        [req.params.id]
      );

    const current =
      existing.rows[0];

    if (!current) {
      throw new ApiError(
        404,
        'Student not found'
      );
    }

    const body =
      req.body as Record<string, unknown>;

    const currentStudent =
      normalizeStudent(current);

    const name =
      String(
        body.name ??
        currentStudent.name
      ).trim();

    const year =
      String(
        body.year ??
        currentStudent.year
      ).trim();

    const branch =
      String(
        body.branch ??
        currentStudent.branch
      ).trim();

    const bio =
      String(
        body.bio ??
        currentStudent.bio
      ).trim();

    const avatar =
      String(
        body.avatar ??
        body.avatarUrl ??
        currentStudent.avatar ??
        ''
      ).trim();

    const skills =
      Array.isArray(body.skills)
        ? body.skills.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : currentStudent.skills;

    const interests =
      Array.isArray(body.interests)
        ? body.interests.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : currentStudent.interests;

    const lookingFor =
      Array.isArray(body.lookingFor)
        ? body.lookingFor.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : currentStudent.lookingFor;

    const availability =
      Array.isArray(body.availability)
        ? body.availability.filter(
            (item): item is string =>
              typeof item === 'string'
          )
        : currentStudent.availability;

    const lastActive =
      new Date().toISOString();

    await query(
      `
        UPDATE public.students
        SET
          name = $1,
          year = $2,
          branch = $3,
          bio = $4,
          avatar = $5,
          skills = $6,
          interests = $7,
          looking_for = $8,
          availability = $9,
          last_active = $10
        WHERE student_id = $11
      `,
      [
        name,
        year,
        branch,
        bio,
        avatar,
        skills,
        interests,
        lookingFor,
        availability,
        lastActive,
        req.params.id
      ]
    );

    const updated =
      await query<Record<string, unknown>>(
        `
          SELECT *
          FROM public.students
          WHERE student_id = $1
          LIMIT 1
        `,
        [req.params.id]
      );

    if (!updated.rows[0]) {
      throw new ApiError(
        500,
        'Student was updated but could not be retrieved'
      );
    }

    res.json(
      normalizeStudent(
        updated.rows[0]
      )
    );
  } catch (error) {
    next(error);
  }
});

export default router;