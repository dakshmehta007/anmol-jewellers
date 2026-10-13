// Metals, jewellery types and designs now live in the database. Manage them at /admin.
// This file only keeps two small helpers.

// Weights a customer can pick for a design, e.g. 5 to 10 g in steps of 1 g -> [5, 6, 7, 8, 9, 10]
export const weightOptions = ({ weightMin, weightMax, weightStep }) => {
  const step = weightStep > 0 ? weightStep : 1;
  const out = [];
  for (let w = weightMin; w <= weightMax + 1e-9; w += step)
    out.push(+w.toFixed(2));
  return out;
};

// Cloudinary sends a resized, compressed copy when width/format are added to the photo address.
// This keeps pages fast on mobile even if the original photo is large.
export const img = (url, width = 600) =>
  url && url.includes("/upload/")
    ? url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`)
    : url;
