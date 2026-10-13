import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { api } from "../api.js";
import DesignsTab from "../components/admin/DesignsTab.jsx";
import CategoriesTab from "../components/admin/CategoriesTab.jsx";
import SelectionsTab from "../components/admin/SelectionsTab.jsx";

const TABS = [
  ["designs", "Designs"],
  ["categories", "Metals and types"],
  ["selections", "Customer selections"],
];

// Private page for the shop owner. The server checks the admin role on every request too,
// so hiding this page is only for convenience, not for security.
export default function Admin() {
  const { user, loading } = useAuth();
  const { refresh } = useCatalog();
  const [tab, setTab] = useState("designs");
  const [cats, setCats] = useState(null);
  const [catsErr, setCatsErr] = useState("");
  const isAdmin = user?.role === "admin";

  const loadCats = useCallback(async () => {
    const d = await api("/api/admin/categories");
    setCats(d.categories);
  }, []);

  useEffect(() => {
    if (isAdmin) loadCats().catch((e) => setCatsErr(e.message));
  }, [isAdmin, loadCats]);

  // After any change: reload the admin lists and the public catalog so the shop pages match.
  const changed = useCallback(async () => {
    await loadCats();
    refresh();
  }, [loadCats, refresh]);

  if (loading) return <p className="wrap pad top muted">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ returnTo: "/admin" }} replace />;
  if (!isAdmin)
    return (
      <section className="wrap pad top">
        <h1>Admin only</h1>
        <p className="muted">This page is for the shop owner. <Link to="/">Back to the shop</Link></p>
      </section>
    );

  return (
    <section className="wrap pad top adm">
      <h1>Shop admin</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={"tab" + (tab === id ? " on" : "")} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {catsErr && <p className="err" role="alert">{catsErr}</p>}
      {tab === "designs" && (cats ? <DesignsTab cats={cats} onChanged={changed} /> : !catsErr && <p className="muted">Loading...</p>)}
      {tab === "categories" && (cats ? <CategoriesTab cats={cats} onChanged={changed} /> : !catsErr && <p className="muted">Loading...</p>)}
      {tab === "selections" && <SelectionsTab />}
    </section>
  );
}
