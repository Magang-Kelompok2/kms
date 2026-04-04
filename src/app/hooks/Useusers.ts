import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  id_kelas: number | null;
  created_at: string;
}

export function useUsers() {
  const { token } = useAuth(); // ← ambil token dari AuthContext
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return; // jangan fetch kalau belum ada token
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`, // ← kirim token
        },
      });
      if (!res.ok) throw new Error("Gagal mengambil data pengguna");
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]); // re-fetch kalau token berubah

  const deleteUser = async (userId: number): Promise<boolean> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error("Gagal menghapus pengguna");
      await fetchUsers();
      return true;
    } catch {
      return false;
    }
  };

  return { users, loading, error, deleteUser, refetch: fetchUsers };
}