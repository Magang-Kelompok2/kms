import { useState, useEffect } from "react";
import type { Material, Assignment } from "../types";

interface Level {
  id: string;
  level: number;
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: never[];
}

export function useLevels(classId: string | number | undefined) {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    const fetchLevels = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:4000/api/kelas/${classId}/levels`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data tingkatan");
        const json = await res.json();
        setLevels(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [classId]);

  return { levels, loading, error };
}
