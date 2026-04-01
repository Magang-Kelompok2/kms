import { useState, useEffect } from "react";

export interface MateriData {
  id_materi: number;
  title_materi: string;
  materi_path: string | null;
  id_kelas: number;
  id_tingkatan: number;
  pertemuan: number;
}

export function useMateri() {
  const [materi, setMateri] = useState<MateriData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMateri = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL;
        console.log("[useMateri] VITE_API_URL:", apiUrl);
        console.log("[useMateri] Fetching:", `${apiUrl}/api/materials`);

        const res = await fetch(`${apiUrl}/api/materials`);
        console.log("[useMateri] Response status:", res.status);

        if (!res.ok) throw new Error("Gagal mengambil data materi");
        const data = await res.json();
        console.log("[useMateri] Data received:", data);

        setMateri(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[useMateri] Error:", err);
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchMateri();
  }, []);

  return { materi, loading, error };
}
