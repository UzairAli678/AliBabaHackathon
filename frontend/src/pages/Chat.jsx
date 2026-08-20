import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, ChevronLeftIcon, ChevronRightIcon, PaperAirplaneIcon, PlusIcon, ShieldCheckIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import ChatBubble from '../components/ChatBubble';
import { sendChatMessage } from '../api/chat';
import { createChatSession, deleteChatSession, listChatSessions, loadChatMessages, saveChatMessage, touchChatSession } from '../api/chatHistory';
import { useAuth } from '../context/AuthContext';

const displayTime = (value) => new Intl.DateTimeFormat([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const messageTime = (value) => new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

function TypingIndicator({ wakingUp }) {
  return <div className="flex items-start gap-3"><div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-soft"><SparklesIcon className="h-4 w-4" /></div><div><div className="mb-1 text-xs font-medium text-primary">CareLedger AI</div><div className="rounded-[22px] rounded-tl-md border border-border bg-white px-5 py-4 shadow-card"><div className="flex gap-1.5"><span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" /><span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" /><span className="chat-typing-dot h-2.5 w-2.5 rounded-full bg-primary/50" /></div></div><span className="mt-1 block text-xs text-muted">{wakingUp ? 'The secure service is waking up. This can take up to a minute...' : 'Thinking...'}</span></div></div>;
}

export default function ChatPage() {
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '').trim().split(/\s+/)[0];
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [wakingUp, setWakingUp] = useState(false);
  const [error, setError] = useState('');
  const [persistenceWarning, setPersistenceWarning] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    let live = true;
    listChatSessions(user.id).then((items) => { if (live) setSessions(items); }).catch(() => { if (live) setError('Chat history could not be loaded. Please confirm the Supabase chat migration has been applied.'); }).finally(() => { if (live) setHistoryLoading(false); });
    return () => { live = false; };
  }, [user?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);

  const startNewChat = () => {
    if (loading) return;
    setActiveSession(null); setMessages([]); setDraft(''); setError(''); setPersistenceWarning(''); setHistoryOpen(false);
  };

  const openSession = async (session) => {
    if (loading) return;
    setError(''); setHistoryLoading(true);
    try { setMessages(await loadChatMessages(session.id)); setActiveSession(session); setHistoryOpen(false); }
    catch { setError('This conversation could not be loaded. Please try again.'); }
    finally { setHistoryLoading(false); }
  };

  const removeSession = async (event, session) => {
    event.stopPropagation();
    if (loading) return;
    try {
      await deleteChatSession(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      if (activeSession?.id === session.id) startNewChat();
    } catch { setError('The conversation could not be deleted. Please try again.'); }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || loading || !user?.id) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    const optimisticUser = { id: `user-${Date.now()}`, role: 'user', content: text, createdAt: new Date().toISOString() };
    setDraft(''); setLoading(true); setError(''); setPersistenceWarning(''); setMessages((current) => [...current, optimisticUser]);
    const wakeUpTimer = window.setTimeout(() => setWakingUp(true), 8000);
    try {
      let session = activeSession;
      try {
        if (!session) {
          session = await createChatSession(user.id, text);
          setActiveSession(session); setSessions((current) => [session, ...current]);
        }
        const savedUser = await saveChatMessage(session.id, optimisticUser);
        setMessages((current) => current.map((item) => item.id === optimisticUser.id ? { ...item, id: savedUser.id, createdAt: savedUser.created_at } : item));
      } catch (historyError) {
        console.error('Chat backup failed before AI request:', historyError);
        setPersistenceWarning('Your message was sent, but chat backup is unavailable. Apply the Supabase chat migration to restore history.');
        session = null;
      }
      const response = await sendChatMessage(text, history, firstName);
      const assistant = { role: 'assistant', content: response.reply, emergencyDetected: Boolean(response.emergency_detected) };
      const localAssistant = { ...assistant, id: `assistant-${Date.now()}`, createdAt: new Date().toISOString() };
      setMessages((current) => [...current, localAssistant]);
      if (session) {
        try {
          const savedAssistant = await saveChatMessage(session.id, assistant);
          setMessages((current) => current.map((item) => item.id === localAssistant.id ? { ...item, id: savedAssistant.id, createdAt: savedAssistant.created_at } : item));
          await touchChatSession(session.id);
          const updatedAt = new Date().toISOString();
          setSessions((current) => current.map((item) => item.id === session.id ? { ...item, updated_at: updatedAt } : item).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
        } catch (historyError) {
          console.error('Chat backup failed after AI response:', historyError);
          setPersistenceWarning('The reply arrived, but it could not be backed up to chat history.');
        }
      }
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to send message right now.'); }
    finally { window.clearTimeout(wakeUpTimer); setWakingUp(false); setLoading(false); }
  };

  const emergencyActive = messages.some((message) => message.emergencyDetected);
  const sidebar = <aside className={`flex h-full shrink-0 flex-col border-r border-white/20 bg-primary text-white shadow-2xl transition-[width] duration-300 ${historyCollapsed ? 'w-[72px]' : 'w-72'}`}>
    <div className="flex items-center gap-2 border-b border-white/20 p-3"><button type="button" onClick={startNewChat} className={`flex h-11 flex-1 items-center rounded-xl bg-white/15 text-sm font-semibold text-white shadow-lg shadow-teal-950/20 ring-1 ring-white/10 transition hover:bg-white/25 ${historyCollapsed ? 'justify-center px-0' : 'gap-2 px-4'}`} title="New Chat"><PlusIcon className="h-5 w-5 shrink-0" /><span className={historyCollapsed ? 'hidden' : ''}>New Chat</span></button>{!historyCollapsed && <button type="button" onClick={() => setHistoryCollapsed(true)} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/15 hover:text-white lg:flex" aria-label="Collapse chat history"><ChevronLeftIcon className="h-4 w-4" /></button>}</div>
    {historyCollapsed ? <button type="button" onClick={() => setHistoryCollapsed(false)} className="mx-auto mt-3 hidden h-10 w-10 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/15 hover:text-white lg:flex" aria-label="Expand chat history"><ChevronRightIcon className="h-4 w-4" /></button> : <div className="min-h-0 flex-1 overflow-y-auto p-3"><p className="px-2 pb-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Conversations</p>{historyLoading && sessions.length === 0 ? <p className="px-2 py-5 text-sm text-white/70">Loading history...</p> : null}{!historyLoading && sessions.length === 0 ? <p className="px-2 py-5 text-sm leading-6 text-white/70">Your conversations will appear here after you send a message.</p> : null}<div className="space-y-1.5">{sessions.map((session) => <button key={session.id} type="button" onClick={() => openSession(session)} className={`group flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left transition ${activeSession?.id === session.id ? 'bg-white/20 text-white shadow-sm' : 'text-white/85 hover:bg-white/15 hover:text-white'}`}><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{session.title}</span><span className="mt-1.5 block text-[11px] text-white/65">{displayTime(session.updated_at)}</span></span><span role="button" tabIndex={0} onClick={(event) => removeSession(event, session)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') removeSession(event, session); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 opacity-0 transition hover:bg-white/20 hover:text-rose-100 group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${session.title}`}><TrashIcon className="h-4 w-4" /></span></button>)}</div></div>}
  </aside>;

  return <section className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 lg:-my-8"><div className="flex h-[calc(100vh-88px)] min-h-[620px] overflow-hidden border-t border-slate-200 bg-slate-50/70">
      <div className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${historyOpen ? 'w-72' : 'w-0'} lg:w-auto`}>{sidebar}</div>
      <div className="relative flex min-w-0 flex-1 flex-col">
      <button type="button" onClick={() => setHistoryOpen((current) => !current)} className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-heading shadow-sm transition hover:border-primary/30 hover:bg-teal-50 lg:hidden" aria-label={historyOpen ? 'Close chat history' : 'Open chat history'} aria-expanded={historyOpen}><Bars3Icon className="h-5 w-5" /></button>
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-16 sm:px-7 lg:pt-8"><div className="mx-auto flex min-h-full max-w-4xl flex-col">{messages.length === 0 && !historyLoading ? <div className="flex flex-1 flex-col items-center justify-center pb-12 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-primary ring-1 ring-primary/10"><SparklesIcon className="h-7 w-7" /></div><h1 className="mt-5 text-xl font-semibold text-heading">How can I help with your health today?</h1><p className="mt-2 max-w-md text-sm leading-6 text-muted">Ask about symptoms, medications, specialists, or the next step in your care.</p></div> : <div className="space-y-6">{messages.map((message) => <ChatBubble key={message.id} message={message.content} isUser={message.role === 'user'} emergencyDetected={Boolean(message.emergencyDetected)} timestamp={message.createdAt ? messageTime(message.createdAt) : ''} />)}{loading ? <TypingIndicator wakingUp={wakingUp} /> : null}</div>}<div ref={bottomRef} /></div></main>
      {error ? <div className="mx-4 mb-3 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical sm:mx-6">{error}</div> : null}
      {persistenceWarning ? <div className="mx-4 mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:mx-6">{persistenceWarning}</div> : null}
      {emergencyActive ? <div className="mx-4 mb-3 flex flex-col gap-3 rounded-2xl border-2 border-critical bg-rose-50 px-4 py-4 text-sm text-rose-900 shadow-card sm:mx-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold">This may be a medical emergency</div><p className="mt-1 text-rose-800">Seek urgent medical care now or open Emergency Mode for immediate guidance.</p></div><Link to="/emergency" className="inline-flex shrink-0 items-center justify-center rounded-full bg-critical px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:opacity-90">Emergency Mode</Link></div> : null}
      <div className="border-t border-border bg-white/95 px-4 py-4 backdrop-blur sm:px-6"><form onSubmit={handleSubmit} className="mx-auto max-w-4xl rounded-[24px] border border-border bg-white p-2 shadow-[0_12px_35px_-18px_rgba(15,23,42,0.3)] focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10"><div className="flex items-end gap-3"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); if (!loading && draft.trim()) handleSubmit(event); } }} placeholder="Ask me anything about your health" rows={1} className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-heading outline-none placeholder:text-muted/70" /><button type="submit" disabled={loading || !draft.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"><PaperAirplaneIcon className="h-4 w-4" /><span className="hidden sm:inline">Send</span></button></div></form><div className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted"><ShieldCheckIcon className="h-3.5 w-3.5" />{loading ? 'Preparing your response...' : 'CareLedger AI can make mistakes. Verify important medical information.'}</div></div>
      </div>
  </div></section>;
}
