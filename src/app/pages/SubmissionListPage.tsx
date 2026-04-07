import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  Download,
  Loader2,
  Trophy,
} from "lucide-react";
import { useState, useEffect } from "react";

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

// Pengumpulan untuk tugas biasa
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

// Hasil untuk kuis
interface HasilKuisItem {
  id_hasil: number;
  skor: number;
  benar: number;
  total: number;
  created_at: string;
  user: { id_user: number; username: string; email: string } | null;
}

export function SubmissionListPage() {
  const { tugasId } = useParams<{ tugasId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tugas, setTugas] = useState<TugasDetail | null>(null);
  const [pengumpulanList, setPengumpulanList] = useState<PengumpulanItem[]>([]);
  const [hasilKuisList, setHasilKuisList] = useState<HasilKuisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "superadmin") navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    if (!tugasId) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch detail tugas
        const tugasRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tugas/${tugasId}`,
        );
        if (!tugasRes.ok) throw new Error("Gagal mengambil data tugas");
        const tugasJson = await tugasRes.json();
        if (!tugasJson.success || !tugasJson.data)
          throw new Error("Tugas tidak ditemukan");

        const tugasData: TugasDetail = tugasJson.data;
        setTugas(tugasData);

        const isKuis = tugasData.type?.toLowerCase() === "kuis";

        if (isKuis) {
          // Fetch hasil kuis
          const hasilRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/kuis/${tugasId}/hasil`,
          );
          if (hasilRes.ok) {
            const hasilJson = await hasilRes.json();
            setHasilKuisList(hasilJson.data ?? []);
          }
        } else {
          // Fetch pengumpulan tugas biasa
          const pengRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/pengumpulan/tugas/${tugasId}`,
          );
          if (pengRes.ok) {
            const pengJson = await pengRes.json();
            setPengumpulanList(pengJson.data ?? []);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [tugasId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8 flex justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-500">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tugas) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">{error ?? "Data tidak ditemukan"}</p>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="mt-4"
            >
              Kembali
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isKuis = tugas.type?.toLowerCase() === "kuis";
  const totalSubmissions = isKuis
    ? hasilKuisList.length
    : pengumpulanList.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />
      <div className="container mx-auto max-w-6xl px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${tugas.classId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Kelas
        </Button>

        {/* Header */}
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between">
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
              <p className="text-4xl font-bold text-blue-600">
                {totalSubmissions}
              </p>
            </div>
          </div>

          {/* Stats */}
          {isKuis ? (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <Trophy className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{totalSubmissions}</p>
                <p className="text-sm text-gray-500">Total Mengerjakan</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">
                  {hasilKuisList.filter((h) => h.skor >= 70).length}
                </p>
                <p className="text-sm text-gray-500">Lulus (≥70)</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                <Trophy className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">
                  {hasilKuisList.length > 0
                    ? Math.round(
                        hasilKuisList.reduce((a, h) => a + h.skor, 0) /
                          hasilKuisList.length,
                      )
                    : 0}
                </p>
                <p className="text-sm text-gray-500">Rata-rata Skor</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <Clock className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{totalSubmissions}</p>
                <p className="text-sm text-gray-500">Total Masuk</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold">
                  {pengumpulanList.filter((p) => p.answer).length}
                </p>
                <p className="text-sm text-gray-500">Ada Jawaban Teks</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                <FileText className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold">
                  {pengumpulanList.filter((p) => p.file).length}
                </p>
                <p className="text-sm text-gray-500">Ada File</p>
              </div>
            </div>
          )}
        </Card>

        {/* List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            {isKuis ? "Hasil Kuis" : "Daftar Pengumpulan"} ({totalSubmissions})
          </h2>

          {totalSubmissions === 0 ? (
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Belum ada {isKuis ? "yang mengerjakan" : "pengumpulan"}
              </p>
            </Card>
          ) : isKuis ? (
            // ── Hasil Kuis ──
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
            // ── Pengumpulan Tugas ──
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
                      <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.file.original_filename}
                          </p>
                          {item.file.ukuran_file && (
                            <p className="text-xs text-gray-500">
                              {(item.file.ukuran_file / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `${import.meta.env.VITE_API_URL}/api/upload/signed-url?key=${encodeURIComponent(item.file!.object_key)}`,
                              );
                              const json = await res.json();
                              if (json.success) window.open(json.url, "_blank");
                            } catch {
                              alert("Gagal membuka file");
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Unduh
                        </Button>
                      </div>
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
      </div>
    </div>
  );
}
