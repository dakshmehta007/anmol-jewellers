import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext.jsx";
import { img } from "../data/catalog.js";

// Home-page explorer: pick a metal, see every jewellery type inside it.
export default function CategoryTabs() {
  const { catalog, status, reload } = useCatalog();
  const [picked, setPicked] = useState(null);
  const c = catalog.find((x) => x.id === picked) || catalog[0];

  return (
    <section className="wrap pad" id="collections">
      <h2>Explore our collections</h2>
      {status === "loading" && <p className="muted">Loading collections...</p>}
      {status === "error" && (
        <p className="muted">
          We could not load the collections.{" "}
          <button className="linkbtn u" onClick={reload}>
            Try again
          </button>
        </p>
      )}
      {status === "ready" && !c && (
        <p className="muted">Collections will appear here soon.</p>
      )}
      {c && (
        <>
          <div className="tabs" role="tablist">
            {catalog.map((x) => (
              <button
                key={x.id}
                role="tab"
                aria-selected={x.id === c.id}
                className={"tab" + (x.id === c.id ? " on" : "")}
                onClick={() => setPicked(x.id)}
              >
                {x.name}
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginBottom: 20 }}>
            {c.blurb}
          </p>
          <div className="grid sm">
            {c.sections.map((s) => (
              <Link
                key={s.id}
                className="tile"
                to={`/collection/${c.id}/${s.id}`}
                style={
                  s.image
                    ? { backgroundImage: `url(${img(s.image, 500)})` }
                    : undefined
                }
              >
                <span>{s.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
