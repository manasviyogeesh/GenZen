import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { Router } from 'express';
import { getTableColumns, query } from '../db.js';
import { ApiError } from '../errors.js';

const router = Router();

type SeniorResponseType = 'question' | 'answer';
type SeniorVote = 'up' | 'down' | null;

interface SeniorRow extends Record<string, unknown> {
  response_id: string;
  response_type: SeniorResponseType;
  parent_response_id: string | null;
  student_id: string | null;
  category: string;
  title: string | null;
  body: string;
  author_name: string;
  author_branch: string;
  author_year: string;
  author_avatar: string;
  votes: number;
  answer_count: number;
  saved_by: string[] | string | null;
  upvoted_by: string[] | string | null;
  downvoted_by: string[] | string[] | null;
  is_synthetic: boolean;
  created_at: string;
  updated_at: string;
}

const REQUIRED_COLUMNS = [
  'response_id',
  'response_type',
  'parent_response_id',
  'student_id',
  'category',
  'title',
  'body',
  'author_name',
  'author_branch',
  'author_year',
  'author_avatar',
  'votes',
  'answer_count',
  'saved_by',
  'upvoted_by',
  'downvoted_by',
  'is_synthetic',
  'created_at',
  'updated_at'
];

let validated = false;

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=400&auto=format&fit=crop&q=80';

const normalizeArray = (value: unknown): string[] => {
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
      return value
        .replace(/^\{|\}$/g, '')
        .split(',')
        .map((item) => item.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    }
  }

  return [];
};

const asNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getAuthUserId = (req: Request): string => {
  const headerValue = req.header('x-auth-user-id');
  return headerValue ? headerValue.trim() : '';
};

