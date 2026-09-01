import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.use(express.json());

const host = (process.env.DATABRICKS_HOST ?? '').replace(/\/$/, '');
const token = process.env.DATABRICKS_TOKEN;
const warehouseId = process.env.DATABRICKS_WAREHOUSE_ID;
const genieSpaceId = process.env.GENIE_SPACE_ID;

const catalog = process.env.DATABRICKS_CATALOG ?? 'main';
const schema = process.env.DATABRICKS_SCHEMA ?? 'default';

const configured = Boolean(host && token && warehouseId);

type DatabricksResponse = {
  statement_id?: string;
  status?: {
    state?: string;
    error?: {
      message?: string;
    };
  };
  manifest?: {
    schema?: {
      columns?: {
        name: string;
      }[];
    };
  };
  result?: {
    data_array?: unknown[][];
  };
};

const sqlLiteral = (value: string | number | null) => {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
};

async function execute(statement: string): Promise<DatabricksResponse> {
  if (!configured) {
    throw new Error(
      'Databricks is not configured. Set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_WAREHOUSE_ID.',
    );
  }

  const response = await fetch(`${host}/api/2.0/sql/statements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      statement,
      warehouse_id: warehouseId,
      catalog,
      schema,
      wait_timeout: '10s',
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Databricks returned HTTP ${response.status}: ${await response.text()}`,
    );
  }

  let result = (await response.json()) as DatabricksResponse;

  while (
    result.statement_id &&
    ['PENDING', 'RUNNING'].includes(result.status?.state ?? '')
  ) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const poll = await fetch(
      `${host}/api/2.0/sql/statements/${result.statement_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!poll.ok) {
      throw new Error(
        `Databricks polling returned HTTP ${poll.status}`,
      );
    }

    result = (await poll.json()) as DatabricksResponse;
  }

  if (
    result.status?.state === 'FAILED' ||
    result.status?.state === 'CANCELED'
  ) {
    throw new Error(
      result.status.error?.message ?? 'Databricks statement failed.',
    );
  }

  return result;
}

async function ensureTables() {
  await execute(`
    CREATE TABLE IF NOT EXISTS campus_events (
      id STRING,
      event_day INT,
      title STRING,
      event_time STRING,
      category STRING,
      location STRING,
      description STRING,
      attendees_count INT,
      created_at TIMESTAMP
    ) USING DELTA
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS campus_event_rsvps (
      event_id STRING,
      user_id STRING,
      created_at TIMESTAMP
    ) USING DELTA
  `);
}

function rows(result: DatabricksResponse) {
  const columns =
    result.manifest?.schema?.columns?.map((column) => column.name) ?? [];

  return (result.result?.data_array ?? []).map((row) =>
    Object.fromEntries(
      columns.map((column, index) => [column, row[index]]),
    ),
  );
}

const fallbackAlumni: Record<string, unknown>[] = [
  {
   id: 'alumni-arya',
   name: 'Arya Mehta',
   role: 'Senior Product Engineer',
   company: 'Google',
   department: 'CSE',
   graduationYear: '2019',
   location: 'Bengaluru, India',
   bio: 'Former GenZen campus builder now working on AI-powered developer tooling and mentoring students on product and career growth.',
   linkedInUrl: 'https://www.linkedin.com/in/arya-mehta-demo',
   mentorshipTopics: ['Product strategy', 'AI careers', 'System design'],
   skills: ['Product', 'System Design', 'AI', 'Leadership'],
   verified: true,
   claimed: true,
   availability: 'Open for 1:1 mentoring every Saturday',
   avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  },
  {
   id: 'alumni-rhea',
   name: 'Rhea Kapoor',
   role: 'ML Engineer',
   company: 'NVIDIA',
   department: 'CSE',
   graduationYear: '2020',
   location: 'Hyderabad, India',
   bio: 'Builds robust ML systems and helps students navigate research, internships, and domain-specific learning roadmaps.',
   linkedInUrl: 'https://www.linkedin.com/in/rhea-kapoor-demo',
   mentorshipTopics: ['Machine learning', 'Internships', 'Research paths'],
   skills: ['Python', 'PyTorch', 'MLOps', 'Data'],
   verified: true,
   claimed: true,
   availability: 'Open to monthly mentor check-ins',
   avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&auto=format&fit=crop&q=80',
  },
  {
   id: 'alumni-vasu',
   name: 'Vasu Nair',
   role: 'Software Engineer, Platform',
   company: 'Microsoft',
   department: 'IT',
   graduationYear: '2018',
   location: 'Pune, India',
   bio: 'Helps students learn startup thinking, product engineering, and how to move from campus projects to high-impact roles.',
   linkedInUrl: 'https://www.linkedin.com/in/vasu-nair-demo',
   mentorshipTopics: ['Career strategy', 'Startup journeys', 'Software engineering'],
   skills: ['JavaScript', 'Cloud', 'Distributed Systems', 'Leadership'],
   verified: true,
   claimed: false,
   availability: 'Available for project feedback and mock interviews',
   avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  },
  {
   id: 'alumni-neha',
   name: 'Neha Sethi',
   role: 'UX Research Lead',
   company: 'Adobe',
   department: 'Design',
   graduationYear: '2021',
   location: 'Delhi, India',
   bio: 'Advises students on design careers, portfolio building, and transitioning from campus experiences into industry roles.',
   linkedInUrl: 'https://www.linkedin.com/in/neha-sethi-demo',
   mentorshipTopics: ['UX research', 'Portfolio critique', 'Design careers'],
   skills: ['UX', 'Research', 'Product Thinking', 'Figma'],
   verified: false,
   claimed: true,
   availability: 'Weekend office hours for design students',
   avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  },
];

function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
   return value
     .map((item) => String(item).trim())
     .filter(Boolean);
  }

  if (typeof value === 'string') {
   const trimmed = value.trim();

   if (!trimmed) {
     return [];
   }

   if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
     try {
       const parsed = JSON.parse(trimmed) as unknown;
       if (Array.isArray(parsed)) {
         return parsed
           .map((item) => String(item).trim())
           .filter(Boolean);
       }
     } catch {
       // fall through to string splitting below
     }
   }

   return trimmed
     .replace(/\[|\]|"/g, '')
     .split(/[|,\n]/)
     .map((entry) => entry.trim())
     .filter(Boolean);
  }

  return [];
}

function normalizeAlumniRecord(raw: Record<string, unknown>) {
  const getString = (key: string, fallback = '') => {
   const value = raw[key];
   if (value === null || value === undefined) {
     return fallback;
   }

   return String(value);
  };

  const id = getString('alumni_id', getString('id'));

  return {
   id,
   name: getString('name', getString('full_name')),
   graduationYear: getString('graduation_year', getString('graduationYear')),
   department: getString('department'),
   degree: getString('degree'),
   company: getString('current_company', getString('company')),
   role: getString('current_role', getString('role')),
   industry: getString('industry'),
   skills: normalizeStringArray(raw.skills),
   internships: normalizeStringArray(raw.internships),
   projects: normalizeStringArray(raw.projects),
   mentorshipTopics: normalizeStringArray(
     raw.mentorship_topics ?? raw.mentorshipTopics,
   ),
   linkedInUrl: getString('linkedin_url', getString('linkedInUrl')) || null,
   profileImageUrl:
     getString('profile_image_url', getString('profileImageUrl')) || null,
   verified: Boolean(raw.verified),
   createdAt: raw.created_at ? String(raw.created_at) : null,
   updatedAt: raw.updated_at ? String(raw.updated_at) : null,
  };
}

function validateLinkedInUrl(rawUrl: unknown): {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
} {
  if (typeof rawUrl !== 'string') {
   return {
     valid: false,
     error: 'LinkedIn profile URL is required.',
   };
  }

  const value = rawUrl.trim();

  if (!value) {
   return {
     valid: false,
     error: 'LinkedIn profile URL is required.',
   };
  }

  if (!/^https:\/\//i.test(value)) {
   return {
     valid: false,
     error: 'LinkedIn URL must use HTTPS.',
   };
  }

  let parsed: URL;

  try {
   parsed = new URL(value);
  } catch {
   return {
     valid: false,
     error: 'Enter a valid LinkedIn profile URL.',
   };
  }

  if (parsed.protocol !== 'https:') {
   return {
     valid: false,
     error: 'LinkedIn URL must use HTTPS.',
   };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname !== 'linkedin.com' && hostname !== 'www.linkedin.com') {
   return {
     valid: false,
     error: 'LinkedIn URL must point to linkedin.com.',
   };
  }

  const pathname = parsed.pathname.toLowerCase();

  if (!pathname.startsWith('/in/')) {
   return {
     valid: false,
     error: 'LinkedIn profile URLs must use the /in/ format.',
   };
  }

  const slug = pathname.replace(/^\/in\//i, '').replace(/\/+$/, '');

  if (!slug) {
   return {
     valid: false,
     error: 'LinkedIn profile URL is missing the profile slug.',
   };
  }

  const normalizedUrl = `https://www.linkedin.com/in/${slug}`;

  return {
   valid: true,
   normalizedUrl,
  };
}

