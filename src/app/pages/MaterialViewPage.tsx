import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PDFViewer } from "../components/PDFViewer";
import { userProgress } from "../data/mockData";
import { ArrowLeft, FileText, PlayCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import type { Material as MaterialType } from "../types";

export function MaterialViewPage() {
  const { materialId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const progress = userProgress.find(
    (p) => p.userId === user?.id && p.classId === material?.classId,
  );

  // Fetch material from back-end table materi
  useEffect(() => {
    const fetchMaterial = async () => {
      if (!materialId) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials/${materialId}`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data materi");
        const json = await res.json();
        if (!json.success || !json.data) throw new Error("Material not found");
        setMaterial(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  // Auto-select first file on load
  useEffect(() => {
    if (material && material.files.length > 0 && !selectedFile) {
      setSelectedFile(material.files[0].id);
    }
  }, [material, selectedFile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <p className="text-gray-500">Memuat materi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">Material tidak ditemukan</p>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user has access
  const userLevel = progress?.currentLevel || 1;
  const hasAccess = user?.role === "superadmin" || material.level <= userLevel;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses
              materi ini.
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

  const allFilesCompleted = completedFiles.length === material.files.length;

  // Group files by type
  const videoFiles = material.files.filter((f) => f.type === "video");
  const pdfFiles = material.files.filter((f) => f.type === "pdf");
  const selectedFileData = material.files.find((f) => f.id === selectedFile);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${material.classId}`)}
          className="mb-4 text-base"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali ke Kelas
        </Button>

        {/* Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
          {/* Left Sidebar - File List */}
          <div className="w-full lg:w-96 shrink-0">
            <Card className="h-full overflow-y-auto">
              <div className="p-5 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
                <h2 className="text-xl font-normal mb-1">Daftar Materi</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.files.length} file tersedia
                </p>
              </div>

              <div className="p-4 space-y-5">
                {/* Video Section */}
                {videoFiles.length > 0 && (
                  <div>
                    <h3 className="text-base font-normal mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
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
                              : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-900/10"
                          }`}
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                                selectedFile === file.id
                                  ? "bg-red-200 dark:bg-red-800/40"
                                  : "bg-red-100 dark:bg-red-900/20"
                              }`}
                            >
                              <PlayCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="font-normal text-base leading-tight">
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

                {/* PDF Section */}
                {pdfFiles.length > 0 && (
                  <div>
                    <h3 className="text-base font-normal mb-3 flex items-center gap-2 text-blue-600 dark:text-blue-400">
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
                              : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                          }`}
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                                selectedFile === file.id
                                  ? "bg-blue-200 dark:bg-blue-800/40"
                                  : "bg-blue-100 dark:bg-blue-900/20"
                              }`}
                            >
                              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="font-normal text-base leading-tight">
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
              </div>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            <div className="h-full flex flex-col gap-6">
              {/* Material Header */}
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
                      {progress?.completedMaterials.includes(material.id) && (
                        <Badge variant="default" className="text-sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-normal mb-2">
                      {material.title}
                    </h1>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                      {material.description}
                    </p>
                  </div>
                </div>
              </Card>

              {/* File Viewer */}
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
                        <h3 className="text-lg font-normal">
                          {selectedFileData.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {selectedFileData.type} •{" "}
                          {selectedFileData.duration || "View Only"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!completedFiles.includes(selectedFile) && (
                        <Button
                          onClick={() => handleMarkComplete(selectedFile)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Tandai Selesai
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* File Content */}
                  <div className="flex-1 min-h-0">
                    {selectedFileData.type === "video" ? (
                      <div className="h-full bg-gray-900 rounded-lg overflow-hidden">
                        <iframe
                          src={selectedFileData.url}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="h-full">
                        <PDFViewer url={selectedFileData.url} />
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Completion Status */}
              {allFilesCompleted &&
                !progress?.completedMaterials.includes(material.id) && (
                  <Card className="p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        <div>
                          <h3 className="text-base font-bold text-green-900 dark:text-green-100">
                            Semua materi selesai!
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Kerja bagus! Sekarang Anda dapat melanjutkan ke
                            kuis.
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
