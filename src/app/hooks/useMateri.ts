import { useState, useEffect, useCallback } from "react";
import { useQueryCache, invalidateCache } from "./useQueryCache";

export interface MateriData {
  id_materi: number;
  title_materi: string;
  deskripsi?: string;
  id_kelas: number;
  id_tingkatan: number;
  pertemuan: number;
}

interface MateriResponse {
  success: boolean;
  data: MateriData[];
  total: number;
  limit: number;
  offset: number;
}

export function useMateri(classId?: string | number, limit = 30, offset = 0) {
  const [allMateri, setAllMateri] = useState<MateriData[]>([]);
  const [total, setTotal] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL;
  const cacheKey = `materials:${classId}:${offset}:${limit}`;

  const fetchMateri = useCallback(async (): Promise<MateriResponse> => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    if (classId) params.append("classId", String(classId));

    const res = await fetch(`${apiUrl}/api/materials?${params}`);
    if (!res.ok) throw new Error("Gagal mengambil data materi");
    return res.json();
  }, [apiUrl, classId, limit, offset]);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useQueryCache<MateriResponse>(
    cacheKey,
    fetchMateri,
    { ttl: 5 * 60 * 1000, enableCache: true }, // 5 min cache
  );

  useEffect(() => {
    if (response?.data) {
      setAllMateri(response.data);
      setTotal(response.total);
    }
  }, [response]);

  const invalidate = useCallback(() => {
    invalidateCache("materials:.*");
  }, []);

  return {
    materi: allMateri,
    loading,
    error: error?.message ?? null,
    refetch,
    invalidate,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}
