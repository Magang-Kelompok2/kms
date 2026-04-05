import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { createClient } from '@supabase/supabase-js';
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null; // ← tambah ini biar bisa dipakai di hooks
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("URL:", supabaseUrl)
console.log("KEY:", supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper: ambil data user dari tabel public.user berdasarkan email
async function fetchUserProfile(email: string): Promise<Partial<User> | null> {
  const { data, error } = await supabase
    .from("user")
    .select("id_user, username, role, id_kelas")
    .eq("email", email)
    .single();

  if (error || !data) return null;

  return {
    id: String(data.id_user),
    name: data.username,
    role: data.role ?? "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Gabungkan Supabase auth user + profile dari tabel public.user
  async function syncUser(supabaseUser: any, accessToken: string) {
    const profile = await fetchUserProfile(supabaseUser.email);
    setUser({
      id: profile?.id ?? supabaseUser.id,
      name: profile?.name ?? supabaseUser.email.split("@")[0],
      email: supabaseUser.email,
      role: profile?.role ?? "user",
      createdAt: supabaseUser.created_at ?? new Date().toISOString(),
    });
    setToken(accessToken);
  }

  useEffect(() => {
    // Cek session saat mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await syncUser(session.user, session.access_token);
      }
      setLoading(false);
    });

    // Listen perubahan auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await syncUser(session.user, session.access_token);
        } else {
          setUser(null);
          setToken(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      if (data.user && data.session) {
        await syncUser(data.user, data.session.access_token);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Terjadi kesalahan saat login" };
    }
  };

const register = async (
  email: string,
  password: string,
  username: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: "Gagal membuat akun" };

    // ← INSERT ke tabel public.user setelah signup
    const { error: dbError } = await supabase.from("user").insert({
      username,
      email,
      password: "supabase_managed",
      role: "user",
    });

    if (dbError) {
      console.error("Gagal insert ke public.user:", dbError);
      // Tidak return error agar tidak block login, tapi log-nya perlu
    }

    if (data.session) {
      await syncUser(data.user, data.session.access_token);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Terjadi kesalahan" };
  }
};

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      token,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
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