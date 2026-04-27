// src/hooks/useAddMateri.ts
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export interface VideoInput {
  title_video?: string;
  video_path: string;
}

export interface PdfInput {
  title_pdf?: string;
  pdf_path: string;
}

export interface AddMateriPayload {
  title_materi: string;
  deskripsi?: string;
  id_kelas: number;
  id_tingkatan: number;
  pertemuan?: number;
  videos?: VideoInput[];
  pdfs?: PdfInput[];
}

interface UseAddMateriReturn {
  addMateri: (payload: AddMateriPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
}

export function useAddMateri(): UseAddMateriReturn {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  const addMateri = async (payload: AddMateriPayload) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/materials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal menambahkan materi");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return { addMateri, loading, error, success, reset };
}
