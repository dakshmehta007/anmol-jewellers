import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { weightOptions, img } from "../data/catalog.js";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import { SITE } from "../data/site.js";
import { whatsappLink } from "../data/contact.js";

export default function ProductCard({ design, from }) {
  const go = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const opts = weightOptions(design);
  const [w, setW] = useState(opts[0]);
  const [shown, setShown] = useState(0); // which photo is showing
  const [status, setStatus] = useState("");
  const photos = design.images || [];
  const same = design.weightMin === design.weightMax;

  // Logged-in customer: open a WhatsApp chat to the shop with this design already typed in, and save the choice.
  const enquire = () => {
    // Not logged in: go to login, and come back to this page afterwards.
    if (!user) return go("/login", { state: { returnTo: pathname } });
    const text = [
      `Hello ${SITE.name}, I am interested in this design:`,
      `Design: ${design.name}`,
      `Category: ${from}`,
      `Weight: ${w} g`,
      `Name: ${user.name}`,
      user.phone ? `Phone: ${user.phone}` : "",
      `Page: ${window.location.href}`,
    ]
      .filter(Boolean)
      .join("\n");
    // Opened first, straight from the tap, so phone browsers do not block it.
    window.open(whatsappLink(text), "_blank", "noopener");
    setStatus("WhatsApp opened. Saving your choice...");
    api("/api/selections", {
      method: "POST",
      body: {
        designId: design.id,
        designName: design.name,
        weight: w,
        source: from,
      },
    })
      .then(() => setStatus("WhatsApp opened. Your choice is saved."))
      .catch(() => setStatus("WhatsApp opened."));
  };

  return (
    <article className="card">
      <div
        className="shot"
        role="img"
        aria-label={design.name}
        style={
          photos[shown]
            ? { backgroundImage: `url(${img(photos[shown].url, 600)})` }
            : undefined
        }
      />
      {photos.length > 1 && (
        <div className="thumbs">
          {photos.map((p, i) => (
            <button
              key={p.publicId}
              type="button"
              className={i === shown ? "on" : ""}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setShown(i)}
              style={{ backgroundImage: `url(${img(p.url, 80)})` }}
            />
          ))}
        </div>
      )}
      <h3>{design.name}</h3>
      <p className="muted">
        Weight:{" "}
        {same
          ? `${design.weightMin} g`
          : `${design.weightMin} to ${design.weightMax} g`}
      </p>
      {opts.length > 1 && (
        <label className="pick">
          Choose weight
          <select value={w} onChange={(e) => setW(+e.target.value)}>
            {opts.map((o) => (
              <option key={o} value={o}>
                {o} g
              </option>
            ))}
          </select>
        </label>
      )}
      <button className="btn" onClick={enquire}>
        Enquire on WhatsApp
      </button>
      {status && (
        <p className="muted" aria-live="polite" style={{ fontSize: ".85rem" }}>
          {status}
        </p>
      )}
    </article>
  );
}
