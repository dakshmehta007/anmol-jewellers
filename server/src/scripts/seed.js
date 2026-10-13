// Run once: npm run seed. Creates the starting metals and jewellery types. Safe to re-run (never overwrites).
import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import { slugify } from "../utils/slug.js";

const DATA = [
  ["Gold", "Bridal and everyday gold, from rings to mangalsutra.", ["Ring", "Mangalsutra", "Gems Ring", "Boys Ring", "Chain", "Bracelet", "Earrings"]],
  ["Silver", "Light silver jewellery for daily wear and gifting.", ["Ring", "Chain", "Bracelet", "Payal", "Kada", "Earrings"]],
  ["Italian Silver", "Bright, mirror-polished Italian silver designs.", ["Ring", "Chain", "Bracelet", "Pendant", "Earrings"]],
];

await mongoose.connect(process.env.MONGODB_URI);
for (const [i, [name, blurb, types]] of DATA.entries()) {
  const sections = types.map((t, j) => ({ slug: slugify(t), name: t, order: j, active: true }));
  const r = await Category.updateOne({ slug: slugify(name) }, { $setOnInsert: { name, blurb, order: i, active: true, sections } }, { upsert: true });
  console.log(`${name}: ${r.upsertedCount ? "created" : "already exists, left as is"}`);
}
await mongoose.disconnect();
