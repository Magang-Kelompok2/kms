import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { PdfViewerModal } from "../components/PdfViewerModal";
import { SubmissionListSkeleton } from "../components/PageSkeletons";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Trophy,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface TugasDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  classId: string;
  meetingNumber: number;
  level: number;
  dueDate: string;
}

interface PengumpulanItem {
  id_pengumpulan: number;
  answer: string | null;
  created_at: string;
  file: {
    original_filename: string;
    ukuran_file: number;
    object_key: string;
  } | null;
  user: { id_user: number; username: string; email: string } | null;
}

interface HasilKuisItem {
  id_hasil: number;
  skor: number;
  benar: number;
  total: number;
  created_at: string;
  user: { id_user: number; username: string; email: string } | null;
}

const PAGE_SIZE = 12;

export function SubmissionListPage() {
  const { tugasId } = useParams<{ tugasId: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [tugas, setTugas] = useState<TugasDetail | null>(null);
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanItem[]>([]);
  const [hasilKuisList, setHasilKuisList] = useState<HasilKuisItem[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const offset = (currentPage - 1) * PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isPdfFile = (fileName: string) => fileName.toLowerCase().endsWith(".pdf");
  const isKuis = tugas?.type?.toLowerCase() === "kuis";

  const openSubmissionFile = useCallback(
    async (file: NonNullable<PengumpulanItem["file"]>) => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/upload/signed-url?key=${encodeURIComponent(file.object_key)}`,
        );
        const json = await res.json();

        if (!json.success || !json.url) {
          throw new Error("URL file tidak tersedia");
        }

        if (isPdfFile(file.original_filename)) {
          setPreviewFile({
            url: json.url,
            name: file.original_filename,
          });
          return;
        }

        window.open(json.url, "_blank", "noopener,noreferrer");
      } catch {
        alert("Gagal membuka file");
      }
    },
    [],
  );

  useEffect(() => {
    if (user && user.role !== "superadmin") navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tugasId]);

  useEffect(() => {
    if (!tugasId) return;

    const fetchMeta = async () => {
      setMetaLoading(true);
      setError(null);

      try {
        const tugasRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tugas/${tugasId}`,
        );
        if (!tugasRes.ok) throw new Error("Gagal mengambil data tugas");
        const tugasJson = await tugasRes.json();
        if (!tugasJson.success || !tugasJson.data) {
          throw new Error("Tugas tidak ditemukan");
        }

        setTugas(tugasJson.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setMetaLoading(false);
      }
    };

    fetchMeta();
  }, [tugasId]);

  useEffect(() => {
    if (!tugasId || !tugas) return;

    const fetchList = async () => {
      setListLoading(true);
      setError(null);

      try {
        const authHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        if (tugas.type?.toLowerCase() === "kuis") {
          const hasilRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/kuis/${tugasId}/hasil?limit=${PAGE_SIZE}&offset=${offset}`,
            { headers: authHeaders },
          );
          if (!hasilRes.ok) {
            const errorJson = await hasilRes.json();
            throw new Error(errorJson.error ?? "Gagal mengambil hasil kuis");
          }

          const hasilJson = await hasilRes.json();
          setHasilKuisList(hasilJson.data ?? []);
          setPengumpulanList([]);
          setTotal(hasilJson.total ?? 0);
        } else {
          const pengRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/pengumpulan/tugas/${tugasId}?limit=${PAGE_SIZE}&offset=${offset}`,
            { headers: authHeaders },
          );
          if (!pengRes.ok) {
            const errorJson = await pengRes.json();
            throw new Error(errorJson.error ?? "Gagal mengambil pengumpulan");
          }

          const pengJson = await pengRes.json();
          setPengumpulanList(pengJson.data ?? []);
          setHasilKuisList([]);
          setTotal(pengJson.total ?? 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setListLoading(false);
      }
    };

    fetchList();
  }, [offset, token, tugas, tugasId]);

  const pageStats = useMemo(() => {
    if (isKuis) {
      const passCount = hasilKuisList.filter((item) => item.skor >= 70).length;
      const averageScore =
        hasilKuisList.length > 0
          ? Math.round(
              hasilKuisList.reduce((sum, item) => sum + item.skor, 0) /
                hasilKuisList.length,
            )
          : 0;

      return {
        secondary: passCount,
        tertiary: averageScore,
      };
    }

    return {
      secondary: pengumpulanList.filter((item) => item.answer).length,
      tertiary: pengumpulanList.filter((item) => item.file).length,
    };
  }, [hasilKuisList, isKuis, pengumpulanList]);

  if (metaLoading) {
    return (
      <AppLayout>
        <SubmissionListSkeleton />
      </AppLayout>
    );
  }

  if (error || !tugas) {
    return (
      <AppLayout>
        <Card className="p-8 text-center shadow-sm">
          <p className="text-destructive">{error ?? "Data tidak ditemukan"}</p>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            Kembali
          </Button>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Button
        variant="ghost"
        onClick={() => navigate(`/class/${tugas.classId}`)}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Kelas
      </Button>

      <Card className="p-6 mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Pertemuan {tugas.meetingNumber}</Badge>
              <Badge variant="outline">Level {tugas.level}</Badge>
              <Badge variant="default">{isKuis ? "Kuis" : "Tugas"}</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{tugas.title}</h1>
            {tugas.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                {tugas.description}
              </p>
            )}
            {tugas.dueDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>
                  Deadline:{" "}
                  {new Date(tugas.dueDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-4xl font-bold text-blue-600">{total}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
            {isKuis ? (
              <Trophy className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            ) : (
              <Clock className="h-6 w-6 mx-auto text-blue-600 mb-2" />
            )}
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-sm text-gray-500">
              {isKuis ? "Total Mengerjakan" : "Total Masuk"}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
            <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{pageStats.secondary}</p>
            <p className="text-sm text-gray-500">
              {isKuis ? "Lulus di Halaman Ini" : "Ada Jawaban Teks"}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
            {isKuis ? (
              <Trophy className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            ) : (
              <FileText className="h-6 w-6 mx-auto text-purple-600 mb-2" />
            )}
            <p className="text-2xl font-bold">{pageStats.tertiary}</p>
            <p className="text-sm text-gray-500">
              {isKuis ? "Rata-rata Halaman Ini" : "Ada File"}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">
            {isKuis ? "Hasil Kuis" : "Daftar Pengumpulan"} ({total})
          </h2>
          {listLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat halaman...
            </span>
          )}
        </div>

        {listLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-36 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : total === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Belum ada {isKuis ? "yang mengerjakan" : "pengumpulan"}
            </p>
          </Card>
        ) : isKuis ? (
          hasilKuisList.map((item) => (
            <Card key={item.id_hasil} className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {item.user?.username?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">
                      {item.user?.username ?? "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {item.user?.email ?? "-"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Benar/Total</p>
                    <p className="text-sm font-semibold">
                      {item.benar}/{item.total}
                    </p>
                  </div>
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${
                      item.skor >= 70
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {item.skor}
                  </div>
                  <Badge
                    variant={item.skor >= 70 ? "default" : "destructive"}
                  >
                    {item.skor >= 70 ? "Lulus" : "Tidak Lulus"}
                  </Badge>
                </div>
              </div>
            </Card>
          ))
        ) : (
          pengumpulanList.map((item) => (
            <Card key={item.id_pengumpulan} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                      {item.user?.username?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <h3 className="font-bold">
                        {item.user?.username ?? "Unknown User"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.user?.email ?? "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>

                  {item.answer && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Jawaban:
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}

                  {item.file && (
                    <button
                      type="button"
                      onClick={() => {
                        if (item.file) {
                          void openSubmissionFile(item.file);
                        }
                      }}
                      className="flex w-fit px-4 items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-left transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/10"
                    >
                      <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.file.original_filename}
                        </p>
                        {item.file.ukuran_file && (
                          <p className="text-xs text-gray-500">
                            {(item.file.ukuran_file / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </button>
                  )}

                  {!item.answer && !item.file && (
                    <p className="text-sm text-gray-400 italic">
                      Tidak ada jawaban atau file
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="shrink-0">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Dikumpulkan
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || listLoading}
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage >= totalPages || listLoading}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {previewFile && (
        <PdfViewerModal
          url={previewFile.url}
          fileName={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </AppLayout>
  );
}
