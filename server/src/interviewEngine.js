import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "models/gemini-flash-latest";

if (!GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is missing. Add it to .env in the repo root");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

// In-memory sessions (resets when server restarts)
const sessions = Object.create(null);

function newSessionId() {
  return crypto.randomBytes(16).toString("hex");
}

function buildSystemInstruction(jobTitle) {
  return `
You are an experienced, professional job interviewer interviewing a candidate for the role: "${jobTitle}".

Rules:
- Start the interview with exactly: "Tell me about yourself."
- After the first question, do NOT use pre-written or hardcoded questions.
- Ask follow-up questions that adapt to the candidate’s previous answers and are appropriate for the role.
- Keep questions clear and professional (one question at a time).
- After at least 6 questions, you must stop asking questions and instead provide:
  1) overall feedback on the candidate’s answers,
  2) what they did well,
  3) what to improve,
  4) example improvements or structure tips.

Style:
- Be concise but helpful.
- If the candidate gives very short answers, ask a probing follow-up.
`;
}

// Gemini expects roles: "user" and "model"
function toGeminiContents(history) {
  return history.map((m) => ({
    role: m.role, // "user" | "model"
    parts: [{ text: m.text }],
  }));
}

export async function startInterview(jobTitle) {
  const cleanJobTitle = String(jobTitle || "").trim();
  if (!cleanJobTitle) throw new Error("jobTitle is required");

  const sessionId = newSessionId();
  sessions[sessionId] = {
    jobTitle: cleanJobTitle,
    questionCount: 1,
    phase: "interview",
    history: [{ role: "model", text: "Tell me about yourself." }],
  };

  return {
    sessionId,
    reply: "Tell me about yourself.",
    questionCount: 1,
    done: false,
  };
}

export async function continueInterview(sessionId, message) {
  const session = sessions[sessionId];
  if (!session) return { error: "Invalid sessionId. Start a new interview." };

  const userMessage = String(message || "").trim();
  if (!userMessage) return { error: "Message is required" };

  session.history.push({ role: "user", text: userMessage });

  const shouldGiveFeedback = session.questionCount >= 6;

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemInstruction(session.jobTitle),
  });

let prompt;

if (shouldGiveFeedback) {
  prompt =
    "The interview is now complete. Do NOT ask another question. Provide final feedback with sections: Overall Feedback, Strengths, Improvements, and Suggestions.";
} else {
  prompt =
    "Ask the next best interview question for this role based on the candidate’s last answer.";
}

  const result = await model.generateContent({
    contents: [
      ...toGeminiContents(session.history),
      { role: "user", parts: [{ text: prompt }] },
    ],
  });

  const reply = result.response.text().trim();

  session.history.push({ role: "model", text: reply });

  let done = false;
if (shouldGiveFeedback) {
  session.phase = "feedback";
  done = true;
} else {
  session.questionCount += 1;
}

  return {
    sessionId,
    reply,
    questionCount: session.questionCount,
    done,
  };
}