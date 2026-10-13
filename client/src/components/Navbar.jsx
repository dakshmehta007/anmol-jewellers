import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { SITE } from "../data/site.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { catalog } = useCatalog();
  const close = () => setOpen(false);
  return (
    <header className="nav">
      <Link to="/" className="logo" onClick={close}>
        <Logo size={40} />
        <span>{SITE.name}</span>
      </Link>
      <button
        className="burger"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? "✕" : "☰"}
      </button>
      <nav className={"links" + (open ? " open" : "")}>
        {catalog.map((c) => (
          <NavLink key={c.id} to={`/collection/${c.id}`} onClick={close}>
            {c.name}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <NavLink to="/admin" onClick={close}>
            Admin
          </NavLink>
        )}
        {user ? (
          <>
            <span className="muted">Hi, {user.name.split(" ")[0]}</span>
            <button
              className="linkbtn"
              onClick={() => {
                close();
                logout();
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" onClick={close}>
            Log in
          </Link>
        )}
      </nav>
    </header>
  );
}