function matchAlumniFilter(profile: Record<string, unknown>, filters: Record<string, string>) {
  const q = filters.q?.trim().toLowerCase();
  const graduationYear = filters.graduation_year?.trim();
  const department = filters.department?.trim().toLowerCase();
  const company = filters.company?.trim().toLowerCase();
  const role = filters.role?.trim().toLowerCase();
  const skill = filters.skill?.trim().toLowerCase();
  const industry = filters.industry?.trim().toLowerCase();
  const mentorshipTopic = filters.mentorship_topic?.trim().toLowerCase();

  if (q) {
   const haystacks = [
     String(profile.name ?? ''),
     String(profile.company ?? ''),
     String(profile.role ?? ''),
     Array.isArray(profile.skills) ? profile.skills.join(' ') : String(profile.skills ?? ''),
     String(profile.industry ?? ''),
     Array.isArray(profile.mentorshipTopics) ? profile.mentorshipTopics.join(' ') : String(profile.mentorshipTopics ?? ''),
   ].join(' ').toLowerCase();

   if (!haystacks.includes(q)) {
     return false;
   }
  }

  if (graduationYear && String(profile.graduationYear ?? '') !== graduationYear) {
   return false;
  }

  if (department && String(profile.department ?? '').toLowerCase() !== department) {
   return false;
  }

  if (company && String(profile.company ?? '').toLowerCase() !== company) {
   return false;
  }

  if (role && String(profile.role ?? '').toLowerCase() !== role) {
   return false;
  }

  if (skill) {
   const skills = Array.isArray(profile.skills)
     ? profile.skills.map((entry) => String(entry).toLowerCase())
     : [String(profile.skills ?? '').toLowerCase()];

   if (!skills.includes(skill)) {
     return false;
   }
  }

  if (industry && String(profile.industry ?? '').toLowerCase() !== industry) {
   return false;
  }

  if (mentorshipTopic) {
   const topics = Array.isArray(profile.mentorshipTopics)
     ? profile.mentorshipTopics.map((entry) => String(entry).toLowerCase())
     : [String(profile.mentorshipTopics ?? '').toLowerCase()];

   if (!topics.includes(mentorshipTopic)) {
     return false;
   }
  }

  return true;
}

