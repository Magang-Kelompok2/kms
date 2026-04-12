import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useQueryCache, invalidateCache } from "./useQueryCache";

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  id_kelas?: number | null;
  created_at: string;
}

interface UsersResponse {
  success: boolean;
  data: UserData[];
  total: number;
  limit: number;
  offset: number;
}

export function useUsers(limit = 50, offset = 0) {
  const { token } = useAuth();
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL;
  const cacheKey = `users:${offset}:${limit}`;

  const fetchUsers = useCallback(async (): Promise<UsersResponse> => {
    if (!token) throw new Error("No token");

    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));

    const res = await fetch(`${apiUrl}/api/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Gagal mengambil data pengguna");
    return res.json();
  }, [token, apiUrl, limit, offset]);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useQueryCache<UsersResponse>(cacheKey, fetchUsers, {
    ttl: 5 * 60 * 1000,
    enableCache: !!token,
  });

  useEffect(() => {
    if (response?.data) {
      setAllUsers(response.data);
      setTotal(response.total);
    }
  }, [response]);

  const deleteUser = useCallback(
    async (userId: number): Promise<boolean> => {
      if (!token) return false;
      try {
        const res = await fetch(`${apiUrl}/api/users/${userId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Gagal menghapus pengguna");
        invalidateCache("users:.*");
        await refetch();
        return true;
      } catch {
        return false;
      }
    },
    [token, apiUrl, refetch],
  );

  const invalidate = useCallback(() => {
    invalidateCache("users:.*");
  }, []);

  return {
    users: allUsers,
    loading,
    error: error?.message ?? null,
    deleteUser,
    refetch,
    invalidate,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}
