import { useState } from "react";
import { SITE } from "../data/site.js";

// Shows public/images/logo.png; falls back to a monogram until the file exists.
export default function Logo({ size = 44 }) {
  const [bad, setBad] = useState(false);
  const initials = SITE.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
  if (bad) return <span className="mono" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</span>;
  return (
    <img className={"logo-img" + (SITE.logoBadge ? " badge" : "")} src={SITE.logo}
         alt={SITE.name} height={size} onError={() => setBad(true)} />
  );
}
