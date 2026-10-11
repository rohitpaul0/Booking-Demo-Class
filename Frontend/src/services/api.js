import axios from "axios";

// Single place where the backend base URL is configured.
// Value comes from Frontend/.env -> API_BASE_URL (see .env.example).
// The backend mounts its API under the "/api" prefix (no version segment).
const baseURL = import.meta.env.API_BASE_URL;

if (!baseURL) {
  // Warn without crashing so pages can still render; requests will fail loudly.
  console.warn(
    "API_BASE_URL is not configured. API requests cannot be sent until it is set."
  );
}

const api = axios.create({
  baseURL: baseURL || "",
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

export default api;
