// "Gems Ring" -> "gems-ring". Used for web addresses like /collection/gold/gems-ring
export const slugify = (s = "") =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