/* =========================================================
   DATABRICKS GENIE API
   ========================================================= */

type GenieTextAttachment = {
  text?: {
    content?: string;
    purpose?: string;
  };
};

type GenieMessage = {
  message_id?: string;
  conversation_id?: string;
  status?: string;
  content?: string;
  attachments?: GenieTextAttachment[] | null;
  error?: {
    message?: string;
    type?: string;
  } | null;
};

type GenieStartResponse = {
  conversation?: {
    id?: string;
    conversation_id?: string;
  };
  conversation_id?: string;
  message?: GenieMessage;
};

type GenieMessageResponse = GenieMessage & {
  conversation?: {
    id?: string;
    conversation_id?: string;
  };
};

function genieConfigured(): boolean {
  return Boolean(host && token && genieSpaceId);
}

async function genieRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!genieConfigured()) {
    throw new Error(
      'Databricks Genie is not configured. Set DATABRICKS_HOST, DATABRICKS_TOKEN, and GENIE_SPACE_ID.',
    );
  }

  const genieResponse = await fetch(
    `${host}/api/2.0/genie/spaces/${genieSpaceId}${endpoint}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    },
  );

  const text = await genieResponse.text();

  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      raw: text,
    };
  }

  if (!genieResponse.ok) {
    throw new Error(
      `Databricks Genie returned HTTP ${genieResponse.status}: ${text}`,
    );
  }

  return data as T;
}

function extractGenieText(message?: GenieMessage | null): string {
  if (!message) {
    return '';
  }

  const attachments = message.attachments ?? [];

  const answerAttachments = attachments.filter(
    (attachment) =>
      attachment.text?.content &&
      (
        !attachment.text.purpose ||
        attachment.text.purpose ===
          'TEXT_ATTACHMENT_PURPOSE_ANSWER'
      ),
  );

  const texts = (
    answerAttachments.length > 0
      ? answerAttachments
      : attachments
  )
    .map(
      (attachment) =>
        attachment.text?.content?.trim() ?? '',
    )
    .filter(Boolean);

  return texts.join('\n\n').trim();
}

async function waitForGenieMessage(
  conversationId: string,
  messageId: string,
): Promise<GenieMessage> {
  const terminalStates = new Set([
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'QUERY_RESULT_EXPIRED',
  ]);

  const maxAttempts = 60;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const message =
      await genieRequest<GenieMessageResponse>(
        `/conversations/${conversationId}/messages/${messageId}`,
        {
          method: 'GET',
        },
      );

    if (terminalStates.has(message.status ?? '')) {
      if (message.status !== 'COMPLETED') {
        throw new Error(
          message.error?.message ??
            `Genie message ended with status ${message.status}.`,
        );
      }

      return message;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 1000),
    );
  }

  throw new Error(
    'Timed out waiting for Databricks Genie to complete the response.',
  );
}

async function startGenieConversation(
  content: string,
): Promise<{
  conversationId: string;
  message: GenieMessage;
}> {
  const result =
    await genieRequest<GenieStartResponse>(
      '/start-conversation',
      {
        method: 'POST',
        body: JSON.stringify({
          content,
          enable_visualization: false,
        }),
      },
    );

  const conversationId =
    result.conversation?.id ??
    result.conversation?.conversation_id ??
    result.conversation_id ??
    result.message?.conversation_id;

  const messageId =
    result.message?.message_id;

  if (!conversationId) {
    throw new Error(
      'Databricks Genie did not return a conversation ID.',
    );
  }

  if (!messageId) {
    throw new Error(
      'Databricks Genie did not return a message ID.',
    );
  }

  const completedMessage =
    await waitForGenieMessage(
      conversationId,
      messageId,
    );

  return {
    conversationId,
    message: completedMessage,
  };
}

async function sendGenieMessage(
  conversationId: string,
  content: string,
): Promise<GenieMessage> {
  const result =
    await genieRequest<GenieMessageResponse>(
      `/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          content,
          enable_visualization: false,
        }),
      },
    );

  const messageId =
    result.message_id;

  if (!messageId) {
    throw new Error(
      'Databricks Genie did not return a message ID.',
    );
  }

  return waitForGenieMessage(
    conversationId,
    messageId,
  );
}

