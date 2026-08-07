import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PaperAirplaneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import ChatBubble from '../components/ChatBubble';
import { sendChatMessage } from '../api/chat';

const welcomeMessage = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi, I'm your CareLedger AI assistant. Ask me about symptoms, medications, or anything health-related — I'm here to help.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

function TypingIndicator() {
  return (
    <div className="flex max-w-[82%] flex-col self-start items-start">
      <div className="rounded-[22px] rounded-tl-md border border-border bg-white px-4 py-4 shadow-card">
        <div className="flex items-center gap-1.5">
          <span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" />
          <span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" />
          <span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" />
        </div>
      </div>
      <span className="mt-1 text-xs text-muted">AI is typing...</span>
    </div>
  );
}

function MessageComposer({ value, onChange, onSubmit, disabled, loading }) {
  const emergencyNote = loading ? 'Waiting for AI reply...' : 'AI-generated guidance, not a medical diagnosis.';

  return (
    <div className="sticky bottom-0 z-10 border-t border-border bg-background/90 backdrop-blur">
      <div className="space-y-3 px-1 pb-1 pt-4 sm:px-0">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-card">
          <div className="flex items-center gap-2 text-sm text-muted">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            <span>{emergencyNote}</span>
          </div>
          <Link
            to="/emergency"
            className="inline-flex items-center rounded-full bg-critical px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
          >
            Emergency Mode
          </Link>
        </div>

        <form onSubmit={onSubmit} className="rounded-[28px] border border-border bg-white p-4 shadow-card sm:p-5">
          <div className="flex items-end gap-3">
            <textarea
              value={value}
              onChange={onChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (!disabled) {
                    onSubmit(event);
                  }
                }
              }}
              placeholder="Type your message..."
              rows={2}
              className="min-h-[56px] flex-1 resize-none rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-heading outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);

  const emergencyActive = useMemo(() => messages.some((message) => message.emergencyDetected), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const conversationHistory = messages.map(({ role, content }) => ({ role, content }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = draft.trim();
    if (!trimmedMessage || loading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDraft('');
    setLoading(true);
    setError('');
    setMessages((currentMessages) => [...currentMessages, userMessage]);

    try {
      const response = await sendChatMessage(trimmedMessage, conversationHistory);
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        emergencyDetected: Boolean(response.emergency_detected),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send message right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">
              CareLedger AI
            </div>
            <h2 className="mt-5 text-3xl font-medium tracking-tight text-heading sm:text-4xl">Chat with a calm health guidance assistant</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Ask about symptoms, medications, or care questions. For anything serious, the assistant will steer you toward Emergency Mode or structured care tools.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-sm leading-7 text-heading">
            <div className="font-medium text-heading">Live support</div>
            <p className="mt-1 text-muted">Context is carried across each turn in the conversation.</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-230px)] flex-col rounded-[32px] border border-border bg-background shadow-card">
        <div ref={scrollAreaRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message.content}
              isUser={message.role === 'user'}
              emergencyDetected={Boolean(message.emergencyDetected)}
              timestamp={message.timestamp}
            />
          ))}
          {loading ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border bg-slate-50/80 px-4 py-4 sm:px-6">
          {emergencyActive ? (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <span className="font-medium">This may be urgent — consider using Emergency Mode</span>
              <Link
                to="/emergency"
                className="inline-flex items-center rounded-full bg-critical px-3 py-2 text-xs font-medium text-white transition hover:opacity-90"
              >
                Emergency Mode
              </Link>
            </div>
          ) : null}

          {error ? <div className="mb-3 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{error}</div> : null}

          <MessageComposer
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onSubmit={handleSubmit}
            disabled={loading || !draft.trim()}
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}
