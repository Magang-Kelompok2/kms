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
  AlertCircle,
  Star,
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

// Tipe soal yang sudah diacak opsinya
interface SoalAcak extends SoalKuis {
  opsiAcak: { key: "a" | "b" | "c" | "d"; teks: string }[];
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
  duration?: number;
  questions?: SoalKuis[];
}

type TahapKuis = "info" | "mengerjakan" | "selesai";

const OPSI_LABEL = ["A", "B", "C", "D"];
const OPSI_COLOR = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
];

// Fungsi Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function QuizViewPage() {
  const { quizId } = useParams();
  const { user, token } = useAuth();
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

  // State soal yang sudah diacak (soal & opsi) — dibuat saat klik Mulai Kuis
  const [soalAcakList, setSoalAcakList] = useState<SoalAcak[]>([]);

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
            { headers: { Authorization: `Bearer ${token}` } },
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
        } catch {}
      }
      setProgressLoading(false);
    };
    fetchAll();
  }, [quiz, user?.id, user?.role, quizId, token]);

  // ── Fungsi mulai kuis: acak soal & opsi ───────────────────────
  const handleMulaiKuis = useCallback(() => {
    // Acak urutan soal
    const soalTeracak = shuffleArray(soalList).map((soal) => {
      // Acak urutan opsi, tapi simpan key aslinya agar jawaban ke backend tetap benar
      const opsiRaw: { key: "a" | "b" | "c" | "d"; teks: string }[] = [
        { key: "a", teks: soal.opsi_a },
        { key: "b", teks: soal.opsi_b },
        { key: "c", teks: soal.opsi_c },
        { key: "d", teks: soal.opsi_d },
      ];
      return {
        ...soal,
        opsiAcak: shuffleArray(opsiRaw),
      };
    });
    setSoalAcakList(soalTeracak);
    setSoalAktif(0);
    setJawaban({});
    setTahap("mengerjakan");
  }, [soalList]);

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

      // Update progress jika lulus (skor >= 70)
      if (json.data.skor >= 70 && quiz?.classId && quiz?.level) {
        try {
          await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/${user.id}/progress/${quiz.classId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ tingkatanSaatIni: quiz.level + 1 }),
            },
          );
        } catch {
          // abaikan error progress, tetap tampilkan hasil
        }
      }

      setHasilSkor(json.data);
      setTahap("selesai");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengumpulkan jawaban");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user?.id,
    quizId,
    jawaban,
    isSubmitting,
    token,
    quiz?.classId,
    quiz?.level,
  ]);

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
          window.clearInterval(timer);
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

  // ── Loading ────────────────────────────────────────────────────
  if (quizLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-16 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Memuat kuis...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <Card className="p-10 text-center border-red-100 dark:border-red-900">
            <AlertCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-gray-500">{error ?? "Kuis tidak ditemukan"}</p>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="mt-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const quizLevel =
    typeof quiz.level === "number" && quiz.level >= 1 ? quiz.level : 1;
  const hasAccess = user?.role === "superadmin" || quizLevel <= userLevel;

  // ── Akses Ditolak ──────────────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-16">
          <Card className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Akses Ditolak</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Selesaikan tingkatan sebelumnya untuk mengakses kuis ini.
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Gunakan soalAcakList saat mengerjakan, fallback ke soalList
  const soalAktifData = soalAcakList[soalAktif] ?? soalList[soalAktif];
  const sudahJawabSemua = soalAcakList.every((s) => jawaban[s.id_soal]);
  const jumlahDijawab = Object.keys(jawaban).length;
  const waktuKritis = sisaWaktu < 60;

  // ── TAHAP: MENGERJAKAN ─────────────────────────────────────────
  if (tahap === "mengerjakan") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <DashboardHeader />
        <div className="container mx-auto max-w-3xl px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {quiz.title}
              </h2>
              <p className="text-sm text-gray-500">
                Soal{" "}
                <span className="font-semibold text-blue-600">
                  {soalAktif + 1}
                </span>{" "}
                dari {soalAcakList.length}
                {" · "}
                <span className="text-emerald-600 font-semibold">
                  {jumlahDijawab} dijawab
                </span>
              </p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-mono font-bold text-lg shadow-sm transition-all ${
                waktuKritis
                  ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 animate-pulse"
                  : "bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900"
              }`}
            >
              <Clock className="h-5 w-5" />
              {formatWaktu(sisaWaktu)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${waktuKritis ? "bg-red-500" : "bg-blue-500"}`}
              style={{
                width: `${((soalAktif + 1) / soalAcakList.length) * 100}%`,
              }}
            />
          </div>

          {/* Soal Card */}
          <Card className="p-6 mb-4 shadow-md border-0 bg-white dark:bg-gray-900">
            <div className="flex items-start gap-3 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                {soalAktif + 1}
              </span>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100 leading-relaxed pt-0.5">
                {soalAktifData?.pertanyaan}
              </p>
            </div>

            {/* Opsi — render dari opsiAcak agar urutan acak */}
            <div className="space-y-3">
              {soalAktifData?.opsiAcak?.map((opsi, idx) => {
                const dipilih = jawaban[soalAktifData.id_soal] === opsi.key;
                return (
                  <button
                    key={opsi.key}
                    onClick={() =>
                      setJawaban((prev) => ({
                        ...prev,
                        [soalAktifData.id_soal]: opsi.key,
                      }))
                    }
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      dipilih
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500 shadow-sm"
                        : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                        dipilih
                          ? `bg-gradient-to-br ${OPSI_COLOR[idx]} text-white shadow`
                          : "bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600"
                      }`}
                    >
                      {OPSI_LABEL[idx]}
                    </span>
                    <span
                      className={`text-sm font-medium ${dipilih ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {opsi.teks}
                    </span>
                    {dipilih && (
                      <CheckCircle className="h-4 w-4 text-blue-500 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Navigasi soal */}
          <div className="flex flex-wrap gap-2 mb-5">
            {soalAcakList.map((s, i) => (
              <button
                key={s.id_soal}
                onClick={() => setSoalAktif(i)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  i === soalAktif
                    ? "bg-blue-600 text-white shadow-md scale-110"
                    : jawaban[s.id_soal]
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200"
                      : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700 hover:border-blue-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Tombol navigasi */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setSoalAktif((p) => Math.max(0, p - 1))}
              disabled={soalAktif === 0}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
            </Button>

            {soalAktif < soalAcakList.length - 1 ? (
              <Button
                onClick={() => setSoalAktif((p) => p + 1)}
                className="flex-1"
              >
                Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 text-white font-semibold ${
                  sudahJawabSemua
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />{" "}
                    Mengumpulkan...
                  </>
                ) : sudahJawabSemua ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Kumpulkan Jawaban
                  </>
                ) : (
                  `Kumpulkan (${jumlahDijawab}/${soalAcakList.length})`
                )}
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
    const salah = hasilSkor.total - hasilSkor.benar;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <DashboardHeader />
        <div className="container mx-auto max-w-2xl px-4 py-10">
          <Card className="overflow-hidden shadow-xl border-0">
            <div
              className={`h-3 w-full ${lulus ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`}
            />

            <div className="p-8 text-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg ${
                  lulus
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                    : "bg-gradient-to-br from-red-400 to-rose-500"
                }`}
              >
                <Trophy className="h-12 w-12 text-white" />
              </div>

              <h1 className="text-3xl font-extrabold mb-1">
                {lulus ? "Selamat! 🎉" : "Belum Lulus"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                {lulus
                  ? "Kamu berhasil menyelesaikan kuis ini dengan baik."
                  : "Sayang sekali, kamu belum mencapai nilai minimum."}
              </p>

              {/* Skor */}
              <div
                className={`inline-flex flex-col items-center justify-center w-36 h-36 rounded-full text-5xl font-extrabold mb-8 shadow-inner ${
                  lulus
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 ring-4 ring-emerald-200 dark:ring-emerald-800"
                    : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400 ring-4 ring-red-200 dark:ring-red-800"
                }`}
              >
                {hasilSkor.skor}
                <span className="text-sm font-medium text-gray-400 mt-1">
                  / 100
                </span>
              </div>

              {/* Statistik */}
              <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm mx-auto">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <p className="text-2xl font-bold text-blue-600">
                    {hasilSkor.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total Soal</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900">
                  <p className="text-2xl font-bold text-emerald-600">
                    {hasilSkor.benar}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Benar</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900">
                  <p className="text-2xl font-bold text-red-500">{salah}</p>
                  <p className="text-xs text-gray-500 mt-1">Salah</p>
                </div>
              </div>

              {/* Badge lulus/tidak */}
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 ${
                  lulus
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {lulus ? (
                  <>
                    <Star className="h-4 w-4" /> Lulus (min. 70)
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" /> Belum lulus (min. 70)
                  </>
                )}
              </div>

              <div className="max-w-sm mx-auto">
                <Button
                  onClick={() => navigate(`/class/${quiz.classId}`)}
                  className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                >
                  Kembali ke Kelas
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── TAHAP: INFO ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
      <DashboardHeader />
      <div className="container mx-auto px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/class/${quiz.classId}`)}
          className="mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Kembali ke Kelas
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden shadow-xl border-0">
            <div className="h-2 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-600" />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Pertemuan {quiz.meetingNumber}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Level {quizLevel}
                  </Badge>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                  {quiz.title}
                </h1>
                {quiz.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {quiz.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-100 dark:border-blue-900">
                  <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {quiz.durasi ?? 60}
                  </p>
                  <p className="text-xs text-gray-500">Menit</p>
                </div>
                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 text-center border border-violet-100 dark:border-violet-900">
                  <FileText className="h-5 w-5 text-violet-500 mx-auto mb-1" />
                  <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                    {soalList.length}
                  </p>
                  <p className="text-xs text-gray-500">Soal</p>
                </div>
              </div>

              {/* Info sudah mengerjakan */}
              {sudahMengerjakan && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mb-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">
                      Sudah Dikerjakan
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                      Skor terakhir: <strong>{skorSebelumnya}/100</strong>
                      {(skorSebelumnya ?? 0) >= 70 ? " ✅ Lulus" : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* Petunjuk */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 mb-6 border border-gray-100 dark:border-gray-800">
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-3">
                  📋 Petunjuk Pengerjaan
                </p>
                <ul className="space-y-2">
                  {[
                    "Pastikan koneksi internet stabil sebelum memulai",
                    "Timer mulai berjalan saat kamu klik Mulai Kuis",
                    "Urutan soal dan pilihan jawaban diacak setiap sesi",
                    "Kuis otomatis dikumpulkan saat waktu habis",
                    "Kamu hanya bisa mengerjakan kuis ini satu kali",
                  ].map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tombol mulai / info sudah dikerjakan */}
              {soalList.length > 0 ? (
                sudahMengerjakan ? (
                  <div className="w-full py-4 px-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
                    <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
                      Kuis sudah dikerjakan
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Kamu hanya bisa mengerjakan kuis ini satu kali
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleMulaiKuis}
                    className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg shadow-blue-200 dark:shadow-none"
                  >
                    <Trophy className="h-5 w-5 mr-2" /> Mulai Kuis
                  </Button>
                )
              ) : (
                <Button
                  variant="outline"
                  className="w-full py-6 text-base"
                  disabled
                >
                  Soal belum tersedia
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
