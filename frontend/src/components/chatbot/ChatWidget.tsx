import { useEffect, useRef, useState, type FormEvent } from "react";
import { sendChatMessage, type ChatMessage } from "../../api/chatbot";
import { ApiError, NetworkError } from "../../api/client";
import "./ChatWidget.css";
import ReactMarkdown from "react-markdown";
const HISTORY_STORAGE_KEY = "slat.chatbot.history.v1";
const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'm the SLAT Admissions Assistant. Ask me about eligibility, application steps, " +
    "required documents, deadlines, fees, test centres, or payment — I'll answer from the " +
    "official admission guidelines.",
};

function loadHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [WELCOME_MESSAGE];
  } catch {
    return [WELCOME_MESSAGE];
  }
}

/**
 * Clears the chatbot's saved conversation. Exported so AppShell's logout
 * handler can call it alongside OnboardingContext.logout() — chat history
 * isn't applicant data, but on a shared machine there's no reason the
 * next person logging in should see the previous person's questions.
 */
export function clearChatHistory() {
  try {
    sessionStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Storage unavailable — conversation just won't survive a refresh.
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isOpen, isSending]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setIsSending(true);

    try {
      // Send history *before* this turn — the backend appends the new
      // question itself alongside freshly retrieved reference material.
      const reply = await sendChatMessage(text, messages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {/* Lives inline in AppShell's header nav (see AppShell.tsx), not as
          a separate floating button — the brief asked for a navbar icon
          specifically. Only the panel below is a fixed-position overlay. */}
      <button
        type="button"
        className="chatbot-nav-icon"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="chatbot-panel"
        aria-label={isOpen ? "Close admissions assistant" : "Open admissions assistant"}
      >
        <span aria-hidden="true">💬</span>
        <span className="chatbot-nav-icon__label">Assistant</span>
      </button>

      {isOpen && (
        <div className="chatbot-panel" id="chatbot-panel" role="dialog" aria-label="SLAT Admissions Assistant">
          <header className="chatbot-panel__header">
            <div>
              <p className="chatbot-panel__title">Admissions Assistant</p>
              <p className="chatbot-panel__subtitle">Answers from the official SLAT guidelines</p>
            </div>
            <button
              type="button"
              className="chatbot-panel__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
          </header>

          <div className="chatbot-panel__messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-bubble chatbot-bubble--${m.role}`}>
                 <ReactMarkdown children={m.content} />
                 {/* {m.content} */}
              </div>
            ))}
            {isSending && (
              <div className="chatbot-bubble chatbot-bubble--assistant chatbot-bubble--loading" aria-live="polite">
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
                <span className="chatbot-typing-dot" />
              </div>
            )}
            {error && (
              <p className="chatbot-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <form className="chatbot-panel__form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about eligibility, fees, deadlines…"
              aria-label="Your question"
              disabled={isSending}
              maxLength={2000}
            />
            <button type="submit" disabled={isSending || !draft.trim()} aria-label="Send">
              ➤
            </button>
          </form>

          <p className="chatbot-panel__disclaimer">
            For official decisions or account-specific help, contact the admissions helpdesk.
          </p>
        </div>
      )}
    </>
  );
}
