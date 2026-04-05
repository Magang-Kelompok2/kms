import { useState } from "react";

export interface AddKuisPayload {
  nama_tugas: string;
  deskripsi?: string;
  id_materi: number;
  id_kelas: number;
  pertemuan?: number;
  durasi?: number; // ← tambah, hapus deadline
}

interface UseAddKuisReturn {
  addKuis: (payload: AddKuisPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useAddKuis(): UseAddKuisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  const addKuis = async (payload: AddKuisPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tugas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, type: "Kuis" }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal menambahkan kuis");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return { addKuis, loading, error, success, reset };
}
