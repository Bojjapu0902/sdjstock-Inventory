import './ChatAssistant.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MdSmartToy, MdClose, MdSend, MdDeleteOutline, MdRefresh } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const MAX_LENGTH = 1000;

const ADMIN_SUGGESTIONS = [
  'Which items are running low, and what should I reorder first?',
  'Which items expire in the next 30 days?',
  'What is our total stock value by category?',
  'Which purchase orders are unpaid or overdue?',
];

const PROJECT_SUGGESTIONS = [
  'What stock did we receive this week?',
  'Is anything waiting for my approval?',
  'What stock is left on our project?',
];

const CONNECTION_ERROR = 'Could not reach the server. Please check your connection and try again.';

/** Shows **bold** text. Rendered as React text, so replies can't inject HTML. */
const Bubble = ({ text }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (
      part.startsWith('**') && part.endsWith('**') && part.length > 4
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{part}</React.Fragment>
    ))}
  </>
);

const ChatAssistant = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [sending, setSending]       = useState(false);
  const [failed, setFailed]         = useState(null); // { text, error }
  const [historyState, setHistory]  = useState('idle'); // idle | loading | ready | error

  const logRef   = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const wasOpenRef  = useRef(false);

  const loadHistory = useCallback(async () => {
    setHistory('loading');
    try {
      const data = await api.get('/chat/history');
      setMessages((data.messages || []).map(({ role, content }) => ({ role, content })));
      setHistory('ready');
    } catch {
      setHistory('error');
    }
  }, []);

  useEffect(() => {
    if (open && historyState === 'idle') loadHistory();
  }, [open, historyState, loadHistory]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else if (wasOpenRef.current) launcherRef.current?.focus();
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, sending, failed, open]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const ask = async (text, isRetry = false) => {
    const question = text.trim();
    if (!question || sending) return;
    setFailed(null);
    if (!isRetry) {
      setMessages((m) => [...m, { role: 'user', content: question }]);
      setInput('');
    }
    setSending(true);
    try {
      const { reply } = await api.post('/chat', { message: question });
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setFailed({ text: question, error: err.status ? err.message : CONNECTION_ERROR });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Clear your chat history? This cannot be undone.')) return;
    try {
      await api.delete('/chat/history');
      setMessages([]);
      setFailed(null);
    } catch (err) {
      setFailed({ text: null, error: err.status ? err.message : CONNECTION_ERROR });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  };

  const suggestions = isAdmin ? ADMIN_SUGGESTIONS : PROJECT_SUGGESTIONS;
  const showEmpty = historyState === 'ready' && messages.length === 0 && !sending && !failed;

  if (!open) {
    return (
      <button
        ref={launcherRef}
        type="button"
        className="chat-launcher"
        onClick={() => setOpen(true)}
        aria-label="Open stock assistant"
        title="Ask the stock assistant"
      >
        <MdSmartToy />
      </button>
    );
  }

  return (
    <section className="chat-panel" role="dialog" aria-label="Stock assistant">
      <header className="chat-header">
        <div className="chat-header-icon"><MdSmartToy /></div>
        <div className="chat-header-text">
          <div className="chat-title">Stock Assistant</div>
          <div className="chat-subtitle">{isAdmin ? 'Answers from all company data' : 'Answers from your project only'}</div>
        </div>
        {messages.length > 0 && (
          <button type="button" className="chat-icon-btn" onClick={clearChat} aria-label="Clear chat history" title="Clear chat history">
            <MdDeleteOutline />
          </button>
        )}
        <button type="button" className="chat-icon-btn" onClick={close} aria-label="Close stock assistant" title="Close">
          <MdClose />
        </button>
      </header>

      <div className="chat-log" ref={logRef} role="log" aria-live="polite">
        {historyState === 'loading' && <div className="chat-status">Loading your chat…</div>}

        {historyState === 'error' && (
          <div className="chat-error">
            Could not load your earlier chat.
            <button type="button" className="chat-retry" onClick={loadHistory}><MdRefresh /> Try again</button>
          </div>
        )}

        {showEmpty && (
          <div className="chat-empty">
            <p className="chat-empty-title">Hi {user?.name || user?.username}, what would you like to check?</p>
            {suggestions.length > 0 ? (
              <div className="chat-suggestions">
                {suggestions.map((s) => (
                  <button key={s} type="button" className="chat-suggestion" onClick={() => ask(s)}>{s}</button>
                ))}
              </div>
            ) : (
              <p className="chat-empty-note">Your account isn't linked to a project yet, so there's no data to show. Please ask an admin to link it.</p>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`}>
            <Bubble text={m.content} />
          </div>
        ))}

        {sending && (
          <div className="chat-bubble assistant chat-typing" aria-label="The assistant is answering">
            <span /><span /><span />
          </div>
        )}

        {failed && (
          <div className="chat-error" role="alert">
            {failed.error}
            {failed.text && (
              <button type="button" className="chat-retry" onClick={() => ask(failed.text, true)}><MdRefresh /> Try again</button>
            )}
          </div>
        )}
      </div>

      <div className="chat-composer">
        <textarea
          ref={inputRef}
          className="chat-input"
          rows={1}
          value={input}
          maxLength={MAX_LENGTH}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about stock…"
          aria-label="Your question"
        />
        <button
          type="button"
          className="chat-send"
          onClick={() => ask(input)}
          disabled={sending || !input.trim()}
          aria-label="Send question"
          title="Send"
        >
          <MdSend />
        </button>
      </div>
      <div className="chat-footnote">Answers only. It can't change anything. AI can make mistakes, so check important figures.</div>
    </section>
  );
};

export default ChatAssistant;
