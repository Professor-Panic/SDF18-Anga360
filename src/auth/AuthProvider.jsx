import { useCallback, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { AuthContext } from "./authContext.js";

export default function AuthProvider({ children }) {
  // only trust the stored user if there's still a token to go with it
  const [user, setUser] = useState(() => (authApi.getToken() ? authApi.getStoredUser() : null));

  // authFetch fires this when the server rejects our token
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener("anga:logout", onLogout);
    return () => window.removeEventListener("anga:logout", onLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authApi.login(credentials);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (details) => {
    const u = await authApi.signup(details);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, signup, logout }), [user, login, signup, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
