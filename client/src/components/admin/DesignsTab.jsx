import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { img } from "../../data/catalog.js";
import ImageUploader from "./ImageUploader.jsx";

const EMPTY = { name: "", category: "", section: "", weightMin: "", weightMax: "", weightStep: "1", images: [], featured: false, active: true };

export default function DesignsTab({ cats, onChanged }) {
  const [filter, setFilter] = useState({ category: "", section: "" });
  const [list, setList] = useState({ designs: [], page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reload, setReload] = useState(0);
  const [moreBusy, setMoreBusy] = useState(false);

  const [form, setForm] = useState(null); // null = form closed
  const [formKey, setFormKey] = useState(0); // new key = fresh form (also moves the cursor to the name field)
  const [formErr, setFormErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const catName = (slug) => cats.find((c) => c.slug === slug)?.name ?? slug;
  const secName = (cat, slug) => cats.find((c) => c.slug === cat)?.sections.find((s) => s.slug === slug)?.name ?? slug;

  const params = (page) => {
    const p = new URLSearchParams({ page, limit: 20 });
    if (filter.category) p.set("category", filter.category);
    if (filter.section) p.set("section", filter.section);
    return p.toString();
  };

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setErr("");
    api(`/api/admin/designs?${params(1)}`)
      .then((d) => { if (!stale) { setList(d); setLoading(false); } })
      .catch((e) => { if (!stale) { setErr(e.message); setLoading(false); } });
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, reload]);

  const loadMore = async () => {
    setMoreBusy(true);
    try {
      const d = await api(`/api/admin/designs?${params(list.page + 1)}`);
      setList((l) => ({ ...d, designs: [...l.designs, ...d.designs.filter((x) => !l.designs.some((y) => y.id === x.id))] }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setMoreBusy(false);
    }
  };

  const openNew = () => {
    setMsg("");
    setFormErr("");
    setForm({ ...EMPTY, category: filter.category, section: filter.section });
    setFormKey((k) => k + 1);
  };

  const openEdit = (d) => {
    setMsg("");
    setFormErr("");
    setForm({
      id: d.id, name: d.name, category: d.category, section: d.section,
      weightMin: String(d.weightMin), weightMax: String(d.weightMax), weightStep: String(d.weightStep),
      images: d.images, featured: d.featured, active: d.active,
    });
    setFormKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setFormErr("");
    setMsg("");
    setSaving(true);
    const { id, ...rest } = form;
    const body = { ...rest, weightMin: Number(rest.weightMin), weightMax: Number(rest.weightMax), weightStep: Number(rest.weightStep) };
    try {
      if (id) await api(`/api/admin/designs/${id}`, { method: "PUT", body });
      else await api("/api/admin/designs", { method: "POST", body });
      setMsg(id ? "Design updated." : "Design added. The form is ready for the next one.");
      // After adding, keep metal, type and weights so the next design is quick to enter.
      setForm(id ? null : { ...EMPTY, category: form.category, section: form.section, weightMin: form.weightMin, weightMax: form.weightMax, weightStep: form.weightStep });
      setFormKey((k) => k + 1);
      setReload((n) => n + 1);
      onChanged();
    } catch (e2) {
      setFormErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.name}"? Its photos will be deleted too.`)) return;
    setErr("");
    setMsg("");
    try {
      await api(`/api/admin/designs/${d.id}`, { method: "DELETE" });
      setMsg(`Deleted "${d.name}".`);
      setReload((n) => n + 1);
      onChanged();
    } catch (e) {
      setErr(e.message);
    }
  };

  if (!cats.length)
    return <p className="muted">There are no metals yet. Open "Metals and types" and add one first.</p>;

  const formSections = cats.find((c) => c.slug === form?.category)?.sections ?? [];
  const filterSections = cats.find((c) => c.slug === filter.category)?.sections ?? [];

  return (
    <div className="adm">
      <div className="adm-bar">
        <label className="field">Metal
          <select value={filter.category} onChange={(e) => setFilter({ category: e.target.value, section: "" })}>
            <option value="">All metals</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="field">Jewellery type
          <select value={filter.section} disabled={!filter.category} onChange={(e) => setFilter((f) => ({ ...f, section: e.target.value }))}>
            <option value="">All types</option>
            {filterSections.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </label>
        <button className="btn" onClick={openNew}>Add design</button>
      </div>

      {msg && <p className="ok" role="status">{msg}</p>}

      {form && (
        <form className="adm-form" key={formKey} onSubmit={save}>
          <h2>{form.id ? "Edit design" : "Add a design"}</h2>
          <label className="field">Design name
            <input value={form.name} onChange={set("name")} maxLength={120} required autoFocus placeholder="For example: Plain band ring" />
          </label>
          <div className="two">
            <label className="field">Metal
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, section: "" }))} required>
                <option value="">Choose metal</option>
                {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="field">Jewellery type
              <select value={form.section} onChange={set("section")} required disabled={!form.category}>
                <option value="">Choose type</option>
                {formSections.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <div className="two">
            <label className="field">Lightest weight (g)
              <input type="number" inputMode="decimal" min="0.01" step="any" value={form.weightMin} onChange={set("weightMin")} required />
            </label>
            <label className="field">Heaviest weight (g)
              <input type="number" inputMode="decimal" min="0.01" step="any" value={form.weightMax} onChange={set("weightMax")} required />
            </label>
            <label className="field">Step between weights (g)
              <input type="number" inputMode="decimal" min="0.01" step="any" value={form.weightStep} onChange={set("weightStep")} required />
            </label>
          </div>
          <p className="muted">Customers pick a weight from the lightest to the heaviest, in these steps. For a single fixed weight, enter the same number in both boxes.</p>
          <div className="field">Photos
            <ImageUploader images={form.images} setImages={(fn) => setForm((f) => ({ ...f, images: fn(f.images) }))} onBusy={setUploading} />
          </div>
          <label className="check"><input type="checkbox" checked={form.featured} onChange={set("featured")} /> Show in Popular designs on the home page</label>
          <label className="check"><input type="checkbox" checked={form.active} onChange={set("active")} /> Visible to customers</label>
          {formErr && <p className="err" role="alert">{formErr}</p>}
          <div className="adm-actions">
            <button className="btn" disabled={saving || uploading}>{saving ? "Saving..." : uploading ? "Uploading photos..." : form.id ? "Save changes" : "Add design"}</button>
            <button type="button" className="btn" onClick={() => setForm(null)} disabled={saving}>Close</button>
          </div>
        </form>
      )}

      {err && <p className="err" role="alert">{err}</p>}
      {loading && <p className="muted">Loading designs...</p>}
      {!loading && !err && list.designs.length === 0 && (
        <p className="muted">No designs here yet. Press "Add design" to add the first one.</p>
      )}
      <ul className="adm-list">
        {list.designs.map((d) => (
          <li key={d.id} className="adm-row">
            <div className="adm-thumb" role="img" aria-label={d.name}
                 style={d.images[0] ? { backgroundImage: `url(${img(d.images[0].url, 120)})` } : undefined} />
            <div className="adm-grow">
              <strong>{d.name}</strong>
              <div className="muted">
                {catName(d.category)} / {secName(d.category, d.section)}, {d.weightMin === d.weightMax ? `${d.weightMin} g` : `${d.weightMin} to ${d.weightMax} g`}
              </div>
            </div>
            {d.featured && <span className="badge">Popular</span>}
            {!d.active && <span className="badge">Hidden</span>}
            <button className="btn sm" onClick={() => openEdit(d)}>Edit</button>
            <button className="btn sm danger" onClick={() => remove(d)}>Delete</button>
          </li>
        ))}
      </ul>
      {!loading && list.page < list.pages && (
        <div><button className="btn" onClick={loadMore} disabled={moreBusy}>{moreBusy ? "Loading..." : "Show more"}</button></div>
      )}
      {!loading && list.total > 0 && <p className="muted">{list.designs.length} of {list.total} designs shown</p>}
    </div>
  );
}
