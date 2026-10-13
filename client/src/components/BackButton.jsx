import { useLocation, useNavigate } from "react-router-dom";

// Goes to the page the visitor came from. If they opened this page directly (no history), goes to `fallback`.
export default function BackButton({ fallback = "/" }) {
  const nav = useNavigate();
  const { key } = useLocation();
  const go = () => (key !== "default" ? nav(-1) : nav(fallback));
  return (
    <button type="button" className="back" onClick={go} aria-label="Go back">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
