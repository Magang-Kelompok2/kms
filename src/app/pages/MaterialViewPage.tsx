import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
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
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    meetingNumber: "",
  });

  const getFileKey = (file: { id: string; type: "pdf" | "video" }) =>
    `${file.type}:${file.id}`;
  const localProgressKey =
    user?.id && materialId ? `material-progress:${user.id}:${materialId}` : null;

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
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
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
          setCompletedFiles(
            material.files.map((file) => getFileKey(file)),
          );
          setIsCompleted(true);
          setCompletionMessage("Materi telah diselesaikan.");
        } else {
          const savedLocalProgress =
            localProgressKey && typeof window !== "undefined"
              ? window.localStorage.getItem(localProgressKey)
              : null;
          setCompletedFiles(
            savedLocalProgress ? JSON.parse(savedLocalProgress) : [],
          );
          setCompletionMessage(null);
        }
      } catch {
        // Gagal fetch progress → default level 1 agar tidak langsung ditolak
        setUserLevel(1);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();
  }, [localProgressKey, material, user?.id, user?.role, materialId, token]);

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
      <AppLayout>
        <p className="text-sm text-muted-foreground">Memuat materi...</p>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">{error}</p>
        </Card>
      </AppLayout>
    );
  }

  if (!material) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">Material tidak ditemukan</p>
        </Card>
      </AppLayout>
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
      <AppLayout>
        <Card className="p-12 text-center shadow-sm">
          <h1 className="mb-4 text-xl font-semibold tracking-tight">
            Akses Ditolak
          </h1>
          <p className="text-muted-foreground">
            Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses
            materi ini. (Level materi: {materialLevel}, Level kamu:{" "}
            {userLevel})
          </p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Kembali ke Dashboard
          </Button>
        </Card>
      </AppLayout>
    );
  }

  const handleMarkComplete = async (fileId: string) => {
    if (!material || !user?.id || !token) return;

    const targetFile = material.files.find((file) => file.id === fileId);
    if (!targetFile) return;

    const fileKey = getFileKey(targetFile);
    if (completedFiles.includes(fileKey)) return;

    const nextCompletedFiles = [...completedFiles, fileKey];
    setCompletedFiles(nextCompletedFiles);
    if (localProgressKey && typeof window !== "undefined") {
      window.localStorage.setItem(
        localProgressKey,
        JSON.stringify(nextCompletedFiles),
      );
    }

    if (nextCompletedFiles.length < material.files.length) {
      setCompletionMessage("Progress materi disimpan di perangkat ini.");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/materials/${material.id}/complete-file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileId: Number(targetFile.id),
            fileType: targetFile.type,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Gagal menyimpan progress materi");
      }

      setCompletedFiles(material.files.map((file) => getFileKey(file)));
      setIsCompleted(true);
      setCompletionMessage("Materi telah diselesaikan.");
      setError(null);
      if (localProgressKey && typeof window !== "undefined") {
        window.localStorage.removeItem(localProgressKey);
      }
    } catch (err) {
      setCompletedFiles(completedFiles);
      if (localProgressKey && typeof window !== "undefined") {
        window.localStorage.setItem(
          localProgressKey,
          JSON.stringify(completedFiles),
        );
      }
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan progress",
      );
    }
  };

  const completedCurrentMaterialFiles = material.files.filter((file) =>
    completedFiles.includes(getFileKey(file)),
  ).length;
  const allFilesCompleted =
    material.files.length > 0 &&
    completedCurrentMaterialFiles === material.files.length;

  const videoFiles = material.files.filter((f) => f.type === "video");
  const pdfFiles = material.files.filter((f) => f.type === "pdf");
  const selectedFileData = material.files.find((f) => f.id === selectedFile);

  return (
    <AppLayout className="max-w-7xl py-6">
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
              <div className="sticky top-0 z-10 border-b border-border bg-card/95 p-5 backdrop-blur supports-backdrop-filter:bg-card/80">
                <h2 className="mb-1 text-lg font-semibold tracking-tight">
                  Daftar Materi
                </h2>
                <p className="text-sm text-muted-foreground">
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
                                  : completedFiles.includes(getFileKey(file))
                                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
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
                                    {completedFiles.includes(getFileKey(file)) && (
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
                                  : completedFiles.includes(getFileKey(file))
                                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10"
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
                                    {completedFiles.includes(getFileKey(file)) && (
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
                    {!isCompleted && !completedFiles.includes(getFileKey(selectedFileData)) && (
                      <Button onClick={() => handleMarkComplete(selectedFile)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Tandai Selesai
                      </Button>
                    )}
                    {isCompleted && (
                      <Badge className="bg-emerald-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Materi selesai
                      </Badge>
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
                          className="flex-1 max-w-fit"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Materi
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDelete}
                          className="flex-1 max-w-fit"
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

              {/* Completion banner */}
              {(allFilesCompleted || isCompleted || completionMessage) && (
                <Card className="p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-base font-bold text-green-900 dark:text-green-100">
                        {isCompleted ? "Materi telah diselesaikan" : "Progress materi tersimpan"}
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {completionMessage ??
                          (isCompleted
                            ? "Materi selesai."
                            : "Sebagian file sudah ditandai selesai.")}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
    </AppLayout>
  );
}
