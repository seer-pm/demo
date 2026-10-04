import { useEffect, useRef, useState } from "react";
import "./market-chat.css";

type Draft = { question: string; category: string; date: string; source: string; rules: string };
const emptyDraft: Draft = { question: "", category: "Crypto", date: "", source: "", rules: "" };
const examples = [
  "Will Bitcoin reach $150,000 before the end of 2026?",
  "Will a human land on Mars before 2030?",
  "Will England win the 2030 World Cup?",
];
const starter =
  "What do you see happening? Start with an idea. We’ll turn it into a clear question, then define how it resolves.";

export default function MarketChatPreview({ onManual }: { onManual: () => void }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [messages, setMessages] = useState([{ role: "assistant", text: starter }]);
  const [input, setInput] = useState("");
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = endRef.current?.parentElement;
    if (messages.length > 1 && container) container.scrollTop = container.scrollHeight;
  }, [messages]);
  const update = (key: keyof Draft, value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setReview(false);
    setError("");
  };
  const send = (text = input) => {
    const prompt = text.trim();
    if (!prompt) return;
    let reply: string;
    if (!draft.question) {
      const year = prompt.match(/\b20\d{2}\b/)?.[0];
      const question = `${prompt.replace(/[.!?]+$/, "")}?`;
      setDraft({
        ...emptyDraft,
        question,
        category: /world cup|win|football/i.test(prompt) ? "Sports" : /mars|space/i.test(prompt) ? "Science" : "Crypto",
        date: year ? `${year}-12-31` : "",
      });
      reply =
        "Here’s your starting draft. Choose the exact deadline and a source in the draft panel, then refine the resolution rules. Nothing is published.";
    } else if (/resolution|rules|precise|clearer/i.test(prompt)) {
      setDraft((d) => ({
        ...d,
        rules: `Resolve Yes if the event in “${d.question}” is confirmed by ${d.source || "the source you select"} by ${d.date || "the deadline you select"} at 23:59 UTC. Otherwise resolve No. Review source availability and ambiguous outcomes before publishing.`,
      }));
      reply =
        "I’ve added example resolution rules using your draft’s source and deadline. Review and edit them before continuing.";
    } else if (/^title:/i.test(prompt)) {
      update("question", prompt.replace(/^title:\s*/i, ""));
      reply = "The market question is updated. Check whether the resolution rules need to change too.";
    } else {
      reply =
        "This preview supports “Refine resolution rules” and “Title: your new question”. You can edit every field in the draft panel. Free-form AI refinement will be connected by the developers.";
    }
    setMessages((m) => [...m, { role: "user", text: prompt }, { role: "assistant", text: reply }]);
    setInput("");
    setReview(false);
  };
  const preview = () => {
    if (!draft.question.trim() || !draft.date || !draft.source.trim() || !draft.rules.trim()) {
      setError("Add a question, deadline, source and resolution rules to preview your market.");
      return;
    }
    if (new Date(`${draft.date}T23:59:00Z`).getTime() <= Date.now()) {
      setError("Choose a future resolution date.");
      return;
    }
    setError("");
    setReview(true);
  };
  return (
    <section className="seer-chat-builder">
      <div className="seer-chat-heading">
        <div>
          <span className="seer-chat-eyebrow">FROM IDEA TO MARKET</span>
          <h1>What happens next?</h1>
          <p>Turn your perspective into a market. Shape it with AI.</p>
        </div>
        <button type="button" className="seer-chat-text-button" onClick={onManual}>
          Use manual form ↗
        </button>
      </div>
      <div className="seer-chat-workspace">
        <div className="seer-chat-conversation">
          <header>
            <span className="seer-chat-spark" aria-hidden="true">
              ✦
            </span>
            <strong>Seer market studio</strong>
            <span className="seer-chat-badge">AI preview · simulated</span>
          </header>
          <div className="seer-chat-messages" role="log" aria-label="Market conversation" aria-live="polite">
            {messages.map((message, i) => (
              <div key={i} className={`seer-chat-message ${message.role}`}>
                <small>{message.role === "user" ? "You" : "Seer"}</small>
                <p>{message.text}</p>
              </div>
            ))}
            {!draft.question && (
              <div className="seer-chat-examples">
                <small>TRY AN IDEA</small>
                {examples.map((text) => (
                  <button key={text} type="button" onClick={() => send(text)}>
                    {text}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef} />
          </div>
          {draft.question && (
            <div className="seer-chat-suggestions">
              <button type="button" onClick={() => send("Refine resolution rules")}>
                ✦ Refine resolution rules
              </button>
            </div>
          )}
          <form
            className="seer-chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label className="sr-only" htmlFor="market-message">
              Your market idea or refinement
            </label>
            <textarea
              id="market-message"
              rows={2}
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                draft.question
                  ? "Ask to refine the rules, or try ‘Title: …’"
                  : "I think Bitcoin will reach $150k this year…"
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button type="submit" disabled={!input.trim()} aria-label="Send message">
              ↑
            </button>
          </form>
          <p className="seer-chat-footnote">Preview only. No AI connection or market submission.</p>
        </div>
        <aside className="seer-chat-draft" aria-label="Market draft">
          <header>
            <strong>{review ? "Market preview" : "Your market draft"}</strong>
            <span className="seer-chat-badge">{review ? "Ready to review" : "Draft"}</span>
          </header>
          {!draft.question ? (
            <div className="seer-chat-empty">
              <span aria-hidden="true">✧</span>
              <h2>An idea worth trading.</h2>
              <p>Your question, outcomes and resolution details will take shape here.</p>
              <div className="seer-chat-skeleton" />
              <div className="seer-chat-skeleton short" />
            </div>
          ) : review ? (
            <div className="seer-chat-review">
              <span className="seer-chat-eyebrow">{draft.category} · BINARY MARKET</span>
              <h2>{draft.question}</h2>
              <div className="seer-chat-outcomes">
                <span>Yes</span>
                <span>No</span>
              </div>
              <dl>
                <dt>Resolution deadline</dt>
                <dd>{draft.date} · 23:59 UTC</dd>
                <dt>Source</dt>
                <dd>{draft.source}</dd>
                <dt>Resolution rules</dt>
                <dd>{draft.rules}</dd>
              </dl>
              <button type="button" className="seer-chat-primary" onClick={() => setReview(false)}>
                Continue editing
              </button>
              <p className="seer-chat-footnote">This is a preview card. Publishing is not connected.</p>
            </div>
          ) : (
            <div className="seer-chat-fields">
              <label>
                Market question
                <textarea
                  value={draft.question}
                  maxLength={500}
                  onChange={(e) => update("question", e.target.value)}
                  rows={3}
                />
              </label>
              <div className="seer-chat-field-pair">
                <label>
                  Category
                  <select value={draft.category} onChange={(e) => update("category", e.target.value)}>
                    {["Crypto", "Sports", "Politics", "Science", "Business", "Culture", "Other"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Deadline (23:59 UTC)
                  <input type="date" value={draft.date} onChange={(e) => update("date", e.target.value)} />
                </label>
              </div>
              <label>
                Resolution source
                <input
                  value={draft.source}
                  maxLength={500}
                  onChange={(e) => update("source", e.target.value)}
                  placeholder="Official source or URL"
                />
              </label>
              <label>
                Resolution rules
                <textarea
                  rows={4}
                  value={draft.rules}
                  maxLength={3000}
                  onChange={(e) => update("rules", e.target.value)}
                  placeholder="Define exactly what counts as Yes or No."
                />
              </label>
              <div className="seer-chat-outcomes">
                <span>Yes</span>
                <span>No</span>
              </div>
              {error && (
                <p className="seer-chat-error" role="alert">
                  {error}
                </p>
              )}
              <button type="button" className="seer-chat-primary" onClick={preview}>
                Preview market ↗
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
