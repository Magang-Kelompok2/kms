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
        const res = await fetch(`${apiUrl}/api/materials`);
        if (!res.ok) throw new Error("Gagal mengambil data materi");

        const json = await res.json(); // ← json.data bukan langsung data
        setMateri(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchMateri();
  }, []);

  return { materi, loading, error };
}
