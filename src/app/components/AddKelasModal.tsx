import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { KELAS_ICONS, KelasIcon } from "../utils/kelasIcons";

interface AddKelasModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddKelasModal({ open, onClose, onSuccess }: AddKelasModalProps) {
  const { token } = useAuth();
  const [namaKelas, setNamaKelas] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("BookOpen");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKelas.trim()) {
      setError("Nama kelas wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/kelas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nama_kelas: namaKelas.trim(), icon: selectedIcon }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Gagal membuat kelas");
      onSuccess();
      setNamaKelas("");
      setSelectedIcon("BookOpen");
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
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Tambah Kelas Baru</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview kartu */}
          <div className="flex justify-center">
            <div className="h-24 w-48 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex flex-col items-center justify-center gap-2 shadow-md">
              <KelasIcon name={selectedIcon} className="w-10 h-10 text-white" />
              <span className="text-xs font-semibold text-white/80 truncate max-w-[160px] px-2">
                {namaKelas || "Nama Kelas"}
              </span>
            </div>
          </div>

          {/* Nama Kelas */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Kelas</label>
            <input
              type="text"
              value={namaKelas}
              onChange={(e) => setNamaKelas(e.target.value)}
              placeholder="Contoh: Akuntansi Dasar"
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Pilih Icon</label>
            <div className="grid grid-cols-7 gap-1.5 max-h-44 overflow-y-auto rounded-lg border border-border p-2 bg-muted/30">
              {KELAS_ICONS.map(({ name, Icon }) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => setSelectedIcon(name)}
                  className={`p-2 rounded-lg transition flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 ${
                    selectedIcon === name
                      ? "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500 scale-110"
                      : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
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
              {loading ? "Menyimpan..." : "Buat Kelas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
