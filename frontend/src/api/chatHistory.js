import { supabase } from '../lib/supabase';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export function makeChatTitle(message) {
  const clean = message.replace(/\s+/g, ' ').trim();
  return clean.length > 46 ? `${clean.slice(0, 43).trimEnd()}...` : clean;
}

export async function listChatSessions(userId) {
  const { data, error } = await requireClient().from('chat_sessions').select('id, title, created_at, updated_at').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function loadChatMessages(sessionId) {
  const { data, error } = await requireClient().from('chat_messages').select('id, role, content, emergency_detected, created_at').eq('session_id', sessionId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((message) => ({ id: message.id, role: message.role, content: message.content, emergencyDetected: message.emergency_detected, createdAt: message.created_at }));
}

export async function createChatSession(userId, firstMessage) {
  const { data, error } = await requireClient().from('chat_sessions').insert({ user_id: userId, title: makeChatTitle(firstMessage) }).select('id, title, created_at, updated_at').single();
  if (error) throw error;
  return data;
}

export async function saveChatMessage(sessionId, message) {
  const { data, error } = await requireClient().from('chat_messages').insert({ session_id: sessionId, role: message.role, content: message.content, emergency_detected: Boolean(message.emergencyDetected) }).select('id, created_at').single();
  if (error) throw error;
  return data;
}

export async function touchChatSession(sessionId) {
  const { error } = await requireClient().from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  if (error) throw error;
}

export async function deleteChatSession(sessionId) {
  const { error } = await requireClient().from('chat_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}
