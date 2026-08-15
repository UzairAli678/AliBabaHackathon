import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PaperAirplaneIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ChatBubble from '../components/ChatBubble';
import { sendChatMessage } from '../api/chat';
import aiChatHeader from '../assets/illustrations/ai-chat-header.png';
import { useAuth } from '../context/AuthContext';

const suggestedPrompts = [
  'Help me understand my symptoms',
  'Which specialist should I see?',
  'Explain a medication',
  'Find the next step in my care'
];

function createWelcomeMessage(name) {
  const greeting = name ? `Hello ${name}` : 'Hello';
  return {
    id: 'welcome',
    role: 'assistant',
    content: `${greeting}! I’m the CareLedger AI health guide. I can help you understand symptoms, medications, suitable doctor specialties, nearby hospitals, and the next steps in your care journey. How may I guide you today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

function TypingIndicator({ wakingUp }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
        <SparklesIcon className="h-4 w-4" />
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-primary">CareLedger AI</div>
        <div className="rounded-[22px] rounded-tl-md border border-border bg-white px-5 py-4 shadow-card">
          <div className="flex items-center gap-1.5">
            <span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" />
            <span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" />
            <span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" />
          </div>
        </div>
        <span className="mt-1 block text-xs text-muted">{wakingUp ? 'The secure service is waking up. This can take up to a minute on the first message...' : 'Thinking...'}</span>
      </div>
    </div>
  );
}

function MessageComposer({ value, onChange, onSubmit, disabled, loading }) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-border bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
      <form onSubmit={onSubmit} className="rounded-[24px] border border-border bg-white p-2 shadow-[0_12px_35px_-18px_rgba(15,23,42,0.3)] transition focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
        <div className="flex items-end gap-3">
          <textarea
            value={value}
            onChange={onChange}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (!disabled) onSubmit(event);
              }
            }}
            placeholder="Message CareLedger AI..."
            rows={1}
            className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-heading outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-45"
          >
            <PaperAirplaneIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        <ShieldCheckIcon className="h-3.5 w-3.5" />
        {loading ? 'Preparing your response...' : 'CareLedger AI can make mistakes. Verify important medical information.'}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').trim().split(/\s+/)[0];
  const [messages, setMessages] = useState(() => [createWelcomeMessage(firstName)]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [error, setError] = useState('');
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const conversationHistory = messages.map(({ role, content }) => ({ role, content }));
  const emergencyActive = messages.some((message) => message.emergencyDetected);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedMessage = draft.trim();
    if (!trimmedMessage || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setDraft('');
    setLoading(true);
    setWakingUp(false);
    setError('');
    setMessages((currentMessages) => [...currentMessages, userMessage]);

    const wakeUpTimer = window.setTimeout(() => setWakingUp(true), 8000);

    try {
      const response = await sendChatMessage(trimmedMessage, conversationHistory, firstName);
      setMessages((currentMessages) => [...currentMessages, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        emergencyDetected: Boolean(response.emergency_detected),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send message right now.');
    } finally {
      window.clearTimeout(wakeUpTimer);
      setWakingUp(false);
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="overflow-hidden rounded-[28px] border border-border bg-white shadow-card">
        <img
          src={aiChatHeader}
          alt="CareLedger AI health companion with doctor and mobile healthcare app"
          className="h-44 w-full object-cover object-top sm:h-52 lg:h-64 xl:h-72"
        />
      </header>

      <div className="flex min-h-[620px] overflow-hidden rounded-[32px] border border-border bg-slate-50/70 shadow-card">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border bg-white px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                <SparklesIcon className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
              </div>
              <div>
                <h2 className="font-semibold text-heading">CareLedger AI Assistant</h2>
                <p className="text-xs text-muted">Online · Usually replies in a few seconds</p>
              </div>
            </div>
            <div className="hidden rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-primary sm:block">Private conversation</div>
          </div>

          <div ref={scrollAreaRef} className="flex min-h-[360px] flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-7">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message.content}
                isUser={message.role === 'user'}
                emergencyDetected={Boolean(message.emergencyDetected)}
                timestamp={message.timestamp}
              />
            ))}

            {messages.length === 1 ? (
              <div className="ml-12 grid max-w-2xl gap-2 sm:grid-cols-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setDraft(prompt)}
                    className="rounded-2xl border border-border bg-white px-4 py-3 text-left text-sm text-heading shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-teal-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {loading ? <TypingIndicator wakingUp={wakingUp} /> : null}
            <div ref={bottomRef} />
          </div>

          {error ? <div className="mx-4 mb-3 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical sm:mx-6">{error}</div> : null}

          {emergencyActive ? (
            <div className="mx-4 mb-3 flex flex-col gap-3 rounded-2xl border-2 border-critical bg-rose-50 px-4 py-4 text-sm text-rose-900 shadow-card sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold">This may be a medical emergency</div>
                <p className="mt-1 text-rose-800">Seek urgent medical care now or open Emergency Mode for immediate guidance.</p>
              </div>
              <Link
                to="/emergency"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-critical px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:opacity-90"
              >
                Emergency Mode
              </Link>
            </div>
          ) : null}

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
