"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("fastdocs_token");
    const savedUser = localStorage.getItem("fastdocs_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("fastdocs_token");
        localStorage.removeItem("fastdocs_user");
      }
    }

    if (savedToken) {
      // Verify session with backend — timeout after 5s so we never hang
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      api.get("/api/auth/me")
        .then((res) => {
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("fastdocs_user", JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token invalid or backend unreachable — clear it
          localStorage.removeItem("fastdocs_token");
          localStorage.removeItem("fastdocs_user");
          setUser(null);
          setToken(null);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token: jwtToken, user: userData } = res.data;

    setToken(jwtToken);
    setUser(userData);

    localStorage.setItem("fastdocs_token", jwtToken);
    localStorage.setItem("fastdocs_user", JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.post("/api/auth/register", { email, password, name });
    const { token: jwtToken, user: userData } = res.data;

    setToken(jwtToken);
    setUser(userData);

    localStorage.setItem("fastdocs_token", jwtToken);
    localStorage.setItem("fastdocs_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("fastdocs_token");
    localStorage.removeItem("fastdocs_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
