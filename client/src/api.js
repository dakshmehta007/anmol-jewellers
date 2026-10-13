// In development, requests go through the Vite proxy. When the API is on another domain, set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || "";

export async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    credentials: "include", // sends the login cookie
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(data.message || "Something went wrong. Please try again.");
  return data;
}
