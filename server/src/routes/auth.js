import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import User from "../models/User.js";
import { readToken, setAuthCookie, clearAuthCookie } from "../middleware/auth.js";

const router = Router();

// zod checks types too, so objects like {"$ne": ""} can't be smuggled in as an email (NoSQL injection).
const email = z.string().trim().toLowerCase().email("Please enter a valid email").max(120);
const signupSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email,
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(20).optional(),
});
const loginSchema = z.object({ email, password: z.string().min(1, "Please enter your password").max(72) });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });

router.post("/signup", async (req, res) => {
  const data = signupSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  try {
    const user = await User.create({ name: data.name, email: data.email, phone: data.phone, passwordHash });
    setAuthCookie(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "An account with this email already exists. Please log in." });
    throw e;
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) return res.status(401).json({ message: "Incorrect email or password." });
  setAuthCookie(res, user);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// Used by the website on every page load to find out whether someone is logged in.
router.get("/me", async (req, res) => {
  const t = readToken(req);
  if (!t) return res.json({ user: null });
  const user = await User.findById(t.id);
  if (!user) {
    clearAuthCookie(res);
    return res.json({ user: null });
  }
  res.json({ user: publicUser(user) });
});

export default router;
