// src/hooks/useAddTugas.ts
import { useState } from "react";

export interface AddTugasPayload {
  nama_tugas: string;
  deskripsi?: string;
  type?: string;
  id_materi: number;
  id_kelas: number;
  pertemuan?: number;
  deadline?: string;
  durasi?: number;
  file?: File;
}

interface UseAddTugasReturn {
  addTugas: (payload: AddTugasPayload) => Promise<number | null>;
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

  const addTugas = async (payload: AddTugasPayload): Promise<number | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { file, ...tugasPayload } = payload;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tugas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tugasPayload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal menambahkan tugas");
      }

      const id_tugas: number = json.data.id_tugas;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("id_tugas", String(id_tugas));

        const uploadRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/upload/assignment-file`,
          { method: "POST", body: formData },
        );

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          console.warn(
            "Tugas dibuat tapi file gagal diupload:",
            uploadJson.error,
          );
        }
      }

      setSuccess(true);
      return id_tugas;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { addTugas, loading, error, success, reset };
}
