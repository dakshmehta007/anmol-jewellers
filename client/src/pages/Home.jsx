import { useEffect, useState } from "react";
import Hero3D from "../components/Hero3D.jsx";
import CategoryTabs from "../components/CategoryTabs.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { SITE } from "../data/site.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import { api } from "../api.js";

export default function Home() {
  const { getCategory, getSection } = useCatalog();
  const [popular, setPopular] = useState([]);

  // Designs marked "Show in Popular designs" in the admin panel.
  useEffect(() => {
    let stale = false;
    api("/api/designs?featured=true&limit=8")
      .then((d) => !stale && setPopular(d.designs))
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, []);

  const label = (d) =>
    `${getCategory(d.category)?.name ?? d.category} ${getSection(d.category, d.section)?.name ?? d.section}`;

  return (
    <>
      <Hero3D />
      <CategoryTabs />
      {popular.length > 0 && (
        <section className="wrap pad">
          <h2>Popular designs</h2>
          <div className="grid sm">
            {popular.map((d) => (
              <ProductCard key={d.id} design={d} from={label(d)} />
            ))}
          </div>
        </section>
      )}
      <section className="wrap pad">
        <h2>Visit our showroom</h2>
        <div className="grid sm">
          {SITE.showroom.map((img, i) => (
            <div
              key={i}
              className="shot wide"
              role="img"
              aria-label="Showroom"
              style={img ? { backgroundImage: `url(${img})` } : undefined}
            />
          ))}
        </div>
        <p className="muted" style={{ marginTop: 16 }}>
          {SITE.address}
        </p>
      </section>
    </>
  );
}
