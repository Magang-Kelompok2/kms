import { useState, useEffect } from "react";

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  id_kelas: number | null;
  created_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
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
  }, []);

  const deleteUser = async (userId: number): Promise<boolean> => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Gagal menghapus pengguna");
      await fetchUsers(); // refresh list
      return true;
    } catch (err) {
      return false;
    }
  };

  return { users, loading, error, deleteUser, refetch: fetchUsers };
}
