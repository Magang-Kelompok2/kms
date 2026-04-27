// src/hooks/useUpload.ts
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface UploadedFile {
  id: string; // id_pdf / id_video / id_file dari DB
  url: string; // presigned URL MinIO
  objectKey?: string;
  originalName: string;
}

interface UseUploadReturn {
  uploadMateriFile: (
    file: File,
    type: "pdf" | "video",
    idMateri: number,
    title?: string,
  ) => Promise<UploadedFile | null>;
  uploadTugasFile: (file: File) => Promise<UploadedFile | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => setError(null);

  // ── Upload file materi (PDF/video) ───────────────────────────
  const uploadMateriFile = async (
    file: File,
    type: "pdf" | "video",
    idMateri: number,
    title?: string,
  ): Promise<UploadedFile | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("id_materi", String(idMateri));
      if (title) formData.append("title", title);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/materi-file`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Upload gagal");

      return {
        id: String(json.data.id_pdf ?? json.data.id_video),
        url: json.data.pdf_path ?? json.data.video_path,
        objectKey: json.data.objectKey,
        originalName: file.name,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ── Upload file pengumpulan tugas ────────────────────────────
  const uploadTugasFile = async (file: File): Promise<UploadedFile | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/tugas-file`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error ?? "Upload gagal");

      return {
        id: String(json.data.id_file),
        url: json.data.url,
        objectKey: json.data.object_key,
        originalName: file.name,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadMateriFile, uploadTugasFile, loading, error, reset };
}
