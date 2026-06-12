import { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface AddTingkatanModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  nextLevel: number;
}

export function AddTingkatanModal({ open, onClose, onSuccess, classId, nextLevel }: AddTingkatanModalProps) {
  const { token } = useAuth();
  const [namaTingkatan, setNamaTingkatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTingkatan.trim()) {
      setError("Nama tingkatan wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/kelas/${classId}/levels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ nama_tingkatan: namaTingkatan.trim() }),
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Gagal membuat tingkatan");
      onSuccess();
      setNamaTingkatan("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Tambah Tingkatan</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Tingkatan <span className="font-semibold text-foreground">{nextLevel}</span> akan ditambahkan ke kelas ini.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Tingkatan</label>
            <input
              type="text"
              value={namaTingkatan}
              onChange={(e) => setNamaTingkatan(e.target.value)}
              placeholder="Contoh: Tingkat Dasar"
              maxLength={100}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
