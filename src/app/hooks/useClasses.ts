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
        console.log("Fetching classes from:", `${import.meta.env.VITE_API_URL}/api/kelas`);
        const res = await fetch(`http://localhost:4000/api/kelas`);
        console.log("Response status:", res.status);
        if (!res.ok) throw new Error("Gagal mengambil data kelas");
        const json = await res.json();
        console.log("Fetched classes:", json.data);
        setClasses(json.data);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return { classes, loading, error };
}
