import { API_BASE_URL as backendBaseUrl } from '../lib/api';

export async function sendChatMessage(message, conversationHistory, userName = '') {
  const response = await fetch(`${backendBaseUrl}/ai-chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      message,
      conversation_history: conversationHistory,
      user_name: userName || null
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || 'Unable to send chat message.');
  }

  return data;
}
