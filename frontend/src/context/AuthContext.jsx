import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getToken, setToken as persistToken } from "../api/client.js";
import { fetchMe, login as loginRequest } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  // Ao abrir o app com um token salvo, confirma que ele ainda é válido antes
  // de liberar as rotas protegidas (evita mostrar UI logada com token expirado).
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("anonymous");
      return;
    }

    fetchMe()
      .then((me) => {
        setUser(me);
        setStatus("authenticated");
      })
      .catch(() => {
        persistToken(null);
        setStatus("anonymous");
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: loggedUser } = await loginRequest(email, password);
    persistToken(token);
    setUser(loggedUser);
    setStatus("authenticated");
    return loggedUser;
  }, []);

  // Usado depois de POST /schools/register, que já devolve token + admin.
  const setSession = useCallback((token, sessionUser) => {
    persistToken(token);
    setUser(sessionUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, setSession }),
    [user, status, login, logout, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
