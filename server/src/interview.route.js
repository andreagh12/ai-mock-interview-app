import express from "express";
import { startInterview, continueInterview } from "./interviewEngine.js";

const router = express.Router();

// POST /api/interview/start
router.post("/start", async (req, res) => {
  try {
    const { jobTitle } = req.body;

    if (!jobTitle || typeof jobTitle !== "string") {
      return res.status(400).json({ error: "jobTitle is required" });
    }

    const data = await startInterview(jobTitle);
    return res.json(data);
  } catch (err) {
    console.error("Start error:", err);
    return res.status(500).json({ error: "Failed to start interview" });
  }
});

// POST /api/interview/message
router.post("/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "sessionId is required" });
    }
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const data = await continueInterview(sessionId, message);

    // engine can return { error: ... }
    if (data?.error) return res.status(400).json(data);

    return res.json(data);
  } catch (err) {
    console.error("Message error:", err);
    return res.status(500).json({ error: "Failed to continue interview" });
  }
});

export default router;