import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const COOKIE = "aj_token";
const isProd = process.env.NODE_ENV === "production";
// httpOnly: JavaScript in the browser can't read the token. secure + sameSite none: needed when site and API are on different domains.
const opts = { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "lax", path: "/" };

export const setAuthCookie = (res, user) => {
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE, token, { ...opts, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const clearAuthCookie = (res) => res.clearCookie(COOKIE, opts);

export const readToken = (req) => {
  try {
    const p = jwt.verify(req.cookies?.[COOKIE], process.env.JWT_SECRET);
    return { id: p.sub, role: p.role };
  } catch {
    return null;
  }
};

export const requireAuth = (req, res, next) => {
  const u = readToken(req);
  if (!u) return res.status(401).json({ message: "Please log in to continue." });
  req.user = u;
  next();
};

// Admin check reads the role from the database on every request (not from the login token),
// so removing someone's admin role takes effect immediately.
export const requireAdmin = async (req, res, next) => {
  const t = readToken(req);
  if (!t) return res.status(401).json({ message: "Please log in to continue." });
  const user = await User.findById(t.id).select("role");
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Admins only." });
  req.user = { id: user.id, role: user.role };
  next();
};
