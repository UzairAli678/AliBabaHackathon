// Legacy Expo scaffold API configuration. Expo deployments should expose the
// same backend value as EXPO_PUBLIC_API_BASE_URL.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');
