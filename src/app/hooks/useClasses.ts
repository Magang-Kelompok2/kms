import { useState, useEffect, useCallback } from "react";
import { useQueryCache, invalidateCache } from "./useQueryCache";

export interface KelasData {
  id: number;
  name: string;
  createdAt: string;
}

interface ClassesResponse {
  success: boolean;
  data: KelasData[];
  total?: number;
  limit?: number;
  offset?: number;
}

export function useClasses() {
  const [allClasses, setAllClasses] = useState<KelasData[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchClasses = useCallback(async (): Promise<ClassesResponse> => {
    const res = await fetch(`${apiUrl}/api/kelas`);
    if (!res.ok) throw new Error("Gagal mengambil data kelas");
    return res.json();
  }, [apiUrl]);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useQueryCache<ClassesResponse>(
    "classes:all",
    fetchClasses,
    { ttl: 10 * 60 * 1000, enableCache: true }, // 10 min cache
  );

  useEffect(() => {
    if (response?.data) {
      setAllClasses(response.data);
    }
  }, [response]);

  const invalidate = useCallback(() => {
    invalidateCache("classes:.*");
  }, []);

  return {
    classes: allClasses,
    loading,
    error: error?.message ?? null,
    refetch,
    invalidate,
  };
}
