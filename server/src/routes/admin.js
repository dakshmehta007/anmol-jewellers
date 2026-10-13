import { Router } from "express";
import { z } from "zod";
import Category from "../models/Category.js";
import Design from "../models/Design.js";
import Selection from "../models/Selection.js";
import { requireAdmin } from "../middleware/auth.js";
import { cloud, cloudinaryReady, UPLOAD_FOLDER } from "../config/cloudinary.js";
import { clearCatalogCache } from "./catalog.js";
import { slugify } from "../utils/slug.js";

// Everything here is for the shop owner only.
const router = Router();
router.use(requireAdmin);

const bad = (res, message, status = 400) => res.status(status).json({ message });
const byOrder = (a, b) => a.order - b.order || a.name.localeCompare(b.name);

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const pages = (total, limit) => Math.max(1, Math.ceil(total / limit));

/* ───────────── Metals (categories) and jewellery types (sections) ───────────── */

const nameField = z.string().trim().min(1, "Please enter a name").max(60, "That name is too long");
const newThing = z.object({ name: nameField, slug: z.string().trim().max(60).optional() });
const linkNameHelp = "Please type a web link name in English letters or numbers (for example: kada).";

router.get("/categories", async (req, res) => {
  const [cats, counts] = await Promise.all([
    Category.find().lean(),
    Design.aggregate([{ $group: { _id: { c: "$category", s: "$section" }, n: { $sum: 1 } } }]),
  ]);
  const n = new Map(counts.map((x) => [`${x._id.c}/${x._id.s}`, x.n]));
  const categories = cats.sort(byOrder).map((c) => {
    const sections = [...c.sections]
      .sort(byOrder)
      .map((s) => ({ slug: s.slug, name: s.name, active: s.active, count: n.get(`${c.slug}/${s.slug}`) || 0 }));
    return {
      slug: c.slug,
      name: c.name,
      blurb: c.blurb,
      active: c.active,
      count: sections.reduce((t, s) => t + s.count, 0),
      sections,
    };
  });
  res.json({ categories });
});

router.post("/categories", async (req, res) => {
  const data = newThing.extend({ blurb: z.string().trim().max(200).default("") }).parse(req.body);
  const slug = slugify(data.slug || data.name);
  if (!slug) return bad(res, linkNameHelp);
  if (await Category.exists({ slug })) return bad(res, "A metal with this web link name already exists.", 409);
  const last = await Category.findOne().sort({ order: -1 }).select("order").lean();
  const category = await Category.create({ slug, name: data.name, blurb: data.blurb, order: last ? last.order + 1 : 0 });
  clearCatalogCache();
  res.status(201).json({ category });
});

router.put("/categories/:slug", async (req, res) => {
  const data = z
    .object({ name: nameField.optional(), blurb: z.string().trim().max(200).optional(), active: z.boolean().optional() })
    .parse(req.body);
  const category = await Category.findOneAndUpdate({ slug: req.params.slug }, { $set: data }, { new: true, runValidators: true });
  if (!category) return bad(res, "Metal not found.", 404);
  clearCatalogCache();
  res.json({ category });
});

router.delete("/categories/:slug", async (req, res) => {
  const n = await Design.countDocuments({ category: req.params.slug });
  if (n) return bad(res, `This metal still has ${n} design${n === 1 ? "" : "s"}. Delete them first, or hide the metal instead.`, 409);
  const r = await Category.deleteOne({ slug: req.params.slug });
  if (!r.deletedCount) return bad(res, "Metal not found.", 404);
  clearCatalogCache();
  res.json({ ok: true });
});

router.post("/categories/:slug/sections", async (req, res) => {
  const data = newThing.parse(req.body);
  const slug = slugify(data.slug || data.name);
  if (!slug) return bad(res, linkNameHelp);
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return bad(res, "Metal not found.", 404);
  if (category.sections.some((s) => s.slug === slug)) return bad(res, "This metal already has a type with that web link name.", 409);
  const order = category.sections.reduce((m, s) => Math.max(m, s.order), -1) + 1;
  category.sections.push({ slug, name: data.name, order });
  await category.save();
  clearCatalogCache();
  res.status(201).json({ ok: true });
});

router.put("/categories/:slug/sections/:section", async (req, res) => {
  const data = z.object({ name: nameField.optional(), active: z.boolean().optional() }).parse(req.body);
  const category = await Category.findOne({ slug: req.params.slug });
  const section = category?.sections.find((s) => s.slug === req.params.section);
  if (!section) return bad(res, "Jewellery type not found.", 404);
  if (data.name !== undefined) section.name = data.name;
  if (data.active !== undefined) section.active = data.active;
  await category.save();
  clearCatalogCache();
  res.json({ ok: true });
});

router.delete("/categories/:slug/sections/:section", async (req, res) => {
  const n = await Design.countDocuments({ category: req.params.slug, section: req.params.section });
  if (n) return bad(res, `This type still has ${n} design${n === 1 ? "" : "s"}. Delete them first, or hide the type instead.`, 409);
  const r = await Category.updateOne({ slug: req.params.slug }, { $pull: { sections: { slug: req.params.section } } });
  if (!r.modifiedCount) return bad(res, "Jewellery type not found.", 404);
  clearCatalogCache();
  res.json({ ok: true });
});

