import { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: { email: string; password: string; user: User }[] = [
  {
    email: "admin@example.com",
    password: "admin123",
    user: {
      id: "1",
      name: "Super Admin",
      email: "admin@example.com",
      role: "superadmin",
      createdAt: "2026-01-01",
    },
  },
  {
    email: "user@example.com",
    password: "user123",
    user: {
      id: "2",
      name: "John Doe",
      email: "user@example.com",
      role: "user",
      createdAt: "2026-02-15",
    },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email: string, password: string): boolean => {
    const found = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (found) {
      setUser(found.user);
      localStorage.setItem("user", JSON.stringify(found.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated: !!user }}
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