import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API = import.meta.env.VITE_API_URL ?? "";
const SESSION_KEY = "taxacore_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session dari localStorage saat mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        const { user: u, token: t } = JSON.parse(stored);
        setUser(u);
        setToken(t);
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSession = (userData: User, jwt: string) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: userData, token: jwt }));
    setUser(userData);
    setToken(jwt);
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setToken(null);
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Email atau password salah" };
      }

      saveSession(json.user, json.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Tidak bisa terhubung ke server" };
    }
  };

  const register = async (
    email: string,
    password: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        return { success: false, error: json.error ?? "Gagal membuat akun" };
      }

      saveSession(json.user, json.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Tidak bisa terhubung ke server" };
    }
  };

  const logout = async (): Promise<void> => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export supabase client untuk keperluan data fetching (bukan auth)
export { supabase } from "../../utils/supabase";