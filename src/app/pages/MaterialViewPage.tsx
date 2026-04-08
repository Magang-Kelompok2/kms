import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PDFViewer } from "../components/PDFViewer";
import {
  ArrowLeft,
  FileText,
  PlayCircle,
  CheckCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Material as MaterialType } from "../types";

export function MaterialViewPage() {
  const { materialId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialType | null>(null);

  const [materialLoading, setMaterialLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    meetingNumber: "",
  });

  // ── 1. Fetch material ──────────────────────────────────────────
  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) return;
      setMaterialLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials/${materialId}`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data materi");
        const json = await res.json();
        console.log("Material response:", json);
        if (!json.success || !json.data) throw new Error("Material not found");
        setMaterial(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        // FIX: Jika material gagal di-fetch, progress tidak perlu di-fetch juga
        setProgressLoading(false);
      } finally {
        setMaterialLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  // ── 2. Fetch progress ──────────────────────────────────────────
  useEffect(() => {
    // FIX: Jika material belum ada (termasuk jika classId tidak ada),
    // langsung set progressLoading false agar tidak stuck loading selamanya.
    if (!material) return;

    if (!material.classId) {
      // classId tidak ada — tidak bisa fetch progress, anggap level 1
      setProgressLoading(false);
      return;
    }

    // Superadmin tidak butuh progress
    if (user?.role === "superadmin") {
      setProgressLoading(false);
      return;
    }

    if (!user?.id) {
      setProgressLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress/${material.classId}`,
        );

        // FIX: Jika 404 atau error lain (user belum punya progress),
        // default userLevel = 1 sehingga materi level 1 tetap bisa diakses.
        if (!res.ok) {
          setUserLevel(1);
          return;
        }

        const json = await res.json();

        // FIX: Fallback eksplisit ke 1 jika data tidak ada
        const level = json.data?.tingkatanSaatIni;
        setUserLevel(typeof level === "number" && level >= 1 ? level : 1);

        const completedMaterials: string[] =
          json.data?.completedMaterials ?? [];
        if (materialId && completedMaterials.includes(materialId)) {
          setIsCompleted(true);
        }
      } catch {
        // Gagal fetch progress → default level 1 agar tidak langsung ditolak
        setUserLevel(1);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();
  }, [material, user?.id, user?.role, materialId]);

  // ── 3. Auto-select file pertama ────────────────────────────────
  useEffect(() => {
    if (
      material &&
      material.files &&
      material.files.length > 0 &&
      !selectedFile
    ) {
      console.log("Auto-selecting first file:", material.files[0]);
      setSelectedFile(material.files[0].id);
    } else if (material && (!material.files || material.files.length === 0)) {
      console.log("No files available in material");
      setSelectedFile(null);
    }
  }, [material]);

  // 4. Initialize edit draft
  useEffect(() => {
    if (material && isEditing) {
      setEditDraft({
        title: material.title,
        description: material.description,
        meetingNumber: material.meetingNumber.toString(),
      });
    }
  }, [material, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!material) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/${material.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editDraft.title,
            description: editDraft.description,
            meetingNumber:
              parseInt(editDraft.meetingNumber) || material.meetingNumber,
          }),
        },
      );
      if (!res.ok) throw new Error("Gagal mengupdate materi");
      const json = await res.json();
      setMaterial(json.data);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  const handleDelete = async () => {
    if (!material) return;
    if (!confirm("Hapus materi ini? Aksi ini tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/${material.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error("Gagal menghapus materi");
      navigate(`/class/${material.classId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  // ── Loading state ──────────────────────────────────────────────
  if (materialLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <p className="text-gray-500">Memuat materi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">Material tidak ditemukan</p>
          </Card>
        </div>
      </div>
    );
  }

  // ── Cek akses ──────────────────────────────────────────────────
  // FIX: Jika material.level tidak terdefinisi/null, anggap level 1
  const materialLevel =
    typeof material.level === "number" && material.level >= 1
      ? material.level
      : 1;

  const hasAccess = user?.role === "superadmin" || materialLevel <= userLevel;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses
              materi ini. (Level materi: {materialLevel}, Level kamu:{" "}
              {userLevel})
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Kembali ke Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleMarkComplete = (fileId: string) => {
    if (!completedFiles.includes(fileId)) {
      setCompletedFiles([...completedFiles, fileId]);
    }
  };

  const allFilesCompleted =
    material.files.length > 0 &&
    completedFiles.length === material.files.length;

  const videoFiles = material.files.filter((f) => f.type === "video");
  const pdfFiles = material.files.filter((f) => f.type === "pdf");
  const selectedFileData = material.files.find((f) => f.id === selectedFile);

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-6">
        <Button
          variant="ghost"
          onClick={() =>
            navigate(
              `/class/${material.classId}?openLevel=${material.level}&activeMaterial=${material.id}#materials`,
            )
          }
          className="mb-4 text-base"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali ke Materi
        </Button>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          {/* ── Left Sidebar ── */}
          <div className="w-full lg:w-96 shrink-0">
            <Card className="h-full overflow-y-auto">
              <div className="p-5 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h2 className="text-xl font-bold mb-1">Daftar Materi</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.files.length} file tersedia
                </p>
              </div>

              <div className="p-4 space-y-5">
                {videoFiles.length === 0 && pdfFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Belum ada file materi
                    </p>
                  </div>
                ) : (
                  <>
                    {videoFiles.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                          <PlayCircle className="h-5 w-5" />
                          Video Pembelajaran
                        </h3>
                        <div className="space-y-2">
                          {videoFiles.map((file) => (
                            <div
                              key={file.id}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                selectedFile === file.id
                                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-red-300"
                              }`}
                              onClick={() => setSelectedFile(file.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-900/20">
                                  <PlayCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="font-bold text-base leading-tight">
                                      {file.name}
                                    </h4>
                                    {completedFiles.includes(file.id) && (
                                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {file.duration || "Video"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pdfFiles.length > 0 && (
                      <div>
                        <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <FileText className="h-5 w-5" />
                          Dokumen PDF
                        </h3>
                        <div className="space-y-2">
                          {pdfFiles.map((file) => (
                            <div
                              key={file.id}
                              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                selectedFile === file.id
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                              }`}
                              onClick={() => setSelectedFile(file.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/20">
                                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="font-semibold text-base leading-tight">
                                      {file.name}
                                    </h4>
                                    {completedFiles.includes(file.id) && (
                                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Dokumen
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right Content ── */}
          <div className="flex-1 min-w-0">
            <div className="h-full flex flex-col gap-6">
              {/* Header */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-sm">
                        Pertemuan {material.meetingNumber}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        Level {material.level}
                      </Badge>
                      {isCompleted && (
                        <Badge variant="default" className="text-sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-semibold mb-2">
                      {material.title}
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                      {material.description}
                    </p>

                    {user?.role === "superadmin" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEdit}
                          className="flex-1"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Materi
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDelete}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Hapus Materi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 space-y-4 border-t pt-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Judul Materi
                      </label>
                      <input
                        type="text"
                        value={editDraft.title}
                        onChange={(e) =>
                          setEditDraft({ ...editDraft, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Deskripsi
                      </label>
                      <textarea
                        value={editDraft.description}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Pertemuan Ke-
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editDraft.meetingNumber}
                        onChange={(e) =>
                          setEditDraft({
                            ...editDraft,
                            meetingNumber: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveEdit} className="flex-1">
                        Simpan Perubahan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Viewer */}
              {selectedFile && selectedFileData && (
                <Card className="flex-1 p-6 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          selectedFileData.type === "video"
                            ? "bg-red-100 dark:bg-red-900/20"
                            : "bg-blue-100 dark:bg-blue-900/20"
                        }`}
                      >
                        {selectedFileData.type === "video" ? (
                          <PlayCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        ) : (
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedFileData.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {selectedFileData.type} •{" "}
                          {selectedFileData.duration || "View Only"}
                        </p>
                      </div>
                    </div>
                    {!completedFiles.includes(selectedFile) && (
                      <Button onClick={() => handleMarkComplete(selectedFile)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tandai Selesai
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 min-h-0">
                    {selectedFileData.type === "video" ? (
                      <div className="h-full bg-black rounded-lg overflow-hidden">
                        <video
                          controls
                          controlsList="nodownload"
                          className="w-full h-full object-contain bg-black"
                          src={selectedFileData.url}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : (
                      <div className="h-full">
                        <PDFViewer url={selectedFileData.url} />
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Completion banner */}
              {allFilesCompleted && !isCompleted && (
                <Card className="p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <h3 className="text-base font-bold text-green-900 dark:text-green-100">
                          Semua materi selesai!
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Kerja bagus! Sekarang Anda dapat melanjutkan ke kuis.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => navigate(`/class/${material.classId}`)}
                    >
                      Lanjut ke Kuis
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
