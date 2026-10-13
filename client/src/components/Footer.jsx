import { Link } from "react-router-dom";
import { SITE } from "../data/site.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import Logo from "./Logo.jsx";

export default function Footer() {
  const { catalog } = useCatalog();
  return (
    <footer className="sf">
      <div className="wrap sf-grid">
        <div>
          <Logo size={56} />
          <h3>{SITE.name}</h3>
          <p className="muted">{SITE.tagline}</p>
        </div>
        <div>
          <h3>Visit us</h3>
          <p>{SITE.address}</p>
          <p>
            Phone:{" "}
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
          </p>
          <p>
            Email: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
          <p className="muted">{SITE.hours}</p>
          <p className="muted">GSTIN: {SITE.gst}</p>
        </div>
        <div>
          <h3>Collections</h3>
          {catalog.map((c) => (
            <p key={c.id}>
              <Link to={`/collection/${c.id}`}>{c.name}</Link>
            </p>
          ))}
        </div>
      </div>
      <div className="wrap sf-bottom">
        <span>
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </span>
        <span>Website by {SITE.developer}</span>
      </div>
    </footer>
  );
}
