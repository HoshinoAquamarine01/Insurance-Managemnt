import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginApi, registerApi } from "../services/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "testfdl-auth";

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed.user || null);
        setToken(parsed.token || null);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsReady(true);
  }, []);

  const persist = (nextUser, nextToken) => {
    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken }),
    );
  };

  const login = async (payload) => {
    const data = await loginApi(payload);
    persist(
      {
        id: data.user.userId,
        username: data.user.username,
        fullName: data.user.hoTen,
        role: data.user.vaiTro,
      },
      data.accessToken,
    );
    return data;
  };

  const register = async (payload) => {
    return registerApi(payload);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, token, isReady, login, register, logout }),
    [user, token, isReady],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
