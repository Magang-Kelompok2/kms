import { useCallback, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface UploadedFile {
  id: string;
  url: string;
  objectKey?: string;
  originalName: string;
}

interface UseUploadReturn {
  uploadMateriFile: (
    file: File,
    type: "pdf" | "video",
    idMateri: number,
    title?: string,
    onProgress?: (percent: number) => void,
  ) => Promise<UploadedFile | null>;
  uploadTugasFile: (file: File) => Promise<UploadedFile | null>;
  cancelUpload: () => void;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export const UPLOAD_CANCELLED = "UPLOAD_CANCELLED";

export function useUpload(): UseUploadReturn {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = () => setError(null);

  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setLoading(false);
  }, []);

  // XHR-based upload — supports progress + cancellation
  const uploadMateriFile = (
    file: File,
    type: "pdf" | "video",
    idMateri: number,
    title?: string,
    onProgress?: (percent: number) => void,
  ): Promise<UploadedFile | null> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("id_materi", String(idMateri));
      if (title) formData.append("title", title);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        xhrRef.current = null;
        setLoading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            if (!json.success) {
              const msg = json.error ?? "Upload gagal";
              setError(msg);
              reject(new Error(msg));
            } else {
              resolve({
                id: String(json.data.id_pdf ?? json.data.id_video),
                url: json.data.pdf_path ?? json.data.video_path,
                objectKey: json.data.objectKey,
                originalName: file.name,
              });
            }
          } catch {
            setError("Response tidak valid");
            reject(new Error("Response tidak valid"));
          }
        } else {
          let msg = `Upload gagal (${xhr.status})`;
          try {
            const json = JSON.parse(xhr.responseText);
            msg = json.error ?? msg;
          } catch { /* ignore */ }
          setError(msg);
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => {
        xhrRef.current = null;
        setLoading(false);
        setError("Koneksi gagal");
        reject(new Error("Koneksi gagal"));
      };

      xhr.onabort = () => {
        xhrRef.current = null;
        setLoading(false);
        reject(new Error(UPLOAD_CANCELLED));
      };

      xhr.open("POST", `${import.meta.env.VITE_API_URL}/api/upload/materi-file`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  // fetch-based (no progress needed for tugas file)
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

  return { uploadMateriFile, uploadTugasFile, cancelUpload, loading, error, reset };
}
