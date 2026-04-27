import { useCallback, useEffect, useState } from "react";
import type { Material, Assignment, Quiz } from "../types";
import { useQueryCache } from "./useQueryCache";

interface Level {
  id: string;
  level: number;
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
}

export function useLevels(classId: string | number | undefined) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [levels, setLevels] = useState<Level[]>([]);

  const fetchLevels = useCallback(async (): Promise<{ data: Level[] }> => {
    const res = await fetch(`${apiUrl}/api/kelas/${classId}/levels`);
    if (!res.ok) throw new Error("Gagal mengambil data tingkatan");
    return res.json();
  }, [apiUrl, classId]);

  const { data, loading, error, refetch } = useQueryCache<{ data: Level[] }>(
    `levels:${classId ?? "none"}`,
    fetchLevels,
    {
      ttl: 5 * 60 * 1000,
      enableCache: Boolean(classId),
    },
  );

  useEffect(() => {
    if (!classId) {
      setLevels([]);
      return;
    }

    setLevels(data?.data ?? []);
  }, [classId, data]);

  return {
    levels,
    loading: classId ? loading : false,
    error: error?.message ?? null,
    refetch,
  };
}
