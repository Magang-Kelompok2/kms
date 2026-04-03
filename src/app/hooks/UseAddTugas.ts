// src/hooks/useAddTugas.ts
import { useState } from "react";

export interface AddTugasPayload {
  nama_tugas: string;
  deskripsi?: string;
  type?: string; // "Tugas" | "Kuis" | dll
  id_materi: number;
  id_kelas: number;
  pertemuan?: number;
  deadline?: string; // ISO string, e.g. "2025-12-31T23:59:00"
}

interface UseAddTugasReturn {
  addTugas: (payload: AddTugasPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useAddTugas(): UseAddTugasReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  const addTugas = async (payload: AddTugasPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tugas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal menambahkan tugas");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return { addTugas, loading, error, success, reset };
}
