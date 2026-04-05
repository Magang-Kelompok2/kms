import { useState, useEffect } from "react";

export interface TugasData {
  id_tugas: number;
  nama_tugas: string | null;
  deskripsi: string | null;
  type: string | null;
  id_materi: number;
  id_kelas: number;
  pertemuan: number;
  created_at: string;
}

export function useTugas() {
  const [tugas, setTugas] = useState<TugasData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTugas = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tugas`);
        if (!res.ok) throw new Error("Gagal mengambil data tugas");
        const json = await res.json();
        // endpoint ini return { success: true, data: [...] }
        setTugas(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchTugas();
  }, []);

  return { tugas, loading, error };
}
