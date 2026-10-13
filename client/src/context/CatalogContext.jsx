import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api.js";

// Loads the metals and jewellery types from the API once and shares them with every page.
const Ctx = createContext(null);
export const useCatalog = () => useContext(Ctx);

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState([]);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  // quiet = refresh in the background (no loading screen, keeps old data if it fails)
  const load = useCallback(async (quiet) => {
    if (!quiet) setStatus("loading");
    try {
      const d = await api("/api/catalog");
      setCatalog(d.categories);
      setStatus("ready");
    } catch {
      if (!quiet) setStatus("error");
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const value = useMemo(
    () => ({
      catalog,
      status,
      reload: () => load(false),
      refresh: () => load(true),
      getCategory: (id) => catalog.find((c) => c.id === id),
      getSection: (cat, sec) => catalog.find((c) => c.id === cat)?.sections.find((s) => s.id === sec),
    }),
    [catalog, status, load]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
