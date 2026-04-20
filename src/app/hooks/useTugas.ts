// src/hooks/useTugas.ts
import { useState, useEffect, useCallback } from "react";
import { useQueryCache, invalidateCache } from "./useQueryCache";

export interface TugasData {
  id_tugas: number;
  nama_tugas: string | null;
  deskripsi: string | null;
  type: string | null;
  id_materi: number;
  id_kelas: number;
  pertemuan: number;
  deadline?: string;
  durasi?: number;
  path_tugas?: string | null; // ← tambah field ini
  created_at: string;
}

interface TugasResponse {
  success: boolean;
  data: TugasData[];
  total: number;
  limit: number;
  offset: number;
}

export function useTugas(
  classId?: string | number,
  type?: string,
  limit = 50,
  offset = 0,
) {
  const [allTugas, setAllTugas] = useState<TugasData[]>([]);
  const [total, setTotal] = useState(0);

  const apiUrl = import.meta.env.VITE_API_URL;
  const cacheKey = `tugas:${classId}:${type}:${offset}:${limit}`;

  const fetchTugas = useCallback(async (): Promise<TugasResponse> => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    params.append("offset", String(offset));
    if (classId) params.append("classId", String(classId));
    if (type) params.append("type", type);

    const res = await fetch(`${apiUrl}/api/tugas?${params}`);
    if (!res.ok) throw new Error("Gagal mengambil data tugas");
    return res.json();
  }, [apiUrl, classId, type, limit, offset]);

  const {
    data: response,
    loading,
    error,
    refetch,
  } = useQueryCache<TugasResponse>(cacheKey, fetchTugas, {
    ttl: 5 * 60 * 1000,
    enableCache: true,
  });

  useEffect(() => {
    if (response?.data) {
      setAllTugas(response.data);
      setTotal(response.total);
    }
  }, [response]);

  const invalidate = useCallback(() => {
    invalidateCache("tugas:.*");
  }, []);

  return {
    tugas: allTugas,
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
