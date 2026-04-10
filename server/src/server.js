import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import interviewRoute from "./interview.route.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5050);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Interview API
app.use("/api/interview", interviewRoute);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});