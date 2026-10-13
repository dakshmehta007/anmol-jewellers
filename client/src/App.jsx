import { Component, Suspense, lazy, useEffect, useLayoutEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Collection from "./pages/Collection.jsx";
import Catalog from "./pages/Catalog.jsx";
import Auth from "./pages/Auth.jsx";

// The admin panel is only downloaded when someone opens /admin, so it never slows down the shop pages.
const Admin = lazy(() => import("./pages/Admin.jsx"));

// Scrolls to the top before the new page is painted, so a long old scroll position can't leave the new page looking empty.
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// If a page crashes, show the error here instead of a blank screen.
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Page crashed:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="wrap pad top">
        <h2>Something went wrong on this page</h2>
        <p className="muted">{String(this.state.error.message || this.state.error)}</p>
        <button className="btn" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    );
  }
}

export default function App() {
  const { pathname } = useLocation();
  return (
    <>
      <ScrollTop />
      <Navbar />
      <main>
        {/* key={pathname} resets the boundary every time the visitor opens a new page */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<p className="wrap pad top muted">Loading...</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collection/:cat" element={<Collection />} />
              <Route path="/collection/:cat/:sub" element={<Catalog />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/signup" element={<Auth mode="signup" />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<p className="wrap pad top">Page not found.</p>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
