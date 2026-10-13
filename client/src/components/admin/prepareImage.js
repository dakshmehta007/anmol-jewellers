// Phone photos are often 5 to 15 MB. Shrinking them in the browser before upload makes uploading fast on mobile data
// and keeps them under Cloudinary's 10 MB limit. If the browser can't read the photo, the original is returned unchanged.
const MAX_SIDE = 2000; // pixels on the longest side, plenty for a product photo
const SMALL = 1.5 * 1024 * 1024; // photos already smaller than this (and not huge in pixels) are left alone

export async function prepareImage(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file); // also applies the phone's rotation info
  } catch {
    return file;
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= SMALL) return file;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff"; // transparent PNG areas become white
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise((done) => canvas.toBlob(done, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return file; // never make a photo bigger
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}
