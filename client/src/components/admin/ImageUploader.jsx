import { useRef, useState } from "react";
import { api } from "../../api.js";
import { img } from "../../data/catalog.js";
import { prepareImage } from "./prepareImage.js";

const MAX_MB = 10; // Cloudinary's free plan accepts photos up to 10 MB (after shrinking, phone photos are far below this)

// Photos go straight from the browser to Cloudinary. Our server only signs the upload.
// `images` is the list of { url, publicId }; the first one is the cover photo.
// `setImages` takes a function: setImages((current) => newList)
// Note: photos uploaded and then removed before the design is saved stay in Cloudinary (a few KB of storage).
export default function ImageUploader({ images, setImages, onBusy, max = 8 }) {
  const input = useRef(null);
  const [busy, setBusyState] = useState(false);
  const [err, setErr] = useState("");

  const setBusy = (b) => {
    setBusyState(b);
    onBusy?.(b);
  };

  const upload = async (fileList) => {
    setErr("");
    const files = [...fileList].slice(0, Math.max(0, max - images.length));
    if (!files.length) return setErr(`You can add up to ${max} photos.`);
    setBusy(true);
    const added = [];
    try {
      const ready = [];
      for (const f of files) {
        if (!f.type.startsWith("image/")) throw new Error(`${f.name} is not a photo.`);
        const p = await prepareImage(f); // shrinks big phone photos
        if (p.size > MAX_MB * 1024 * 1024) throw new Error(`${f.name} is bigger than ${MAX_MB} MB. Please choose a smaller photo.`);
        ready.push({ name: f.name, file: p });
      }
      const sig = await api("/api/admin/upload-signature", { method: "POST" });
      for (const { name, file } of ready) {
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", sig.apiKey);
        body.append("timestamp", sig.timestamp);
        body.append("folder", sig.folder);
        body.append("signature", sig.signature);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error?.message || `Could not upload ${name}.`);
        added.push({ url: data.secure_url, publicId: data.public_id });
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      if (added.length) setImages((cur) => [...cur, ...added]);
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = (i) => setImages((cur) => cur.filter((_, k) => k !== i));
  const makeCover = (i) => setImages((cur) => [cur[i], ...cur.filter((_, k) => k !== i)]);

  return (
    <div>
      <div className="up">
        {images.map((p, i) => (
          <div className="up-item" key={p.publicId}>
            <div className="adm-thumb" role="img" aria-label={`Photo ${i + 1}`} style={{ backgroundImage: `url(${img(p.url, 200)})` }} />
            {i === 0 ? <span className="badge">Cover</span> : (
              <button type="button" className="linkbtn u" onClick={() => makeCover(i)} disabled={busy}>Make cover</button>
            )}
            <button type="button" className="linkbtn u" onClick={() => remove(i)} disabled={busy}>Remove</button>
          </div>
        ))}
      </div>
      {images.length < max && (
        <label className="btn sm up-btn">
          {busy ? "Uploading..." : images.length ? "Add more photos" : "Add photos"}
          <input ref={input} type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => upload(e.target.files)} />
        </label>
      )}
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}
