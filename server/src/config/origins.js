// Website addresses allowed to call this API (CLIENT_ORIGIN in .env, comma separated).
export const allowedOrigins = () =>
  (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean);
