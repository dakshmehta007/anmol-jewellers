import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On every page load, ask the server whether this visitor is logged in.
  useEffect(() => {
    api("/api/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <Ctx.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </Ctx.Provider>
  );
}
