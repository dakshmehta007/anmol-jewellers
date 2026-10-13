import { allowedOrigins } from "../config/origins.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

// In production, changes (POST/PUT/DELETE) are only accepted from your own website.
// This blocks other websites from making a logged-in visitor's browser change data (CSRF).
export function originCheck(req, res, next) {
  if (process.env.NODE_ENV !== "production" || SAFE.has(req.method)) return next();
  const origin = req.get("origin");
  if (origin && !allowedOrigins().includes(origin)) return res.status(403).json({ message: "Request blocked." });
  next();
}