/* =========================================================
   GENIE CHAT ENDPOINT
   ========================================================= */

app.post('/api/genie/chat', async (request, response) => {
  const body = request.body as {
    message?: unknown;
    conversationId?: unknown;
  };

  const message =
    typeof body.message === 'string'
      ? body.message.trim()
      : '';

  const existingConversationId =
    typeof body.conversationId === 'string'
      ? body.conversationId.trim()
      : '';

  if (!message) {
    response.status(400).json({
      success: false,
      error: 'message is required.',
    });
    return;
  }

  if (message.length > 4000) {
    response.status(400).json({
      success: false,
      error: 'message must be 4000 characters or fewer.',
    });
    return;
  }

  try {
    let conversationId: string;
    let genieMessage: GenieMessage;

    if (existingConversationId) {
      genieMessage =
        await sendGenieMessage(
          existingConversationId,
          message,
        );

      conversationId =
        existingConversationId;
    } else {
      const result =
        await startGenieConversation(message);

      conversationId =
        result.conversationId;

      genieMessage = result.message;
    }

    const answer =
      extractGenieText(genieMessage);

    response.json({
      success: true,
      conversationId,
      messageId:
        genieMessage.message_id ?? null,
      status:
        genieMessage.status ?? null,
      answer:
        answer ||
        'Genie completed the request but did not return a text response.',
    });
  } catch (error) {
    console.error(
      'Genie chat error:',
      error,
    );

    response.status(503).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to communicate with Databricks Genie.',
    });
  }
});

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get('/api/health', (_req, response) =>
  response.json({
    configured,
    genieConfigured: genieConfigured(),
  }),
);

