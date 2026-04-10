import { useState } from "react";
import styles from "./InterviewApp.module.css";
import ChatWindow from "./ChatWindow";

function InterviewApp() {
  const [jobTitle, setJobTitle] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const API_BASE = "http://localhost:5050/api/interview";

  // Start Interview
  const startInterview = async () => {
    if (!jobTitle.trim()) return;

    setLoading(true);
    setDone(false);

    try {
      const res = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to start interview");
      }

      setSessionId(data.sessionId);
      setMessages([{ sender: "ai", text: data.reply }]);
    } catch (err) {
      console.error(err);
      setMessages([{ sender: "ai", text: `Error: ${err.message}` }]);
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  // Send Message
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !sessionId || done) return;

    const userText = message;
    const userMessage = { sender: "user", text: userText };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: userText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to continue interview");
      }

      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
      setDone(Boolean(data.done));
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "ai", text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mock Interview Trainer</h1>

      {/* Job Title + Start */}
      <div className={styles.jobInputSection}>
        <label>Job Title</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Frontend Developer"
        />
       <div className={styles.buttonRow}>
  <button
    onClick={startInterview}
    disabled={!jobTitle.trim() || loading}
  >
    {loading ? "Starting..." : "Start Interview"}
  </button>

  <button
    onClick={() => {
      setSessionId(null);
      setMessages([]);
      setDone(false);
    }}
    disabled={!sessionId}
  >
    Restart Interview
  </button>
</div>
      </div>

      {/* Chat Window */}
      <ChatWindow messages={messages} loading={loading} />

      {/* Message Input */}
      <form className={styles.inputSection} onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your answer..."
          disabled={!sessionId || loading || done}
        />
        <button type="submit" disabled={!sessionId || loading || done}>
          {loading ? "Waiting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default InterviewApp;