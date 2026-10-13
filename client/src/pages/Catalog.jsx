import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import BackButton from "../components/BackButton.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { api } from "../api.js";

const LIMIT = 24; // designs loaded per click of "Show more designs"

export default function Catalog() {
  const { cat, sub } = useParams();
  const { status, getCategory, reload } = useCatalog();
  const c = getCategory(cat);
  const s = c?.sections.find((x) => x.id === sub);
  const found = Boolean(s);

  const [designs, setDesigns] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [state, setState] = useState("loading"); // "loading" | "ready" | "error"
  const [tries, setTries] = useState(0);
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreErr, setMoreErr] = useState("");

  const url = (p) =>
    `/api/designs?category=${encodeURIComponent(cat)}&section=${encodeURIComponent(sub)}&page=${p}&limit=${LIMIT}`;

  // Loads the first page whenever the visitor opens a different type (Ring -> Chain) or presses "Try again".
  useEffect(() => {
    if (!found) return;
    let stale = false;
    setDesigns([]);
    setPage(1);
    setPages(1);
    setMoreErr("");
    setState("loading");
    api(url(1))
      .then((d) => {
        if (stale) return;
        setDesigns(d.designs);
        setPages(d.pages);
        setState("ready");
      })
      .catch(() => !stale && setState("error"));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, sub, found, tries]);

  const loadMore = async () => {
    setMoreBusy(true);
    setMoreErr("");
    try {
      const d = await api(url(page + 1));
      // skip designs we already have (new designs can shift the pages)
      setDesigns((prev) => [
        ...prev,
        ...d.designs.filter((x) => !prev.some((y) => y.id === x.id)),
      ]);
      setPage(page + 1);
      setPages(d.pages);
    } catch (e) {
      setMoreErr(e.message);
    } finally {
      setMoreBusy(false);
    }
  };

  if (!found) {
    if (status === "loading")
      return <p className="wrap pad top muted">Loading...</p>;
    if (status === "error")
      return (
        <p className="wrap pad top muted">
          We could not load this page.{" "}
          <button className="linkbtn u" onClick={reload}>
            Try again
          </button>
        </p>
      );
    return <p className="wrap pad top">Designs not found.</p>;
  }

  const from = `${c.name} ${s.name}`;
  return (
    <section className="wrap pad top">
      <div className="crumbs">
        <BackButton fallback={`/collection/${c.id}`} />
        <p className="muted">
          <Link to={`/collection/${c.id}`}>{c.name}</Link> / {s.name}
        </p>
      </div>
      <h1>
        {c.name} {s.name.toLowerCase()}
      </h1>
      <div className="chips" style={{ margin: "16px 0 32px" }}>
        {c.sections.map((x) => (
          <Link
            key={x.id}
            className={"chip" + (x.id === s.id ? " on" : "")}
            to={`/collection/${c.id}/${x.id}`}
          >
            {x.name}
          </Link>
        ))}
      </div>

      {state === "loading" && <p className="muted">Loading designs...</p>}
      {state === "error" && (
        <p className="muted">
          We could not load the designs.{" "}
          <button className="linkbtn u" onClick={() => setTries(tries + 1)}>
            Try again
          </button>
        </p>
      )}
      {state === "ready" && designs.length === 0 && (
        <p className="muted">
          New {s.name.toLowerCase()} designs are coming soon. Please visit the
          showroom or check back later.
        </p>
      )}
      <div className="grid sm">
        {designs.map((d) => (
          <ProductCard key={d.id} design={d} from={from} />
        ))}
      </div>
      {state === "ready" && page < pages && (
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="btn" onClick={loadMore} disabled={moreBusy}>
            {moreBusy ? "Loading..." : "Show more designs"}
          </button>
          {moreErr && (
            <p className="err" role="alert">
              {moreErr}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