/* =========================================================
   EVENTS API
   ========================================================= */

app.get('/api/events', async (_req, response) => {
  try {
    await ensureTables();

    const result = await execute(`
      SELECT
        id,
        event_day,
        title,
        event_time,
        category,
        location,
        description,
        attendees_count
      FROM campus_events
      ORDER BY event_day, created_at DESC
    `);

    response.json(rows(result));
  } catch (error) {
    response.status(503).json({
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load events.',
    });
  }
});

/* =========================================================
   SENIOR RESPONSES API
   ========================================================= */

app.get('/api/senior-responses', async (_req, response) => {
  try {
    const result = await execute(`
      SELECT
        response_id,
        submitted_at,
        graduating_year,
        branch,
        primary_elective,
        elective_rating,
        elective_recommend,
        career_interest,
        internship_experience,
        internship_company_type,
        club_name,
        club_engagement,
        biggest_challenge,
        lesson_learned,
        is_synthetic
      FROM hackathon.graduation_leak.senior_responses
      ORDER BY submitted_at DESC
      LIMIT 100
    `);

    const data = rows(result);

    response.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Senior responses error:', error);

    response.status(503).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to load senior responses.',
    });
  }
});

/* =========================================================
   ALUMNI PROFILES API
   ========================================================= */

app.get('/api/alumni', async (request, response) => {
  const page = Math.max(1, parseNumber(request.query.page, 1));
  const pageSize = Math.min(
   100,
   Math.max(1, parseNumber(request.query.limit ?? request.query.pageSize, 12)),
  );
  const offset = (page - 1) * pageSize;

  try {
   if (!configured) {
     const data = fallbackAlumni.slice(offset, offset + pageSize);

     response.json({
       success: true,
       page,
       pageSize,
       total: fallbackAlumni.length,
       count: data.length,
       data,
     });
     return;
   }

   const totalResult = await execute(`
     SELECT COUNT(*) AS total
     FROM workspace.default.alumni_profiles
   `);
   const total = Number(rows(totalResult)[0]?.total ?? 0);

   const result = await execute(`
     SELECT
       alumni_id,
       name,
       graduation_year,
       department,
       degree,
       current_company,
       current_role,
       industry,
       skills,
       internships,
       projects,
       mentorship_topics,
       linkedin_url,
       profile_image_url,
       verified,
       created_at,
       updated_at
     FROM workspace.default.alumni_profiles
     ORDER BY verified DESC, graduation_year DESC, alumni_id ASC
     LIMIT ${pageSize} OFFSET ${offset}
   `);

   const data = rows(result).map((profile) => normalizeAlumniRecord(profile));

   response.json({
     success: true,
     page,
     pageSize,
     total,
     count: data.length,
     data,
   });
  } catch (error) {
   console.error('Alumni profiles error:', error);
   const fallbackData = fallbackAlumni.slice(offset, offset + pageSize);

   response.status(503).json({
     success: false,
     error:
       error instanceof Error
         ? error.message
         : 'Unable to load alumni profiles.',
     fallback: fallbackData,
   });
  }
});

