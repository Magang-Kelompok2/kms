import { useState, useEffect } from "react";

export interface KelasData {
  id: number;
  name: string;
  createdAt: string;
}

export function useClasses() {
  const [classes, setClasses] = useState<KelasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kelas`);
        if (!res.ok) throw new Error("Gagal mengambil data kelas");
        const json = await res.json();
        setClasses(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return { classes, loading, error };
}
