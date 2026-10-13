import { Router } from "express";
import { z } from "zod";
import Selection from "../models/Selection.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  designId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  designName: z.string().trim().min(1).max(120),
  weight: z.number().positive().max(10000),
  source: z.string().trim().max(80).optional(),
});

router.post("/", async (req, res) => {
  const { designId, ...data } = schema.parse(req.body);
  const selection = await Selection.create({ ...data, design: designId, user: req.user.id });
  res.status(201).json({ selection });
});

router.get("/", async (req, res) => {
  const selections = await Selection.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
  res.json({ selections });
});

export default router;
