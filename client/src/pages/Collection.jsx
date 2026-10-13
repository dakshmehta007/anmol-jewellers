import { Link, useParams } from "react-router-dom";
import BackButton from "../components/BackButton.jsx";
import { useCatalog } from "../context/CatalogContext.jsx";
import { img } from "../data/catalog.js";

export default function Collection() {
  const { cat } = useParams();
  const { status, getCategory, reload } = useCatalog();
  const c = getCategory(cat);

  if (!c) {
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
    return <p className="wrap pad top">Collection not found.</p>;
  }

  return (
    <section className="wrap pad top">
      <div className="crumbs">
        <BackButton fallback="/" />
        <p className="muted">
          <Link to="/">Home</Link> / {c.name}
        </p>
      </div>
      <h1>{c.name}</h1>
      <p className="muted" style={{ marginBottom: 32 }}>
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
    </section>
  );
}
