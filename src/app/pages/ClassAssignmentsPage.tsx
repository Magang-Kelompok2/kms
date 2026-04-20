import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  File,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface TugasWithFiles {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  meetingNumber: number;
  files: any[];
  filesLoading?: boolean;
  filesError?: string | null;
}

interface PertemuanGroup {
  meetingNumber: number;
  tugas: TugasWithFiles[];
}

export function ClassAssignmentsPage() {
  const { classId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [allTugas, setAllTugas] = useState<TugasWithFiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPertemuan, setExpandedPertemuan] = useState<Set<number>>(
    new Set([1]),
  );

  // Fetch semua tugas untuk class ini
  useEffect(() => {
    if (!classId) return;

    const fetchAllTugas = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tugas?classId=${classId}&limit=100`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data tugas");
        const json = await res.json();
        if (!json.success) throw new Error("Failed to fetch tugas");

        const tugasData = (json.data ?? []).map((t: any) => ({
          id: String(t.id_tugas),
          title: t.nama_tugas ?? "",
          description: t.deskripsi ?? "",
          dueDate: t.deadline ?? t.created_at,
          meetingNumber: t.pertemuan,
          type: t.type ?? "",
          files: [],
          filesLoading: true,
          filesError: null,
        }));

        setAllTugas(tugasData);

        // Fetch files untuk setiap tugas secara parallel
        await Promise.all(
          tugasData.map((tugas) => fetchTugasFiles(tugas.id, tugasData)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchAllTugas();
  }, [classId]);

  // Fetch files untuk satu tugas
  const fetchTugasFiles = async (
    tugasId: string,
    tugasArray: TugasWithFiles[],
  ) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/upload/tugas-files/${tugasId}`,
      );

      let files: any[] = [];
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.files) {
          files = json.data.files;
        }
      }

      // Update state untuk tugas ini
      setAllTugas((prev) =>
        prev.map((t) =>
          t.id === tugasId
            ? { ...t, files, filesLoading: false, filesError: null }
            : t,
        ),
      );
    } catch (err) {
      setAllTugas((prev) =>
        prev.map((t) =>
          t.id === tugasId
            ? {
                ...t,
                filesLoading: false,
                filesError: err instanceof Error ? err.message : "Error",
              }
            : t,
        ),
      );
    }
  };

  // Group tugas by pertemuan
  const pertemuanGroups: PertemuanGroup[] = [];
  const pertemuanMap = new Map<number, TugasWithFiles[]>();

  allTugas.forEach((tugas) => {
    const meeting = tugas.meetingNumber;
    if (!pertemuanMap.has(meeting)) {
      pertemuanMap.set(meeting, []);
    }
    pertemuanMap.get(meeting)!.push(tugas);
  });

  Array.from(pertemuanMap.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([meeting, tugas]) => {
      pertemuanGroups.push({ meetingNumber: meeting, tugas });
    });

  const togglePertemuan = (meetingNumber: number) => {
    const newExpanded = new Set(expandedPertemuan);
    if (newExpanded.has(meetingNumber)) {
      newExpanded.delete(meetingNumber);
    } else {
      newExpanded.add(meetingNumber);
    }
    setExpandedPertemuan(newExpanded);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">{error}</p>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout className="max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(`/class/${classId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Kelas
      </Button>

      <Card className="p-6 mb-6">
        <h1 className="text-3xl font-bold">Daftar Tugas</h1>
        <p className="text-muted-foreground mt-2">
          {allTugas.length} tugas di {pertemuanGroups.length} pertemuan
        </p>
      </Card>

      <div className="space-y-4">
        {pertemuanGroups.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Tidak ada tugas ditemukan</p>
          </Card>
        ) : (
          pertemuanGroups.map((pertemuan) => (
            <Card key={pertemuan.meetingNumber} className="overflow-hidden">
              {/* Header Pertemuan */}
              <button
                onClick={() => togglePertemuan(pertemuan.meetingNumber)}
                className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div>
                    <h2 className="text-xl font-bold">
                      Pertemuan {pertemuan.meetingNumber}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {pertemuan.tugas.length} tugas
                    </p>
                  </div>
                </div>
                {expandedPertemuan.has(pertemuan.meetingNumber) ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {/* Daftar Tugas */}
              {expandedPertemuan.has(pertemuan.meetingNumber) && (
                <div className="border-t divide-y">
                  {pertemuan.tugas.map((tugas) => (
                    <div key={tugas.id} className="p-6">
                      {/* Judul Tugas */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold mb-2">
                          {tugas.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {tugas.description}
                        </p>
                        {tugas.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            Deadline:{" "}
                            {new Date(tugas.dueDate).toLocaleDateString(
                              "id-ID",
                            )}
                          </Badge>
                        )}
                      </div>

                      {/* Files Section */}
                      <div className="ml-4 mt-4 pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <File className="h-4 w-4" />
                          File Pendukung
                        </h4>

                        {tugas.filesLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Memuat file...
                          </div>
                        ) : tugas.filesError ? (
                          <p className="text-sm text-muted-foreground">
                            Tidak dapat memuat file
                          </p>
                        ) : tugas.files.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Tidak ada file untuk tugas ini
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {tugas.files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 shrink-0">
                                    <File className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {file.type.toUpperCase()} •{" "}
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0 ml-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      window.open(file.url, "_blank")
                                    }
                                    title="Buka file"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement("a");
                                      link.href = file.url;
                                      link.download = file.name;
                                      link.click();
                                    }}
                                    title="Download file"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Button untuk lihat detail tugas */}
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/assignment/${tugas.id}`)}
                        >
                          Buka Tugas
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
