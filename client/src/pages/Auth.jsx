import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

export default function Auth({ mode }) {
  const signup = mode === "signup";
  const { user, setUser, loading } = useAuth();
  const { state } = useLocation();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <p className="wrap pad top muted">Loading...</p>;
  // Already logged in (or just logged in): go back to the page the visitor came from.
  if (user) return <Navigate to={state?.returnTo || "/"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const { user: u } = await api(
        `/api/auth/${signup ? "signup" : "login"}`,
        { method: "POST", body: form },
      );
      // If they came here by selecting a design, save that selection now.
      if (state?.pending) {
        try {
          await api("/api/selections", { method: "POST", body: state.pending });
        } catch {
          /* login still succeeded; ignore */
        }
      }
      setUser(u);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  };

  return (
    <section className="wrap pad top auth">
      <h1>{signup ? "Create your account" : "Welcome back"}</h1>
      <form onSubmit={submit}>
        {signup && <input name="name" placeholder="Full name" required />}
        <input name="email" type="email" placeholder="Email" required />
        <input
          name="password"
          type="password"
          placeholder="Password (8+ characters)"
          minLength={8}
          required
        />
        {signup && <input name="phone" type="tel" placeholder="Phone number" />}
        {err && (
          <p className="err" role="alert">
            {err}
          </p>
        )}
        <button className="btn" disabled={busy}>
          {busy ? "Please wait..." : signup ? "Sign up" : "Log in"}
        </button>
      </form>
      <p className="muted">
        {signup ? (
          <>
            Already registered?{" "}
            <Link to="/login" state={state}>
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/signup" state={state}>
              Create an account
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
