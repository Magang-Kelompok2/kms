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
import { useState, useEffect, useRef } from "react";
import type { Material as MaterialType } from "../types";

export function MaterialViewPage() {
  const { materialId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [completedFiles, setCompletedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialType | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  const [materialLoading, setMaterialLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );
  const [userLevel, setUserLevel] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: "",
    description: "",
    meetingNumber: "",
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoBufferedEnd, setVideoBufferedEnd] = useState(0);
  const [, setIsFullscreen] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);

  const getFileKey = (file: { id: string; type: "pdf" | "video" }) =>
    `${file.type}:${file.id}`;

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return "0:00";

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds,
      ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const getMaxBufferedEnd = (video: HTMLVideoElement) => {
    const { buffered, duration } = video;

    if (!buffered || buffered.length === 0) {
      return 0;
    }

    let maxEnd = 0;

    for (let i = 0; i < buffered.length; i++) {
      maxEnd = Math.max(maxEnd, buffered.end(i));
    }

    return Math.min(maxEnd, Number.isFinite(duration) ? duration : maxEnd);
  };

  const syncVideoState = () => {
    const video = videoRef.current;
    if (!video) return;

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const bufferedEnd = getMaxBufferedEnd(video);

    setVideoCurrentTime(video.currentTime);
    setVideoDuration(duration);
    setVideoBufferedEnd(bufferedEnd);
    setIsPlaying(!video.paused);
  };

  const showControlsTemporarily = () => {
    setShowVideoControls(true);

    if (hideControlsTimeoutRef.current) {
      window.clearTimeout(hideControlsTimeoutRef.current);
    }

    const video = videoRef.current;

    if (video && !video.paused) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setShowVideoControls(false);
      }, 2000);
    }
  };

  const seekVideo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const duration = Number.isFinite(video.duration)
      ? video.duration
      : video.currentTime;

    video.currentTime = Math.min(
      Math.max(video.currentTime + seconds, 0),
      duration,
    );

    syncVideoState();
    showControlsTemporarily();
  };

  const handleSliderChange = (value: string) => {
    const video = videoRef.current;
    if (!video) return;

    const targetTime = Number(value);
    const maxAllowedTime = Math.max(videoBufferedEnd, video.currentTime);

    video.currentTime = Math.min(targetTime, maxAllowedTime);
    syncVideoState();
    showControlsTemporarily();
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      showControlsTemporarily();
    } else {
      video.pause();
      setShowVideoControls(true);

      if (hideControlsTimeoutRef.current) {
        window.clearTimeout(hideControlsTimeoutRef.current);
      }
    }

    syncVideoState();
  };

  const toggleFullscreen = async () => {
    const container = videoContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      await container.requestFullscreen();
      showControlsTemporarily();
    } else {
      await document.exitFullscreen();
      setShowVideoControls(true);
    }
  };

  const localProgressKey =
    user?.id && materialId
      ? `material-progress:${user.id}:${materialId}`
      : null;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      showControlsTemporarily();
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        window.clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

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
        setProgressLoading(false);
      } finally {
        setMaterialLoading(false);
      }
    };

    fetchMaterial();
  }, [materialId]);

  useEffect(() => {
    if (!material) return;

    if (!material.classId) {
      setProgressLoading(false);
      return;
    }

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

        if (!res.ok) {
          setUserLevel(1);
          return;
        }

        const json = await res.json();

        const level = json.data?.tingkatanSaatIni;
        setUserLevel(typeof level === "number" && level >= 1 ? level : 1);

        const completedMaterials: string[] =
          json.data?.completedMaterials ?? [];

        if (materialId && completedMaterials.includes(materialId)) {
          setCompletedFiles(material.files.map((file) => getFileKey(file)));
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
        setUserLevel(1);
      } finally {
        setProgressLoading(false);
      }
    };

    fetchProgress();
  }, [localProgressKey, material, user?.id, user?.role, materialId, token]);

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
  }, [material, selectedFile]);

  useEffect(() => {
    if (material && isEditing) {
      setEditDraft({
        title: material.title,
        description: material.description,
        meetingNumber: material.meetingNumber.toString(),
      });
    }
  }, [material, isEditing]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (e.repeat) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        seekVideo(10);
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekVideo(-10);
      }

      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [videoBufferedEnd]);

  const handleEdit = () => {
    setIsEditing(true);
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
            Anda perlu menyelesaikan tingkatan sebelumnya untuk mengakses materi
            ini. (Level materi: {materialLevel}, Level kamu: {userLevel})
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
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan progress",
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

  const bufferedPercent =
    videoDuration > 0
      ? Math.min((videoBufferedEnd / videoDuration) * 100, 100)
      : 0;

  const playedPercent =
    videoDuration > 0
      ? Math.min((videoCurrentTime / videoDuration) * 100, 100)
      : 0;

  const sliderMax = Math.max(videoBufferedEnd, videoCurrentTime, 0);

  return (
    <AppLayout className="max-w-7xl py-6" mainClassName="overflow-hidden">
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

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:h-[calc(100vh-4rem-4rem)] lg:overflow-hidden">
        <div className="w-full lg:w-96 shrink-0 lg:h-full lg:min-h-0">
          <Card className="lg:h-full lg:min-h-0 flex flex-col overflow-hidden">
            <div className="sticky top-0 z-10 border-b border-border bg-card/95 p-5 backdrop-blur supports-backdrop-filter:bg-card/80">
              <h2 className="mb-1 text-lg font-semibold tracking-tight">
                Daftar Materi
              </h2>
              <p className="text-sm text-muted-foreground">
                {material.files.length} file tersedia
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
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
                                  {completedFiles.includes(
                                    getFileKey(file),
                                  ) && (
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
                                  {completedFiles.includes(
                                    getFileKey(file),
                                  ) && (
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

        <div className="flex-1 min-w-0 lg:h-full lg:min-h-0 lg:overflow-hidden">
          <div className="h-full flex flex-col gap-6">
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
            </Card>

            {selectedFile && selectedFileData && (
              <Card className="p-6 flex flex-col">
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

                  {!isCompleted &&
                    !completedFiles.includes(getFileKey(selectedFileData)) && (
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
                    <div
                      ref={videoContainerRef}
                      onMouseMove={showControlsTemporarily}
                      onMouseLeave={() => {
                        const video = videoRef.current;
                        if (video && !video.paused) {
                          setShowVideoControls(false);
                        }
                      }}
                      className="w-full aspect-video mt-2 bg-black rounded-xl overflow-hidden relative"
                    >
                      <video
                        key={selectedFileData.id}
                        ref={videoRef}
                        controls={false}
                        preload="metadata"
                        className="w-full h-full object-contain"
                        src={selectedFileData.url}
                        onContextMenu={(e) => e.preventDefault()}
                        onLoadedMetadata={syncVideoState}
                        onTimeUpdate={syncVideoState}
                        onProgress={syncVideoState}
                        onPlay={() => {
                          syncVideoState();
                          showControlsTemporarily();
                        }}
                        onPause={() => {
                          syncVideoState();
                          setShowVideoControls(true);
                        }}
                        onClick={togglePlay}
                      />

                      <div
                        className={`absolute inset-0 flex items-center justify-center gap-6 pointer-events-none transition-opacity duration-300 ${
                          showVideoControls ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <button
                          onClick={() => seekVideo(-10)}
                          className="pointer-events-auto bg-black/60 text-white px-4 py-3 rounded-full hover:bg-black/80 transition"
                        >
                          ⏪ 10s
                        </button>

                        <button
                          onClick={() => seekVideo(10)}
                          className="pointer-events-auto bg-black/60 text-white px-4 py-3 rounded-full hover:bg-black/80 transition"
                        >
                          10s ⏩
                        </button>
                      </div>

                      <div
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 transition-opacity duration-300 ${
                          showVideoControls
                            ? "opacity-100"
                            : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <div className="relative mb-3">
                          <div className="relative h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                            <div
                              className="absolute left-0 top-0 h-full bg-white/40"
                              style={{ width: `${bufferedPercent}%` }}
                            />

                            <div
                              className="absolute left-0 top-0 h-full bg-white"
                              style={{ width: `${playedPercent}%` }}
                            />
                          </div>

                          <input
                            type="range"
                            min={0}
                            max={sliderMax || 0}
                            step={0.1}
                            value={Math.min(videoCurrentTime, sliderMax || 0)}
                            onChange={(e) => handleSliderChange(e.target.value)}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center gap-3 text-white">
                          <button
                            onClick={togglePlay}
                            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 transition"
                          >
                            {isPlaying ? "⏸" : "▶"}
                          </button>

                          <span className="text-sm whitespace-nowrap">
                            {formatTime(videoCurrentTime)} /{" "}
                            {formatTime(videoDuration)}
                          </span>

                          <div className="flex-1" />

                          <button
                            onClick={toggleFullscreen}
                            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/20 transition"
                          >
                            ⛶
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full">
                      <PDFViewer url={selectedFileData.url} />
                    </div>
                  )}
                </div>
              </Card>
            )}

            {(allFilesCompleted || isCompleted || completionMessage) && (
              <Card className="p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <div>
                    <h3 className="text-base font-bold text-green-900 dark:text-green-100">
                      {isCompleted
                        ? "Materi telah diselesaikan"
                        : "Progress materi tersimpan"}
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
