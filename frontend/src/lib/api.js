// Shared backend API base URL. uvicorn defaults to port 8000.
// Override locally by setting VITE_API_URL in frontend/.env
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() ||
  import.meta.env.VITE_BACKEND_URL?.trim() ||
  'http://localhost:8000';
