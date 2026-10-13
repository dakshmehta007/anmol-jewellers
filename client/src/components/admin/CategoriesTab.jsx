import { useState } from "react";
import { api } from "../../api.js";

// Add and rename metals and jewellery types. New ones show up on the shop pages straight away.
export default function CategoriesTab({ cats, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Runs one change, then refreshes the lists. Returns true if it worked.
  const run = async (fn) => {
    setErr("");
    setBusy(true);
    try {
      await fn();
      await onChanged();
      return true;
    } catch (e) {
      setErr(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm">
      {err && <p className="err" role="alert">{err}</p>}
      {cats.map((c) => <CategoryCard key={c.slug} cat={c} run={run} busy={busy} />)}
      <AddCategory run={run} busy={busy} />
    </div>
  );
}

function CategoryCard({ cat, run, busy }) {
  const [name, setName] = useState(cat.name);
  const [blurb, setBlurb] = useState(cat.blurb);
  const url = `/api/admin/categories/${cat.slug}`;
  const changed = name.trim() !== cat.name || blurb.trim() !== cat.blurb;

  return (
    <div className="adm-form">
      <div className="adm-row">
        <label className="field adm-grow">Metal name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        <label className="field adm-grow">Short description
          <input value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={200} />
        </label>
        {changed && <button className="btn sm" disabled={busy} onClick={() => run(() => api(url, { method: "PUT", body: { name, blurb } }))}>Save</button>}
        <button className="btn sm" disabled={busy} onClick={() => run(() => api(url, { method: "PUT", body: { active: !cat.active } }))}>
          {cat.active ? "Hide from shop" : "Show in shop"}
        </button>
        <button className="btn sm danger" disabled={busy}
                onClick={() => window.confirm(`Delete the metal "${cat.name}"?`) && run(() => api(url, { method: "DELETE" }))}>Delete</button>
      </div>
      <p className="muted">
        Web address: /collection/{cat.slug}, {cat.count} design{cat.count === 1 ? "" : "s"}{cat.active ? "" : ", currently hidden"}
      </p>
      <ul className="adm-list">
        {cat.sections.map((s) => <SectionRow key={s.slug} cat={cat} s={s} run={run} busy={busy} />)}
      </ul>
      <AddSection cat={cat} run={run} busy={busy} />
    </div>
  );
}

function SectionRow({ cat, s, run, busy }) {
  const [name, setName] = useState(s.name);
  const url = `/api/admin/categories/${cat.slug}/sections/${s.slug}`;
  return (
    <li className="adm-row">
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label={`Name of ${s.name}`} />
      <span className="muted">{s.count} design{s.count === 1 ? "" : "s"}{s.active ? "" : ", hidden"}</span>
      {name.trim() !== s.name && <button className="btn sm" disabled={busy} onClick={() => run(() => api(url, { method: "PUT", body: { name } }))}>Save name</button>}
      <button className="btn sm" disabled={busy} onClick={() => run(() => api(url, { method: "PUT", body: { active: !s.active } }))}>{s.active ? "Hide" : "Show"}</button>
      <button className="btn sm danger" disabled={busy}
              onClick={() => window.confirm(`Delete the type "${s.name}"?`) && run(() => api(url, { method: "DELETE" }))}>Delete</button>
    </li>
  );
}

function AddSection({ cat, run, busy }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (await run(() => api(`/api/admin/categories/${cat.slug}/sections`, { method: "POST", body: { name, slug } }))) {
      setName("");
      setSlug("");
    }
  };
  return (
    <form className="adm-row" onSubmit={submit}>
      <label className="field adm-grow">New jewellery type in {cat.name}
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="For example: Kada" />
      </label>
      <label className="field adm-grow">Web link name (optional)
        <input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={60} placeholder="English letters, for example: kada" />
      </label>
      <button className="btn sm" disabled={busy}>Add type</button>
    </form>
  );
}

function AddCategory({ run, busy }) {
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [slug, setSlug] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (await run(() => api("/api/admin/categories", { method: "POST", body: { name, blurb, slug } }))) {
      setName("");
      setBlurb("");
      setSlug("");
    }
  };
  return (
    <form className="adm-form" onSubmit={submit}>
      <h2>Add a new metal</h2>
      <div className="two">
        <label className="field">Metal name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required placeholder="For example: Platinum" />
        </label>
        <label className="field">Web link name (optional)
          <input value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={60} placeholder="English letters, for example: platinum" />
        </label>
      </div>
      <label className="field">Short description
        <input value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={200} />
      </label>
      <div><button className="btn" disabled={busy}>Add metal</button></div>
    </form>
  );
}