/* ───────────── Designs ───────────── */

const cloudPrefix = () => `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;

const designBody = z
  .object({
    name: z.string().trim().min(1, "Please enter a design name").max(120),
    category: z.string().trim().min(1, "Please choose a metal").max(60),
    section: z.string().trim().min(1, "Please choose a jewellery type").max(60),
    weightMin: z.coerce.number({ invalid_type_error: "Enter the minimum weight" }).positive("Minimum weight must be more than 0").max(10000),
    weightMax: z.coerce.number({ invalid_type_error: "Enter the maximum weight" }).positive("Maximum weight must be more than 0").max(10000),
    weightStep: z.coerce.number().positive("Weight step must be more than 0").max(1000).default(1),
    images: z
      .array(z.object({ url: z.string().url().max(500), publicId: z.string().max(200) }))
      .max(8, "Up to 8 photos per design")
      .default([]),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .superRefine((d, ctx) => {
    if (d.weightMax < d.weightMin)
      ctx.addIssue({ code: "custom", path: ["weightMax"], message: "Maximum weight must be at least the minimum weight" });
    if ((d.weightMax - d.weightMin) / d.weightStep > 200)
      ctx.addIssue({ code: "custom", path: ["weightStep"], message: "Too many weight options. Use a bigger step (for example 1 g)." });
    // Photos must come from our own Cloudinary folder (uploaded through the admin panel).
    if (d.images.some((i) => !i.url.startsWith(cloudPrefix()) || !i.publicId.startsWith(`${UPLOAD_FOLDER}/`)))
      ctx.addIssue({ code: "custom", path: ["images"], message: "Photos must be uploaded through the admin panel." });
  });

const sectionExists = (category, section) => Category.exists({ slug: category, "sections.slug": section });

async function destroyImages(images) {
  if (!images.length || !cloudinaryReady()) return;
  await Promise.allSettled(images.map((i) => cloud().uploader.destroy(i.publicId)));
}

router.get("/designs", async (req, res) => {
  const q = pageQuery
    .extend({ category: z.string().trim().max(60).optional(), section: z.string().trim().max(60).optional() })
    .parse(req.query);
  const filter = {};
  if (q.category) filter.category = q.category;
  if (q.section) filter.section = q.section;
  const [designs, total] = await Promise.all([
    Design.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
    Design.countDocuments(filter),
  ]);
  res.json({ designs, page: q.page, pages: pages(total, q.limit), total });
});

router.post("/designs", async (req, res) => {
  const data = designBody.parse(req.body);
  if (!(await sectionExists(data.category, data.section)))
    return bad(res, "That metal or jewellery type does not exist. Create it under Metals and types first.");
  const design = await Design.create(data);
  clearCatalogCache();
  res.status(201).json({ design });
});

router.put("/designs/:id", async (req, res) => {
  const data = designBody.parse(req.body);
  if (!(await sectionExists(data.category, data.section)))
    return bad(res, "That metal or jewellery type does not exist. Create it under Metals and types first.");
  const design = await Design.findById(req.params.id);
  if (!design) return bad(res, "Design not found.", 404);
  const keep = new Set(data.images.map((i) => i.publicId));
  const removed = design.images.filter((i) => !keep.has(i.publicId));
  design.set(data);
  await design.save();
  await destroyImages(removed); // photos taken off this design are deleted from Cloudinary
  clearCatalogCache();
  res.json({ design });
});

router.delete("/designs/:id", async (req, res) => {
  const design = await Design.findByIdAndDelete(req.params.id);
  if (!design) return bad(res, "Design not found.", 404);
  await destroyImages(design.images);
  clearCatalogCache();
  res.json({ ok: true });
});

/* ───────────── Photo uploads ───────────── */

// The browser uploads photos straight to Cloudinary. We only sign the request, so the secret never leaves the server.
router.post("/upload-signature", (req, res) => {
  if (!cloudinaryReady())
    return bad(res, "Photo storage is not set up yet. Add the CLOUDINARY_ values to server/.env and restart the server.", 503);
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloud().utils.api_sign_request({ folder: UPLOAD_FOLDER, timestamp }, process.env.CLOUDINARY_API_SECRET);
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: UPLOAD_FOLDER,
    timestamp,
    signature,
  });
});

/* ───────────── Customer selections ───────────── */

router.get("/selections", async (req, res) => {
  const q = pageQuery.parse(req.query);
  const [rows, total] = await Promise.all([
    Selection.find()
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .populate("user", "name email phone")
      .lean(),
    Selection.countDocuments(),
  ]);
  const selections = rows.map((r) => ({
    id: String(r._id),
    designName: r.designName,
    weight: r.weight,
    source: r.source || "",
    createdAt: r.createdAt,
    user: r.user ? { name: r.user.name, email: r.user.email, phone: r.user.phone || "" } : null,
  }));
  res.json({ selections, page: q.page, pages: pages(total, q.limit), total });
});

export default router;
