/**
 * GenZen – Databricks Genie API Proxy
 * ------------------------------------
 * Single-file Express backend for hackathon use.
 * Wraps the Databricks Genie Conversation API and exposes:
 *   POST /api/genzen/ask  { question: string }
 *   GET  /api/genzen/health
 */

import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ─── Config ──────────────────────────────────────────────────────────────────

const {
  DATABRICKS_HOST,
  DATABRICKS_TOKEN,
  GENIE_SPACE_ID,
  GENIE_PORT = 4000,
} = process.env;

if (!DATABRICKS_HOST || !DATABRICKS_TOKEN || !GENIE_SPACE_ID) {
  console.error(
    "❌  Missing required env vars: DATABRICKS_HOST, DATABRICKS_TOKEN, GENIE_SPACE_ID"
  );
  process.exit(1);
}

const GENIE_BASE = `${DATABRICKS_HOST.replace(/\/$/, '')}/api/2.0/genie/spaces/${GENIE_SPACE_ID}`;
const AUTH_HEADER = { Authorization: `Bearer ${DATABRICKS_TOKEN}` };

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

// Log attachments shape only once per server session
let attachmentsShapeLogged = false;

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/api/genzen/health", (_req, res) => {
  res.json({ status: "ok", space: GENIE_SPACE_ID, host: DATABRICKS_HOST });
});

// ─── POST /api/genzen/ask ─────────────────────────────────────────────────────

app.post("/api/genzen/ask", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    return res
      .status(400)
      .json({ error: "Request body must include a non-empty 'question' string." });
  }

  // ── Step 1: Start conversation ────────────────────────────────────────────
  let conversationId, messageId;

  try {
    console.log(`\n🟢  [Genie] Starting conversation — question: "${question}"`);

    const startRes = await axios.post(
      `${GENIE_BASE}/start-conversation`,
      { content: question },
      { headers: AUTH_HEADER }
    );

    conversationId = startRes.data?.conversation_id;
    messageId = startRes.data?.message_id;

    if (!conversationId || !messageId) {
      console.error(
        "❌  [Genie] start-conversation response missing IDs:",
        startRes.data
      );
      return res.status(502).json({
        error:
          "Unexpected response from Databricks: missing conversation_id or message_id.",
        raw: startRes.data,
      });
    }

    console.log(
      `   ✔ conversation_id=${conversationId}  message_id=${messageId}`
    );
  } catch (err) {
    console.error(
      "❌  [Genie] Failed to start conversation:",
      err?.response?.data ?? err.message
    );
    return res.status(502).json({
      error: "Failed to start Genie conversation.",
      details: err?.response?.data ?? err.message,
    });
  }

  // ── Step 2: Poll until COMPLETED / FAILED / timeout ───────────────────────
  const pollUrl = `${GENIE_BASE}/conversations/${conversationId}/messages/${messageId}`;
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let attempt = 0;
  let finalData = null;

  while (Date.now() < deadline) {
    attempt++;
    console.log(
      `⏳  [Genie] Polling attempt #${attempt} — message_id=${messageId}`
    );

    try {
      const pollRes = await axios.get(pollUrl, { headers: AUTH_HEADER });
      const data = pollRes.data;
      const status = data?.status;

      console.log(`   status=${status}`);

      if (status === "COMPLETED") {
        console.log(`✅  [Genie] Message COMPLETED after ${attempt} poll(s).`);
        finalData = data;
        break;
      }

      if (status === "FAILED" || status === "CANCELLED") {
        const reason =
          data?.error ?? data?.failure_reason ?? "No reason provided.";
        console.error(`❌  [Genie] Message ${status}: ${reason}`);
        return res.status(502).json({
          error: `Genie message ${status.toLowerCase()}.`,
          reason,
          raw: data,
        });
      }

      // Still running (EXECUTING_QUERY, FETCHING_DATA, etc.) — wait and retry
      await sleep(POLL_INTERVAL_MS);
    } catch (err) {
      console.error(
        `❌  [Genie] Poll error on attempt #${attempt}:`,
        err?.response?.data ?? err.message
      );
      return res.status(502).json({
        error: "Error while polling Genie message status.",
        details: err?.response?.data ?? err.message,
      });
    }
  }

  if (!finalData) {
    console.warn(`⏰  [Genie] Timed out after ${POLL_TIMEOUT_MS / 1000}s.`);
    return res.status(504).json({
      error: `Genie did not respond within ${
        POLL_TIMEOUT_MS / 1000
      } seconds. Please try again.`,
    });
  }

  // ── Step 3: Extract answer from attachments ────────────────────────────────
  const attachments = finalData?.attachments ?? [];

  // Log the full shape exactly once so you can inspect it in the console
  if (!attachmentsShapeLogged) {
    console.log(
      "\n📦  [Genie] Full attachments array (logged once for inspection):"
    );
    console.log(JSON.stringify(attachments, null, 2));
    attachmentsShapeLogged = true;
  }

  const answer = extractAnswer(attachments);
  const suggestedQuestions = extractSuggestedQuestions(attachments);

  console.log(
    `💬  [Genie] Answer extracted: "${answer.slice(0, 120)}${
      answer.length > 120 ? "…" : ""
    }"`
  );
  if (suggestedQuestions.length) {
    console.log(
      `💡  [Genie] Suggested questions: ${suggestedQuestions.join(" | ")}`
    );
  }

  return res.json({ answer, suggestedQuestions, raw: attachments });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the primary text answer from Genie attachments.
 *
 * Priority order:
 *  1. attachment.text where text.purpose === "TEXT_ATTACHMENT_PURPOSE_ANSWER"
 *  2. Any attachment with a non-empty query.description
 *  3. Any attachment with a text.content (any purpose)
 *  4. Friendly fallback message — never crashes or returns undefined
 */
function extractAnswer(attachments) {
  if (!Array.isArray(attachments)) {
    return "I couldn't generate a clear answer for that.";
  }

  // 1. Preferred: explicit ANSWER-purpose text attachment
  for (const att of attachments) {
    if (
      att?.text?.purpose === "TEXT_ATTACHMENT_PURPOSE_ANSWER" &&
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

/**
 * Extract suggested follow-up questions from attachments.
 * Returns an array of strings (may be empty).
 */
function extractSuggestedQuestions(attachments) {
  if (!Array.isArray(attachments)) return [];

  for (const att of attachments) {
    const questions = att?.suggested_questions?.questions;
    if (Array.isArray(questions) && questions.length > 0) {
      return questions;
    }
  }

  return [];
}

/** Promise-based sleep helper. */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(GENIE_PORT, () => {
  console.log(`\n🚀  GenZen backend running on http://localhost:${GENIE_PORT}`);
  console.log(`   Databricks host : ${DATABRICKS_HOST}`);
  console.log(`   Genie space     : ${GENIE_SPACE_ID}`);
  console.log(`   Route           : POST /api/genzen/ask`);
  console.log(`   Health check    : GET  /api/genzen/health\n`);
});