app.get('/api/alumni/search', async (request, response) => {
  const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
  const page = Math.max(1, parseNumber(request.query.page, 1));
  const pageSize = Math.min(
   100,
   Math.max(1, parseNumber(request.query.limit ?? request.query.pageSize, 12)),
  );
  const offset = (page - 1) * pageSize;

  const filters = {
   q: typeof request.query.q === 'string' ? request.query.q.trim() : '',
   graduation_year:
     typeof request.query.graduation_year === 'string'
       ? request.query.graduation_year.trim()
       : '',
   department:
     typeof request.query.department === 'string'
       ? request.query.department.trim()
       : '',
   company:
     typeof request.query.company === 'string'
       ? request.query.company.trim()
       : '',
   role:
     typeof request.query.role === 'string'
       ? request.query.role.trim()
       : '',
   skill:
     typeof request.query.skill === 'string'
       ? request.query.skill.trim()
       : '',
   industry:
     typeof request.query.industry === 'string'
       ? request.query.industry.trim()
       : '',
   mentorship_topic:
     typeof request.query.mentorship_topic === 'string'
       ? request.query.mentorship_topic.trim()
       : '',
  };

  try {
   if (!configured) {
     const candidates = fallbackAlumni.filter((profile) => matchAlumniFilter(profile, filters));
     const data = candidates.slice(offset, offset + pageSize);

     response.json({
       success: true,
       page,
       pageSize,
       total: candidates.length,
       count: data.length,
       data,
     });
     return;
   }

   const clauses: string[] = [];

   if (filters.q) {
     const q = filters.q.toLowerCase();
     clauses.push(`(
       LOWER(COALESCE(name, '')) LIKE ${sqlLiteral(`%${q}%`)}
       OR LOWER(COALESCE(current_company, '')) LIKE ${sqlLiteral(`%${q}%`)}
       OR LOWER(COALESCE(current_role, '')) LIKE ${sqlLiteral(`%${q}%`)}
       OR LOWER(COALESCE(industry, '')) LIKE ${sqlLiteral(`%${q}%`)}
       OR LOWER(CAST(COALESCE(skills, ARRAY()) AS STRING)) LIKE ${sqlLiteral(`%${q}%`)}
       OR LOWER(CAST(COALESCE(mentorship_topics, ARRAY()) AS STRING)) LIKE ${sqlLiteral(`%${q}%`)}
     )`);
   }

   if (filters.graduation_year) {
     clauses.push(`LOWER(CAST(graduation_year AS STRING)) = LOWER(${sqlLiteral(filters.graduation_year)})`);
   }

   if (filters.department) {
     clauses.push(`LOWER(COALESCE(department, '')) = LOWER(${sqlLiteral(filters.department)})`);
   }

   if (filters.company) {
     clauses.push(`LOWER(COALESCE(current_company, '')) = LOWER(${sqlLiteral(filters.company)})`);
   }

   if (filters.role) {
     clauses.push(`LOWER(COALESCE(current_role, '')) = LOWER(${sqlLiteral(filters.role)})`);
   }

   if (filters.skill) {
     clauses.push(`LOWER(CAST(COALESCE(skills, ARRAY()) AS STRING)) LIKE ${sqlLiteral(`%${filters.skill.toLowerCase()}%`)}`);
   }

   if (filters.industry) {
     clauses.push(`LOWER(COALESCE(industry, '')) = LOWER(${sqlLiteral(filters.industry)})`);
   }

   if (filters.mentorship_topic) {
     clauses.push(`LOWER(CAST(COALESCE(mentorship_topics, ARRAY()) AS STRING)) LIKE ${sqlLiteral(`%${filters.mentorship_topic.toLowerCase()}%`)}`);
   }

   const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

   const totalResult = await execute(`
     SELECT COUNT(*) AS total
     FROM workspace.default.alumni_profiles
     ${whereClause}
   `);
   const total = Number(rows(totalResult)[0]?.total ?? 0);

   const result = await execute(`
     SELECT
       alumni_id,
       name,
       graduation_year,
       department,
       degree,
       current_company,
       current_role,
       industry,
       skills,
       internships,
       projects,
       mentorship_topics,
       linkedin_url,
       profile_image_url,
       verified,
       created_at,
       updated_at
     FROM workspace.default.alumni_profiles
     ${whereClause}
     ORDER BY verified DESC, graduation_year DESC, alumni_id ASC
     LIMIT ${pageSize} OFFSET ${offset}
   `);

   const data = rows(result).map((profile) => normalizeAlumniRecord(profile));

   response.json({
     success: true,
     page,
     pageSize,
     total,
     count: data.length,
     data,
   });
  } catch (error) {
   console.error('Alumni search error:', error);
   const candidates = fallbackAlumni.filter((profile) => matchAlumniFilter(profile, filters));
   const data = candidates.slice(offset, offset + pageSize);

   response.status(503).json({
     success: false,
     error:
       error instanceof Error
         ? error.message
         : 'Unable to search alumni profiles.',
     fallback: data,
   });
  }
});