const resolveCurrentStudent = async (req: Request) => {
  const authUserId = getAuthUserId(req);

  if (!authUserId) {
    throw new ApiError(401, 'x-auth-user-id header is required');
  }

  const result = await query<Record<string, unknown>>(
    `
      SELECT student_id, name, branch, year, avatar
      FROM public.students
      WHERE auth_user_id = $1
      LIMIT 1
    `,
    [authUserId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new ApiError(404, 'Current student profile not found');
  }

  const studentId = String(row.student_id || '').trim();
  if (!studentId) {
    throw new ApiError(404, 'Current student profile not found');
  }

  return {
    authUserId,
    studentId,
    name: String(row.name || ''),
    branch: String(row.branch || ''),
    year: String(row.year || ''),
    avatar: String(row.avatar || DEFAULT_AVATAR)
  };
};

const ensureSchema = async (): Promise<void> => {
  if (validated) {
    return;
  }

  const columns = await getTableColumns('senior_responses');
  const columnNames = new Set(columns.map((column) => column.column_name));
  const missing = REQUIRED_COLUMNS.filter((column) => !columnNames.has(column));

  if (missing.length > 0) {
    throw new ApiError(500, `senior_responses table is missing expected columns: ${missing.join(', ')}`);
  }

  validated = true;
};

const normalizeQuestionRecord = (row: SeniorRow, currentStudentId?: string | null) => {
  const savedBy = normalizeArray(row.saved_by);
  const upvotedBy = normalizeArray(row.upvoted_by);
  const downvotedBy = normalizeArray(row.downvoted_by);

  const userVote: SeniorVote = currentStudentId
    ? upvotedBy.includes(currentStudentId)
      ? 'up'
      : downvotedBy.includes(currentStudentId)
        ? 'down'
        : null
    : null;

  return {
    id: row.response_id,
    question_id: row.response_id,
    student_id: row.student_id,
    category: row.category,
    title: row.title || '',
    description: row.body,
    department: row.author_branch || 'General',
    year: row.author_year || '',
    timestamp: row.created_at,
    votes: asNumber(row.votes),
    answersCount: asNumber(row.answer_count),
    isSaved: Boolean(currentStudentId && savedBy.includes(currentStudentId)),
    userVote,
    isSynthetic: Boolean(row.is_synthetic),
    authorName: row.author_name,
    authorBranch: row.author_branch,
    authorYear: row.author_year,
    authorAvatar: row.author_avatar,
    created_at: row.created_at,
    updated_at: row.updated_at,
    answers: [] as Array<{
      id: string;
      author: string;
      classInfo: string;
      verified: boolean;
      content: string;
      likes: number;
      badgeColor?: string;
      created_at: string;
      isSynthetic: boolean;
    }>
  };
};

const normalizeAnswerRecord = (row: SeniorRow) => ({
  id: row.response_id,
  author: row.author_name,
  classInfo: `${row.author_branch} • ${row.author_year}`.trim(),
  verified: Boolean(row.student_id),
  content: row.body,
  likes: Math.max(0, asNumber(row.votes)),
  badgeColor: row.is_synthetic ? 'text-[#f0a878]' : 'text-cyan-300',
  created_at: row.created_at,
  isSynthetic: Boolean(row.is_synthetic)
});

const getQuestionMap = async () => {
  const result = await query<SeniorRow>(`
    SELECT
      sr.*
    FROM public.senior_responses sr
    ORDER BY sr.created_at DESC
  `);

  const questions = result.rows.filter((row) => row.response_type === 'question');
  const answers = result.rows.filter((row) => row.response_type === 'answer');
  const answersByParent = new Map<string, SeniorRow[]>();

  for (const answer of answers) {
    if (!answer.parent_response_id) {
      continue;
    }

    const list = answersByParent.get(answer.parent_response_id) || [];
    list.push(answer);
    answersByParent.set(answer.parent_response_id, list);
  }

  return { questions, answersByParent };
};

const buildDashboard = async (currentStudentId?: string | null, category?: string | null) => {
  await ensureSchema();

  const { questions, answersByParent } = await getQuestionMap();

  const filteredQuestions = questions.filter((question) => {
    if (!category || category === 'All Topics') {
      return true;
    }

    return question.category.toLowerCase() === category.toLowerCase();
  });

  const questionCards = filteredQuestions.map((question) => {
    const q = normalizeQuestionRecord(question, currentStudentId);
    const childAnswers = (answersByParent.get(question.response_id) || [])
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map(normalizeAnswerRecord);

    return {
      ...q,
      answers: childAnswers,
      answersCount: childAnswers.length || q.answersCount
    };
  });

  const totalQuestions = questions.length;
  const totalAnswers = answersByParent.size > 0
    ? Array.from(answersByParent.values()).reduce((sum, list) => sum + list.length, 0)
    : 0;

  const categoryCounts = questions.reduce<Record<string, number>>((acc, question) => {
    acc[question.category] = (acc[question.category] || 0) + 1;
    return acc;
  }, {});

  const contributorCounts = resultContributorCounts(questions, answersByParent);

  const overview = [
    {
      id: 'total-questions',
      title: 'Active questions',
      subtitle: 'Threads live on Senior POV',
      value: String(totalQuestions),
      icon: 'question_answer',
      accent: '#c2652a'
    },
    {
      id: 'total-answers',
      title: 'Answers posted',
      subtitle: 'Mentor responses in the thread',
      value: String(totalAnswers),
      icon: 'forum',
      accent: '#06b6d4'
    },
    {
      id: 'unanswered',
      title: 'Waiting on seniors',
      subtitle: 'Open threads with no replies yet',
      value: String(questionCards.filter((question) => question.answers.length === 0).length),
      icon: 'hourglass_empty',
      accent: '#f0a878'
    }
  ];

  const contributors = contributorCounts
    .sort((left, right) => right.answers - left.answers)
    .slice(0, 3)
    .map((item) => ({
      name: item.name,
      details: `${item.branch} • ${item.year}`,
      answers: item.answers,
      avatar: item.avatar || DEFAULT_AVATAR
    }));

  const trendingCategories = Object.entries(categoryCounts)
    .sort((left, right) => Number(right[1]) - Number(left[1]))
    .slice(0, 4)
    .map(([categoryName, count]) => ({
      category: categoryName,
      count
    }));

  const unansweredQuestions = questionCards
    .filter((question) => question.answers.length === 0)
    .slice(0, 2);

  return {
    questions: questionCards,
    insights: {
      overview,
      contributors,
      trendingCategories,
      unansweredQuestions
    }
  };
};

const resultContributorCounts = (
  questions: SeniorRow[],
  answersByParent: Map<string, SeniorRow[]>
) => {
  const counts = new Map<string, { name: string; branch: string; year: string; avatar: string; answers: number }>();

  const upsert = (row: SeniorRow) => {
    const key = `${row.author_name}|${row.author_branch}|${row.author_year}|${row.author_avatar}`;
    const existing = counts.get(key) || {
      name: row.author_name,
      branch: row.author_branch,
      year: row.author_year,
      avatar: row.author_avatar,
      answers: 0
    };

    counts.set(key, {
      ...existing,
      answers: existing.answers + 1
    });
  };

  for (const [parentId, answers] of answersByParent.entries()) {
    void parentId;
    for (const answer of answers) {
      upsert(answer);
    }
  }

  return Array.from(counts.values());
};

const fetchQuestionById = async (questionId: string): Promise<SeniorRow | null> => {
  const result = await query<SeniorRow>(
    `SELECT * FROM public.senior_responses WHERE response_id = $1 LIMIT 1`,
    [questionId]
  );

  return result.rows[0] || null;
};

const fetchStudentSnapshot = async (studentId: string) => {
  const result = await query<Record<string, unknown>>(
    `SELECT student_id, name, branch, year, avatar FROM public.students WHERE student_id = $1 LIMIT 1`,
    [studentId]
  );

  const row = result.rows[0];
  if (!row) {
    throw new ApiError(404, 'Student not found');
  }

  const avatar = String(row.avatar || row.avatar_url || DEFAULT_AVATAR);

  return {
    student_id: String(row.student_id || ''),
    name: String(row.name || ''),
    branch: String(row.branch || ''),
    year: String(row.year || ''),
    avatar: String(row.avatar || DEFAULT_AVATAR)
  };
};

const getSavedArray = (row: SeniorRow): string[] => normalizeArray(row.saved_by);
const getUpvotedArray = (row: SeniorRow): string[] => normalizeArray(row.upvoted_by);
const getDownvotedArray = (row: SeniorRow): string[] => normalizeArray(row.downvoted_by);

router.get('/schema', async (_req, res, next) => {
  try {
    await ensureSchema();
    const columns = await getTableColumns('senior_responses');
    res.json({ table: 'senior_responses', schema: 'public', columns });
  } catch (error) {
    next(error);
  }
});

router.get('/questions', async (req, res, next) => {
  try {
    const currentStudentId = getAuthUserId(req)
      ? (await resolveCurrentStudent(req)).studentId
      : null;
    const category = typeof req.query.category === 'string' ? req.query.category : null;
    const dashboard = await buildDashboard(currentStudentId, category);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

router.get('/insights', async (_req, res, next) => {
  try {
    const dashboard = await buildDashboard();
    res.json(dashboard.insights);
  } catch (error) {
    next(error);
  }
});

router.post('/questions', async (req, res, next) => {
  try {
    await ensureSchema();

    const body = req.body as Record<string, unknown>;
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const category = String(body.category || '').trim();

    if (!title || !category) {
      throw new ApiError(400, 'title and category are required');
    }

    const author = await resolveCurrentStudent(req);
    const timestamp = new Date().toISOString();
    const responseId = randomUUID();

    await query(
      `
        INSERT INTO public.senior_responses (
          response_id, response_type, parent_response_id, student_id, category, title, body,
          author_name, author_branch, author_year, author_avatar, votes, answer_count,
          saved_by, upvoted_by, downvoted_by, is_synthetic, created_at, updated_at
        ) VALUES (
          $1, 'question', NULL, $2::uuid, $3, $4, $5,
          $6, $7, $8, $9, 1, 0,
          '{}'::text[], ARRAY[$11::text]::text[], '{}'::text[], false, $10, $10
        )
      `,
      [
        responseId,
        author.studentId,
        category,
        title,
        description || title,
        author.name,
        author.branch,
        author.year,
        author.avatar,
        timestamp,
        author.studentId
      ]
    );

    const created = await fetchQuestionById(responseId);
    if (!created) {
      throw new ApiError(500, 'Unable to create senior question');
    }

    const dashboard = await buildDashboard(author.studentId);
    const createdQuestion = dashboard.questions.find((question) => question.id === responseId);

    res.status(201).json(createdQuestion || normalizeQuestionRecord(created, author.studentId));
  } catch (error) {
    next(error);
  }
});

router.post('/questions/:id/answers', async (req, res, next) => {
  try {
    await ensureSchema();

    const questionId = req.params.id;
    const body = req.body as Record<string, unknown>;
    const content = String(body.content || '').trim();

    if (!content) {
      throw new ApiError(400, 'content is required');
    }

    const question = await fetchQuestionById(questionId);
    if (!question || question.response_type !== 'question') {
      throw new ApiError(404, 'Question not found');
    }

    const author = await resolveCurrentStudent(req);
    const timestamp = new Date().toISOString();
    const responseId = randomUUID();

    await query(
      `
        INSERT INTO public.senior_responses (
          response_id, response_type, parent_response_id, student_id, category, title, body,
          author_name, author_branch, author_year, author_avatar, votes, answer_count,
          saved_by, upvoted_by, downvoted_by, is_synthetic, created_at, updated_at
        ) VALUES (
          $1, 'answer', $2, $3::uuid, $4, NULL, $5,
          $6, $7, $8, $9, 0, 0,
          '{}'::text[], '{}'::text[], '{}'::text[], false, $10, $10
        )
      `,
      [
        responseId,
        questionId,
        author.studentId,
        question.category,
        content,
        author.name,
        author.branch,
        author.year,
        author.avatar,
        timestamp
      ]
    );

    await query(
      `
        UPDATE public.senior_responses
        SET answer_count = answer_count + 1, updated_at = NOW()
        WHERE response_id = $1
      `,
      [questionId]
    );

    const dashboard = await buildDashboard(author.studentId);
    const updatedQuestion = dashboard.questions.find((question) => question.id === questionId);
    res.status(201).json(updatedQuestion || null);
  } catch (error) {
    next(error);
  }
});

router.post('/questions/:id/vote', async (req, res, next) => {
  try {
    await ensureSchema();

    const questionId = req.params.id;
    const body = req.body as Record<string, unknown>;
    const direction = String(body.direction || '').trim() as 'up' | 'down';

    const currentStudent = await resolveCurrentStudent(req);
    const studentId = currentStudent.studentId;

    if (!['up', 'down'].includes(direction)) {
      throw new ApiError(400, 'direction is required');
    }

    const question = await fetchQuestionById(questionId);
    if (!question || question.response_type !== 'question') {
      throw new ApiError(404, 'Question not found');
    }

    const upvotedBy = getUpvotedArray(question);
    const downvotedBy = getDownvotedArray(question);

    const alreadyUp = upvotedBy.includes(studentId);
    const alreadyDown = downvotedBy.includes(studentId);

    let voteDelta = 0;

    if (direction === 'up') {
      if (alreadyUp) {
        voteDelta = -1;
        question.votes = asNumber(question.votes) - 1;
        question.upvoted_by = upvotedBy.filter((id) => id !== studentId);
      } else if (alreadyDown) {
        voteDelta = 2;
        question.votes = asNumber(question.votes) + 2;
        question.downvoted_by = downvotedBy.filter((id) => id !== studentId);
        question.upvoted_by = [...upvotedBy, studentId];
      } else {
        voteDelta = 1;
        question.votes = asNumber(question.votes) + 1;
        question.upvoted_by = [...upvotedBy, studentId];
      }
    } else {
      if (alreadyDown) {
        voteDelta = 1;
        question.votes = asNumber(question.votes) + 1;
        question.downvoted_by = downvotedBy.filter((id) => id !== studentId);
      } else if (alreadyUp) {
        voteDelta = -2;
        question.votes = asNumber(question.votes) - 2;
        question.upvoted_by = upvotedBy.filter((id) => id !== studentId);
        question.downvoted_by = [...downvotedBy, studentId];
      } else {
        voteDelta = -1;
        question.votes = asNumber(question.votes) - 1;
        question.downvoted_by = [...downvotedBy, studentId];
      }
    }

    const currentUp = question.upvoted_by ? normalizeArray(question.upvoted_by) : upvotedBy;
    const currentDown = question.downvoted_by ? normalizeArray(question.downvoted_by) : downvotedBy;

    await query(
      `
        UPDATE public.senior_responses
        SET votes = $1, upvoted_by = $2::text[], downvoted_by = $3::text[], updated_at = NOW()
        WHERE response_id = $4
      `,
      [
        asNumber(question.votes),
        currentUp,
        currentDown,
        questionId
      ]
    );

    const dashboard = await buildDashboard(currentStudent.studentId);
    const updatedQuestion = dashboard.questions.find((item) => item.id === questionId);
    res.json(updatedQuestion || null);
  } catch (error) {
    next(error);
  }
});

router.post('/questions/:id/save', async (req, res, next) => {
  try {
    await ensureSchema();

    const questionId = req.params.id;
    const currentStudent = await resolveCurrentStudent(req);
    const studentId = currentStudent.studentId;

    const question = await fetchQuestionById(questionId);
    if (!question || question.response_type !== 'question') {
      throw new ApiError(404, 'Question not found');
    }

    const savedBy = getSavedArray(question);
    const alreadySaved = savedBy.includes(studentId);
    const nextSavedBy = alreadySaved
      ? savedBy.filter((id) => id !== studentId)
      : [...savedBy, studentId];

    await query(
      `
        UPDATE public.senior_responses
        SET saved_by = $1::text[], updated_at = NOW()
        WHERE response_id = $2
      `,
      [nextSavedBy, questionId]
    );

    const dashboard = await buildDashboard(studentId);
    const updatedQuestion = dashboard.questions.find((item) => item.id === questionId);
    res.json(updatedQuestion || null);
  } catch (error) {
    next(error);
  }
});

export default router;
