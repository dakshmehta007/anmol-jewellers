import { Router } from "express";
import { z } from "zod";
import Category from "../models/Category.js";
import Design from "../models/Design.js";

// Public routes: what customers see.
const router = Router();

const byOrder = (a, b) => a.order - b.order || a.name.localeCompare(b.name);

// The catalog (metals and types) rarely changes, so it is kept in memory for a minute.
// Every admin change clears it (clearCatalogCache) so edits show up immediately.
const TTL = 60_000;
let cache = null;
export const clearCatalogCache = () => {
  cache = null;
};

async function buildCatalog() {
  const [cats, covers] = await Promise.all([
    Category.find({ active: { $ne: false } }).lean(),
    // Newest design photo in each type becomes that type's tile picture automatically.
    Design.aggregate([
      { $match: { active: true, "images.0": { $exists: true } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: { c: "$category", s: "$section" }, image: { $first: { $arrayElemAt: ["$images.url", 0] } } } },
    ]),
  ]);
  const cover = new Map(covers.map((x) => [`${x._id.c}/${x._id.s}`, x.image]));
  return cats.sort(byOrder).map((c) => ({
    id: c.slug,
    name: c.name,
    blurb: c.blurb,
    sections: c.sections
      .filter((s) => s.active !== false)
      .sort(byOrder)
      .map((s) => ({ id: s.slug, name: s.name, image: cover.get(`${c.slug}/${s.slug}`) || null })),
  }));
}

async function getCatalog() {
  if (!cache || Date.now() - cache.at > TTL) cache = { at: Date.now(), data: await buildCatalog() };
  return cache.data;
}

router.get("/catalog", async (req, res) => {
  res.json({ categories: await getCatalog() });
});

const listQuery = z.object({
  category: z.string().trim().max(60).optional(),
  section: z.string().trim().max(60).optional(),
  featured: z.enum(["true"]).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

router.get("/designs", async (req, res) => {
  const q = listQuery.parse(req.query);
  // Only designs inside metals/types that are currently shown in the shop. Without this, hiding a metal or type
  // in the admin panel would still leave its designs visible (for example under "Popular designs" on the home page).
  const allowed = (await getCatalog())
    .flatMap((c) => c.sections.map((s) => ({ category: c.id, section: s.id })))
    .filter((v) => (!q.category || v.category === q.category) && (!q.section || v.section === q.section));
  if (!allowed.length) return res.json({ designs: [], page: q.page, pages: 1, total: 0 });
  const filter = { active: true, $or: allowed };
  if (q.featured) filter.featured = true;
  const [designs, total] = await Promise.all([
    Design.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
    Design.countDocuments(filter),
  ]);
  res.json({ designs, page: q.page, pages: Math.max(1, Math.ceil(total / q.limit)), total });
});

export default router;