app.get('/api/alumni/:id', async (request, response) => {
  const alumniId = String(request.params.id ?? '').trim();

  if (!alumniId) {
   response.status(400).json({
     success: false,
     error: 'alumni id is required.',
   });
   return;
  }

  try {
   if (!configured) {
     const profile = fallbackAlumni.find((item) => item.id === alumniId) ?? null;

     if (!profile) {
       response.status(404).json({
         success: false,
         error: 'Alumni profile not found.',
       });
       return;
     }

     response.json({
       success: true,
       data: profile,
     });
     return;
   }

   const result = await execute(`
     SELECT
       alumni_id,
       name,
       graduation_year,
       department,
       degree,
       current_company,
       current_role,
       industry,
       skills,
       internships,
       projects,
       mentorship_topics,
       linkedin_url,
       profile_image_url,
       verified,
       created_at,
       updated_at
     FROM workspace.default.alumni_profiles
     WHERE alumni_id = ${sqlLiteral(alumniId)}
     LIMIT 1
   `);

   const rowsData = rows(result);

   if (!rowsData.length) {
     response.status(404).json({
       success: false,
       error: 'Alumni profile not found.',
     });
     return;
   }

   response.json({
     success: true,
     data: normalizeAlumniRecord(rowsData[0]),
   });
  } catch (error) {
   console.error('Alumni profile detail error:', error);
   const profile = fallbackAlumni.find((item) => item.id === alumniId) ?? null;

   if (!profile) {
     response.status(404).json({
       success: false,
       error: 'Alumni profile not found.',
     });
     return;
   }

   response.json({
     success: true,
     data: profile,
   });
  }
});

app.put('/api/alumni/:id/linkedin', async (request, response) => {
  const alumniId = String(request.params.id ?? '').trim();
  const body = request.body as Record<string, unknown>;
  const linkedinUrl = typeof body.linkedin_url === 'string'
   ? body.linkedin_url
   : typeof body.linkedinUrl === 'string'
     ? body.linkedinUrl
     : '';

  if (!alumniId) {
   response.status(400).json({
     success: false,
     error: 'alumni id is required.',
   });
   return;
  }

  const validation = validateLinkedInUrl(linkedinUrl);

  if (!validation.valid) {
   response.status(400).json({
     success: false,
     error: validation.error ?? 'Invalid LinkedIn URL.',
   });
   return;
  }

  try {
   if (!configured) {
     const profileIndex = fallbackAlumni.findIndex((profile) => profile.id === alumniId);

     if (profileIndex === -1) {
       response.status(404).json({
         success: false,
         error: 'Alumni profile not found.',
       });
       return;
     }

     const existing = fallbackAlumni[profileIndex];
     const updatedProfile = {
       ...existing,
       linkedInUrl: validation.normalizedUrl,
     };

     fallbackAlumni[profileIndex] = updatedProfile;

     response.json({
       success: true,
       data: updatedProfile,
     });
     return;
   }

   await execute(`
     UPDATE workspace.default.alumni_profiles
     SET linkedin_url = ${sqlLiteral(validation.normalizedUrl ?? '')},
         updated_at = current_timestamp()
     WHERE alumni_id = ${sqlLiteral(alumniId)}
   `);

   const result = await execute(`
     SELECT
       alumni_id,
       name,
       graduation_year,
       department,
       degree,
       current_company,
       current_role,
       industry,
       skills,
       internships,
       projects,
       mentorship_topics,
       linkedin_url,
       profile_image_url,
       verified,
       created_at,
       updated_at
     FROM workspace.default.alumni_profiles
     WHERE alumni_id = ${sqlLiteral(alumniId)}
     LIMIT 1
   `);

   const rowsData = rows(result);

   if (!rowsData.length) {
     response.status(404).json({
       success: false,
       error: 'Alumni profile not found.',
     });
     return;
   }

   response.json({
     success: true,
     data: normalizeAlumniRecord(rowsData[0]),
   });
  } catch (error) {
   console.error('Alumni LinkedIn update error:', error);
   response.status(503).json({
     success: false,
     error:
       error instanceof Error
         ? error.message
         : 'Unable to update LinkedIn profile.',
   });
  }
});

