// Shared backend API base URL. uvicorn defaults to port 8000.
// Override for deployments by setting VITE_API_BASE_URL in the build environment.
const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://careledgerai.onrender.com'
  : 'http://127.0.0.1:8000';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '') || defaultApiBaseUrl;
