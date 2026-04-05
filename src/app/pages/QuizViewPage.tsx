import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { DashboardHeader } from "../components/DashboardHeader";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  Clock,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface SoalKuis {
  id_soal: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  urutan: number;
}

interface TugasKuis {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  meetingNumber: number;
  level: number;
  type: string;
  materialId: string;
  durasi?: number;
}

type TahapKuis = "info" | "mengerjakan" | "selesai";

export function QuizViewPage() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<TugasKuis | null>(null);
  const [soalList, setSoalList] = useState<SoalKuis[]>([]);
  const [quizLoading, setQuizLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState(1);

  const [tahap, setTahap] = useState<TahapKuis>("info");
  const [soalAktif, setSoalAktif] = useState(0);
  const [jawaban, setJawaban] = useState<Record<number, string>>({});
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasilSkor, setHasilSkor] = useState<{
    skor: number;
    benar: number;
    total: number;
  } | null>(null);
  const [sudahMengerjakan, setSudahMengerjakan] = useState(false);
  const [skorSebelumnya, setSkorSebelumnya] = useState<number | null>(null);

  // ── 1. Fetch kuis ──────────────────────────────────────────────
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      setQuizLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/tugas/${quizId}`,
        );
        if (!res.ok) throw new Error("Gagal mengambil data kuis");
        const json = await res.json();
        if (!json.success || !json.data)
          throw new Error("Kuis tidak ditemukan");
        if (json.data.type?.toLowerCase() !== "kuis")
          throw new Error("Tugas ini bukan kuis");
        setQuiz(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        setProgressLoading(false);
      } finally {
        setQuizLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // ── 2. Fetch progress + soal + hasil ──────────────────────────
  useEffect(() => {
    if (!quiz) return;

    const fetchAll = async () => {
      if (user?.role !== "superadmin" && user?.id && quiz.classId) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress/${quiz.classId}`,
          );
          if (res.ok) {
            const json = await res.json();
            const level = json.data?.tingkatanSaatIni;
            setUserLevel(typeof level === "number" && level >= 1 ? level : 1);
          }
        } catch {
          setUserLevel(1);
        }
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/kuis/${quizId}/soal`,
        );
        if (res.ok) {
          const json = await res.json();
          setSoalList(json.data ?? []);
        }
      } catch {
        setSoalList([]);
      }

      if (user?.id) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/kuis/${quizId}/hasil/${user.id}`,
          );
          if (res.ok) {
            const json = await res.json();
            if (json.sudahMengerjakan) {
              setSudahMengerjakan(true);
              setSkorSebelumnya(json.data.skor);
            }
          }
        } catch {
          // abaikan
        }
      }

      setProgressLoading(false);
    };

    fetchAll();
  }, [quiz, user?.id, user?.role, quizId]);

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!user?.id || !quizId || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/kuis/${quizId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_user: Number(user.id), jawaban }),
        },
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Gagal submit");
      setHasilSkor(json.data);
      setTahap("selesai");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengumpulkan jawaban");
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, quizId, jawaban, isSubmitting]);

  // ── Timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (tahap !== "mengerjakan") return;
    setSisaWaktu((quiz?.durasi ?? 60) * 60);
  }, [tahap, quiz?.durasi]);

  useEffect(() => {
    if (tahap !== "mengerjakan" || sisaWaktu <= 0) return;

    const timer = setInterval(() => {
      setSisaWaktu((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tahap, sisaWaktu, handleSubmit]);

  const formatWaktu = (detik: number) => {
    const m = Math.floor(detik / 60)
      .toString()
      .padStart(2, "0");
    const s = (detik % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Loading / Error ────────────────────────────────────────────
  if (quizLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <p className="text-gray-500">Memuat kuis...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="p-8 text-center">
            <p className="text-red-500">{error ?? "Kuis tidak ditemukan"}</p>
          </Card>
        </div>
      </div>
    );
  }

  const quizLevel =
    typeof quiz.level === "number" && quiz.level >= 1 ? quiz.level : 1;
  const hasAccess = user?.role === "superadmin" || quizLevel <= userLevel;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Selesaikan tingkatan sebelumnya untuk mengakses kuis ini.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="mt-4">
              Kembali ke Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const soalSekarang = soalList[soalAktif];
  const sudahJawabSemua = soalList.every((s) => jawaban[s.id_soal]);

  // ── TAHAP: MENGERJAKAN ─────────────────────────────────────────
  if (tahap === "mengerjakan") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">{quiz.title}</h2>
              <p className="text-sm text-gray-500">
                Soal {soalAktif + 1} dari {soalList.length}
              </p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg ${
                sisaWaktu < 60
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
            >
              <Clock className="h-5 w-5" />
              {formatWaktu(sisaWaktu)}
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-6">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((soalAktif + 1) / soalList.length) * 100}%` }}
            />
          </div>

          <Card className="p-6 mb-4">
            <p className="text-lg font-semibold mb-6">
              {soalSekarang?.pertanyaan}
            </p>
            <div className="space-y-3">
              {(["a", "b", "c", "d"] as const).map((opsi) => {
                const teks = soalSekarang?.[`opsi_${opsi}`];
                const dipilih = jawaban[soalSekarang?.id_soal] === opsi;
                return (
                  <button
                    key={opsi}
                    onClick={() =>
                      setJawaban((prev) => ({
                        ...prev,
                        [soalSekarang.id_soal]: opsi,
                      }))
                    }
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      dipilih
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                    }`}
                  >
                    <span className="font-bold uppercase mr-3">{opsi}.</span>
                    {teks}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex flex-wrap gap-2 mb-4">
            {soalList.map((s, i) => (
              <button
                key={s.id_soal}
                onClick={() => setSoalAktif(i)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                  i === soalAktif
                    ? "bg-blue-600 text-white"
                    : jawaban[s.id_soal]
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setSoalAktif((p) => Math.max(0, p - 1))}
              disabled={soalAktif === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Sebelumnya
            </Button>

            {soalAktif < soalList.length - 1 ? (
              <Button onClick={() => setSoalAktif((p) => p + 1)}>
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting
                  ? "Mengumpulkan..."
                  : sudahJawabSemua
                    ? "Kumpulkan"
                    : `Kumpulkan (${Object.keys(jawaban).length}/${soalList.length})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── TAHAP: SELESAI ─────────────────────────────────────────────
  if (tahap === "selesai" && hasilSkor) {
    const lulus = hasilSkor.skor >= 70;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-6">
          <Card className="p-8 text-center">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                lulus
                  ? "bg-green-100 dark:bg-green-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              }`}
            >
              <Trophy
                className={`h-12 w-12 ${
                  lulus
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              />
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {lulus ? "Selamat! 🎉" : "Belum Lulus"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {lulus
                ? "Kamu berhasil menyelesaikan kuis ini."
                : "Jangan menyerah, coba lagi untuk hasil yang lebih baik."}
            </p>

            <div
              className={`inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold mb-8 ${
                lulus
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {hasilSkor.skor}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">
                  {hasilSkor.benar}
                </p>
                <p className="text-sm text-gray-500">Benar</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-2xl font-bold text-red-500">
                  {hasilSkor.total - hasilSkor.benar}
                </p>
                <p className="text-sm text-gray-500">Salah</p>
              </div>
            </div>

            <Button
              onClick={() => navigate(`/class/${quiz.classId}`)}
              className="w-full max-w-xs text-base py-6"
            >
              Kembali ke Kelas
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── TAHAP: INFO ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardHeader />

      <div className="container mx-auto px-4 md:px-6 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${quiz.classId}`)}
          className="mb-4 text-base"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Kembali ke Kelas
        </Button>

        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex items-center gap-2 justify-center mb-3">
                <Badge variant="secondary">
                  Pertemuan {quiz.meetingNumber}
                </Badge>
                <Badge variant="outline">Level {quizLevel}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-6 space-y-3">
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600 dark:text-gray-400">Durasi</span>
                <span className="font-bold">{quiz.durasi ?? 60} menit</span>
              </div>
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-600 dark:text-gray-400">
                  Jumlah Soal
                </span>
                <span className="font-bold">{soalList.length} soal</span>
              </div>
            </div>

            {/* Sudah mengerjakan */}
            {sudahMengerjakan && (
              <Card className="p-5 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-green-900 dark:text-green-100">
                      Sudah Dikerjakan
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Skor kamu: <strong>{skorSebelumnya}</strong>/100
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Petunjuk */}
            <Card className="p-5 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                📋 Petunjuk Pengerjaan
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Pastikan koneksi internet stabil sebelum memulai</li>
                <li>Timer akan berjalan saat kamu klik Mulai Kuis</li>
                <li>Kuis akan otomatis dikumpulkan saat waktu habis</li>
                <li>Kamu bisa navigasi antar soal sebelum mengumpulkan</li>
              </ul>
            </Card>

            {/* Tombol */}
            {soalList.length > 0 ? (
              <Button
                onClick={() => setTahap("mengerjakan")}
                className="w-full text-base py-6"
              >
                {sudahMengerjakan ? "Kerjakan Ulang" : "Mulai Kuis"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full text-base py-6"
                disabled
              >
                Soal belum tersedia
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