/* =========================================================
   CREATE EVENT
   ========================================================= */

app.post('/api/events', async (request, response) => {
  const event = request.body as Record<string, unknown>;

  if (
    !event.id ||
    !event.title ||
    !event.event_day ||
    !event.event_time ||
    !event.category
  ) {
    response.status(400).json({
      error:
        'id, title, event_day, event_time, and category are required.',
    });
    return;
  }

  try {
    await ensureTables();

    await execute(`
      INSERT INTO campus_events VALUES (
        ${sqlLiteral(String(event.id))},
        ${sqlLiteral(Number(event.event_day))},
        ${sqlLiteral(String(event.title))},
        ${sqlLiteral(String(event.event_time))},
        ${sqlLiteral(String(event.category))},
        ${sqlLiteral(
          event.location ? String(event.location) : null,
        )},
        ${sqlLiteral(
          event.description ? String(event.description) : null,
        )},
        0,
        current_timestamp()
      )
    `);

    response.status(201).json(event);
  } catch (error) {
    response.status(503).json({
      error:
        error instanceof Error
          ? error.message
          : 'Unable to create event.',
    });
  }
});

/* =========================================================
   RSVP
   ========================================================= */

app.post('/api/events/:id/rsvp', async (request, response) => {
  const eventId = request.params.id;
  const userId = String(request.body?.userId ?? 'demo-user');

  try {
    await ensureTables();

    const existing = rows(
      await execute(`
        SELECT event_id
        FROM campus_event_rsvps
        WHERE event_id = ${sqlLiteral(eventId)}
          AND user_id = ${sqlLiteral(userId)}
        LIMIT 1
      `),
    );

    if (existing.length) {
      await execute(`
        DELETE FROM campus_event_rsvps
        WHERE event_id = ${sqlLiteral(eventId)}
          AND user_id = ${sqlLiteral(userId)}
      `);

      await execute(`
        UPDATE campus_events
        SET attendees_count =
          greatest(coalesce(attendees_count, 0) - 1, 0)
        WHERE id = ${sqlLiteral(eventId)}
      `);

      response.json({ registered: false });
    } else {
      await execute(`
        INSERT INTO campus_event_rsvps
        VALUES (
          ${sqlLiteral(eventId)},
          ${sqlLiteral(userId)},
          current_timestamp()
        )
      `);

      await execute(`
        UPDATE campus_events
        SET attendees_count =
          coalesce(attendees_count, 0) + 1
        WHERE id = ${sqlLiteral(eventId)}
      `);

      response.json({ registered: true });
    }
  } catch (error) {
    response.status(503).json({
      error:
        error instanceof Error
          ? error.message
          : 'Unable to update RSVP.',
    });
  }
});

/* =========================================================
   STATIC FRONTEND
   ========================================================= */

const dist = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'dist',
);

app.use(express.static(dist));

app.get('*', (_request, response) =>
  response.sendFile(path.join(dist, 'index.html')),
);

/* =========================================================
   START SERVER
   ========================================================= */

const PORT = Number(process.env.PORT ?? 8787);

app.listen(PORT, () => {
  console.log(
    `GenZen server listening on port ${PORT}${
      configured
        ? ' (Databricks enabled)'
        : ' (Databricks not configured)'
    }`,
  );

  console.log(
    `Genie ${
      genieConfigured()
        ? 'enabled'
        : 'not configured'
    }`,
  );
});