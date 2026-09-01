import { Router, Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const getGenieConfig = () => {
  const host = process.env.GENIE_DATABRICKS_HOST || process.env.DATABRICKS_HOST || '';
  const token = process.env.GENIE_DATABRICKS_TOKEN || process.env.DATABRICKS_TOKEN || '';
  const spaceId = process.env.GENIE_SPACE_ID || '';

  return {
    host: host.startsWith('http') ? host.replace(/\/$/, '') : `https://${host}`.replace(/\/$/, ''),
    token,
    spaceId,
  };
};

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;
let attachmentsShapeLogged = false;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractAnswer(attachments: any[]): string {
  if (!Array.isArray(attachments)) {
    return "I couldn't generate a clear answer for that.";
  }

  // 1. Preferred: explicit ANSWER-purpose text attachment
  for (const att of attachments) {
    if (
      att?.text?.purpose === 'TEXT_ATTACHMENT_PURPOSE_ANSWER' &&
      att?.text?.content
    ) {
      return att.text.content;
    }
  }

  // 2. Fallback: query description (SQL result summary)
  for (const att of attachments) {
    if (att?.query?.description) {
      return att.query.description;
    }
  }

  // 3. Any text content at all
  for (const att of attachments) {
    if (att?.text?.content) {
      return att.text.content;
    }
  }

  return "I couldn't generate a clear answer for that.";
}

function extractSuggestedQuestions(attachments: any[]): string[] {
  if (!Array.isArray(attachments)) return [];

  for (const att of attachments) {
    const questions = att?.suggested_questions?.questions;
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
  }

  return [];
}

// GET /api/genzen/health
router.get('/health', (_req: Request, res: Response) => {
  const { host, spaceId } = getGenieConfig();
  res.json({ status: 'ok', space: spaceId, host });
});

// POST /api/genzen/ask
router.post('/ask', async (req: Request, res: Response) => {
  const { question } = req.body;
  const { host, token, spaceId } = getGenieConfig();

  if (!host || !token || !spaceId) {
    return res.status(500).json({
      error: 'Genie is not configured. Missing DATABRICKS_HOST, DATABRICKS_TOKEN, or GENIE_SPACE_ID.',
    });
  }

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      error: "Request body must include a non-empty 'question' string.",
    });
  }

  const GENIE_BASE = `${host}/api/2.0/genie/spaces/${spaceId}`;
  const AUTH_HEADER = { Authorization: `Bearer ${token}` };

  let conversationId: string | undefined;
  let messageId: string | undefined;

  // 1. Start Conversation
  try {
    console.log(`\n🟢 [Genie] Starting conversation — question: "${question}"`);
    const startRes = await axios.post(
      `${GENIE_BASE}/start-conversation`,
      { content: question },
      { headers: AUTH_HEADER }
    );

    conversationId = startRes.data?.conversation_id;
    messageId = startRes.data?.message_id;

    if (!conversationId || !messageId) {
      console.error('❌ [Genie] start-conversation response missing IDs:', startRes.data);
      return res.status(502).json({
        error: 'Unexpected response from Databricks: missing conversation_id or message_id.',
        raw: startRes.data,
      });
    }

    console.log(`   ✔ conversation_id=${conversationId}  message_id=${messageId}`);
  } catch (err: any) {
    console.error('❌ [Genie] Failed to start conversation:', err?.response?.data ?? err.message);
    return res.status(502).json({
      error: 'Failed to start Genie conversation.',
      details: err?.response?.data ?? err.message,
    });
  }

  // 2. Poll until COMPLETED / FAILED / timeout
  const pollUrl = `${GENIE_BASE}/conversations/${conversationId}/messages/${messageId}`;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let attempt = 0;
  let finalData: any = null;

  while (Date.now() < deadline) {
    attempt++;
    console.log(`⏳ [Genie] Polling attempt #${attempt} — message_id=${messageId}`);

    try {
      const pollRes = await axios.get(pollUrl, { headers: AUTH_HEADER });
      const data = pollRes.data;
      const status = data?.status;

      console.log(`   status=${status}`);

      if (status === 'COMPLETED') {
        console.log(`✅ [Genie] Message COMPLETED after ${attempt} poll(s).`);
        finalData = data;
        break;
      }

      if (status === 'FAILED' || status === 'CANCELLED') {
        const reason = data?.error ?? data?.failure_reason ?? 'No reason provided.';
        console.error(`❌ [Genie] Message ${status}: ${reason}`);
        return res.status(502).json({
          error: `Genie message ${status.toLowerCase()}.`,
          reason,
          raw: data,
        });
      }

      await sleep(POLL_INTERVAL_MS);
    } catch (err: any) {
      console.error(`❌ [Genie] Poll error on attempt #${attempt}:`, err?.response?.data ?? err.message);
      return res.status(502).json({
        error: 'Error while polling Genie message status.',
        details: err?.response?.data ?? err.message,
      });
    }
  }

  if (!finalData) {
    console.warn(`⏰ [Genie] Timed out after ${POLL_TIMEOUT_MS / 1000}s.`);
    return res.status(504).json({
      error: `Genie did not respond within ${POLL_TIMEOUT_MS / 1000} seconds. Please try again.`,
    });
  }

  // 3. Extract attachments
  const attachments = finalData?.attachments ?? [];

  if (!attachmentsShapeLogged) {
    console.log('\n📦 [Genie] Full attachments array (logged once for inspection):');
    console.log(JSON.stringify(attachments, null, 2));
    attachmentsShapeLogged = true;
  }

  const answer = extractAnswer(attachments);
  const suggestedQuestions = extractSuggestedQuestions(attachments);

  console.log(`💬 [Genie] Answer extracted: "${answer.slice(0, 120)}${answer.length > 120 ? '…' : ''}"`);
  if (suggestedQuestions.length) {
    console.log(`💡 [Genie] Suggested questions: ${suggestedQuestions.join(' | ')}`);
  }

  return res.json({ answer, suggestedQuestions, raw: attachments });
});

export default router;
