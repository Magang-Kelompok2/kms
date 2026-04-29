import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useClasses } from "../hooks/useClasses";
import { UserProgressSkeleton } from "../components/PageSkeletons";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  Loader2,
  X,
  Filter,
  PlusCircle,
  Edit3,
  Save,
  Trash2,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ProgressEntry {
  id: number | null;
  classId: string;
  className: string;
  currentLevel: number;
  progressPercent: number;
  completedMaterialCount: number;
  totalMaterialCount: number;
  completedAssignmentCount: number;
  totalAssignmentCount: number;
  completedQuizCount: number;
  totalQuizCount: number;
  updatedAt: string | null;
}

interface SubmissionItem {
  id: number;
  classId: string;
  title: string;
  answer: string | null;
  file: { name: string; objectKey: string; size: number; url?: string } | null;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  user_pengumpulan?: { score: number | null; feedback: string | null };
}

interface EnrollmentItem {
  classId: string;
  className: string;
  namaTingkatan: string;
  level: number;
}

interface TingkatanOption {
  id_tingkatan: number;
  nama_tingkatan: string;
}

const PAGE_SIZE = 9;

export function UserProgressPage() {
  const { userId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { classes } = useClasses();
  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // --- TAMBAHAN: State enrollment management ---
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [allTingkatan, setAllTingkatan] = useState<Record<string, TingkatanOption[]>>({});
  const [selectedTingkatan, setSelectedTingkatan] = useState<Record<string, number>>({});
  const [savingClass, setSavingClass] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [deletingClass, setDeletingClass] = useState<string | null>(null);

  // --- TAMBAHAN: State modal tambah kelas ---
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addClassId, setAddClassId] = useState<string>("");
  const [addTingkatanId, setAddTingkatanId] = useState<number | "">("");
  const [addTingkatanOptions, setAddTingkatanOptions] = useState<TingkatanOption[]>([]);
  const [addingClass, setAddingClass] = useState(false);
  const [loadingAddTingkatan, setLoadingAddTingkatan] = useState(false);

  // --- TAMBAHAN: State file preview modal ---
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);

  // --- TAMBAHAN: State scoring modal ---
  const [scoringOpen, setScoringOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [inputScore, setInputScore] = useState("");
  const [inputFeedback, setInputFeedback] = useState("");

  // --- TAMBAHAN: State class filter submissions ---
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  const offset = (currentPage - 1) * PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalSubmissions / PAGE_SIZE));

  // --- TAMBAHAN: Fungsi fetch enrollments & tingkatan ---
  const fetchEnrollmentsAndTingkatan = async () => {
    if (!token || !userId) return;
    const eRes = await fetch(
      `${import.meta.env.VITE_API_URL}/api/users/${userId}/enrollments`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!eRes.ok) {
      setEnrollments([]);
      return;
    }
    let eJson: any;
    try {
      eJson = await eRes.json();
    } catch {
      setEnrollments([]);
      return;
    }
    const enrollmentData: EnrollmentItem[] = eJson.data ?? [];
    const grouped: Record<string, EnrollmentItem> = {};
    for (const e of enrollmentData) {
      if (!grouped[e.classId] || e.level > grouped[e.classId].level) {
        grouped[e.classId] = e;
      }
    }
    const groupedEnrollments = Object.values(grouped);
    setEnrollments(groupedEnrollments);
    const uniqueClassIds = Object.keys(grouped);
    const tingkatanByClass: Record<string, TingkatanOption[]> = {};
    await Promise.all(
      uniqueClassIds.map(async (classId) => {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/kelas/${classId}/levels`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const json = await res.json();
          tingkatanByClass[classId] = (json.data ?? []).map((l: any) => ({
            id_tingkatan: Number(l.id),
            nama_tingkatan: l.namaLevel,
          }));
        }
      }),
    );
    setAllTingkatan(tingkatanByClass);
    const defaultSelected: Record<string, number> = {};
    for (const e of groupedEnrollments) {
      const tingkatanList = tingkatanByClass[e.classId] ?? [];
      const matched = tingkatanList.find((t) => t.nama_tingkatan === e.namaTingkatan);
      if (matched) defaultSelected[e.classId] = matched.id_tingkatan;
    }
    setSelectedTingkatan(defaultSelected);
  };

  // --- TAMBAHAN: Load tingkatan saat pilih kelas di modal ---
  const handleAddClassChange = async (classId: string) => {
    setAddClassId(classId);
    setAddTingkatanId("");
    setAddTingkatanOptions([]);
    if (!classId || !token) return;
    setLoadingAddTingkatan(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/kelas/${classId}/levels`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const json = await res.json();
        setAddTingkatanOptions(
          (json.data ?? []).map((l: any) => ({
            id_tingkatan: Number(l.id),
            nama_tingkatan: l.namaLevel,
          })),
        );
      }
    } finally {
      setLoadingAddTingkatan(false);
    }
  };

  // --- TAMBAHAN: Tambah kelas ke user ---
  const handleAddClass = async () => {
    if (!addClassId || !addTingkatanId || !token || !userId) return;
    setAddingClass(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}/enrollments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id_kelas: Number(addClassId), id_tingkatan: addTingkatanId }),
        },
      );
      if (res.ok) {
        setAddClassOpen(false);
        setAddClassId("");
        setAddTingkatanId("");
        setAddTingkatanOptions([]);
        try { await fetchEnrollmentsAndTingkatan(); } catch { /* silent */ }
      } else {
        let msg = `Status ${res.status}`;
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch { /* HTML response */ }
        alert("Gagal menambah kelas: " + msg);
      }
    } finally {
      setAddingClass(false);
    }
  };

  // --- TAMBAHAN: Simpan perubahan tingkatan ---
  const handleSaveTingkatan = async (classId: string) => {
    if (!token || !userId) return;
    const id_tingkatan = selectedTingkatan[classId];
    if (!id_tingkatan) return;
    setSavingClass(classId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}/enrollments`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id_kelas: Number(classId), id_tingkatan }),
        },
      );
      if (res.ok) {
        const tingkatanList = allTingkatan[classId] ?? [];
        const matched = tingkatanList.find((t) => t.id_tingkatan === id_tingkatan);
        if (matched) {
          setEnrollments((prev) =>
            prev.map((e) =>
              e.classId === classId ? { ...e, namaTingkatan: matched.nama_tingkatan } : e,
            ),
          );
        }
        setSaveSuccess(classId);
        setTimeout(() => setSaveSuccess(null), 2000);
      } else {
        let msg = `Status ${res.status}`;
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch { /* HTML response */ }
        alert("Gagal menyimpan tingkatan: " + msg);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") alert("Terjadi kesalahan saat menyimpan tingkatan.");
    } finally {
      setSavingClass(null);
    }
  };

  // --- TAMBAHAN: Hapus kelas dari user ---
  const handleDeleteClass = async (classId: string, className: string) => {
    if (!token || !userId) return;
    if (!window.confirm(`Hapus kelas "${className}" dari user ini?`)) return;
    setDeletingClass(classId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${userId}/enrollments/${classId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        setEnrollments((prev) => prev.filter((e) => e.classId !== classId));
        setAllTingkatan((prev) => { const next = { ...prev }; delete next[classId]; return next; });
        setSelectedTingkatan((prev) => { const next = { ...prev }; delete next[classId]; return next; });
      } else {
        let msg = `Status ${res.status}`;
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch { /* HTML response */ }
        alert("Gagal menghapus kelas: " + msg);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") alert("Terjadi kesalahan saat menghapus kelas.");
    } finally {
      setDeletingClass(null);
    }
  };

  // --- TAMBAHAN: Simpan nilai submission ---
  const handleUpdateScore = async () => {
    if (!selectedSub || !token || !userId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/pengumpulan/score/${userId}/${selectedSub.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            score: inputScore !== "" ? Number(inputScore) : null,
            feedback: inputFeedback,
          }),
        },
      );
      if (res.ok) {
        setScoringOpen(false);
      } else {
        let msg = `Status ${res.status}`;
        try { const d = await res.json(); msg = d.error || d.message || msg; } catch { /* HTML response */ }
        alert("Gagal menyimpan nilai: " + msg);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") console.error("Error updating score:", err);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [userId]);

  useEffect(() => {
    if (!token) return;
    if (user?.role !== "superadmin") {
      navigate("/dashboard");
      return;
    }
    if (!userId) return;

    const controller = new AbortController();

    const fetchBaseData = async () => {
      setBaseLoading(true);
      setSystemError(null);

      try {
        const [userRes, progressRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/progress`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userRes.ok) {
          const json = await userRes.json();
          throw new Error(json.error || "Gagal mengambil pengguna");
        }

        if (!progressRes.ok) {
          const json = await progressRes.json();
          throw new Error(json.error || "Gagal mengambil progress user");
        }

        const userJson = await userRes.json();
        const progressJson = await progressRes.json();

        setTargetUser(userJson.data ?? null);
        setProgress(progressJson.data ?? []);
        try {
          await fetchEnrollmentsAndTingkatan();
        } catch {
          // Enrollment fetch gagal — tidak ganggu tampilan utama
          setEnrollments([]);
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setSystemError(error.message ?? "Terjadi kesalahan saat memuat data");
        }
      } finally {
        setBaseLoading(false);
      }
    };

    fetchBaseData();
    return () => controller.abort();
  }, [navigate, token, user?.role, userId]);

  useEffect(() => {
    if (!token || !userId || user?.role !== "superadmin") return;

    const controller = new AbortController();

    const fetchSubmissions = async () => {
      setSubmissionsLoading(true);
      setSystemError(null);

      try {
        const submissionsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pengumpulan/user/${userId}?limit=${PAGE_SIZE}&offset=${offset}`,
          {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!submissionsRes.ok) {
          const json = await submissionsRes.json();
          throw new Error(json.error || "Gagal mengambil pengumpulan user");
        }

        const submissionsJson = await submissionsRes.json();
        setSubmissions(submissionsJson.data ?? []);
        setTotalSubmissions(submissionsJson.total ?? 0);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          setSystemError(error.message ?? "Terjadi kesalahan saat memuat data");
        }
      } finally {
        setSubmissionsLoading(false);
      }
    };

    fetchSubmissions();
    return () => controller.abort();
  }, [offset, token, user?.role, userId]);

  const classNameMap = useMemo(
    () =>
      Object.fromEntries(classes.map((item) => [String(item.id), item.name])),
    [classes],
  );

  const normalizedSubmissions = useMemo(
    () =>
      submissions.map((submission) => ({
        ...submission,
        className:
          classNameMap[String(submission.classId)] ?? "Kelas tidak diketahui",
      })),
    [classNameMap, submissions],
  );

  // --- TAMBAHAN: Kelas yang belum diikuti user (untuk modal tambah kelas) ---
  const availableClasses = useMemo(() => {
    const enrolledClassIds = new Set(enrollments.map((e) => e.classId));
    return classes.filter((c) => !enrolledClassIds.has(String(c.id)));
  }, [classes, enrollments]);

  // --- TAMBAHAN: Filter submission berdasarkan kelas ---
  const filteredSubmissions = useMemo(() => {
    if (selectedClassFilter === "all") return normalizedSubmissions;
    return normalizedSubmissions.filter((s) => String(s.classId) === selectedClassFilter);
  }, [normalizedSubmissions, selectedClassFilter]);

  if (baseLoading) {
    return (
      <AppLayout>
        <UserProgressSkeleton />
      </AppLayout>
    );
  }

  if (systemError) {
    return (
      <AppLayout>
        <Card className="p-6 text-center text-red-600">{systemError}</Card>
      </AppLayout>
    );
  }

  if (!targetUser) {
    return (
      <AppLayout>
        <Card className="p-6 text-center">Pengguna tidak ditemukan.</Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Button
        variant="ghost"
        onClick={() => navigate("/users")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali ke Laman Pengguna
      </Button>

      <Card className="p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] flex items-center justify-center text-white text-xl font-semibold">
            {targetUser.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {targetUser.username}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {targetUser.email}
            </p>

            <div className="flex gap-6 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span>
                Bergabung:{" "}
                {new Date(targetUser.createdAt).toLocaleDateString()}
              </span>
              <span>Total Pengumpulan: {totalSubmissions}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* --- TAMBAHAN: Kelola Akses Kelas --- */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-black text-slate-800">Kelola Akses Kelas</h2>
          {availableClasses.length > 0 && (
            <Button
              onClick={() => setAddClassOpen(true)}
              className="bg-[#0C4E8C] hover:bg-[#093d6d] rounded-xl font-black"
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Kelas
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-400 font-bold mb-4">
          Atur kelas dan tingkatan yang dapat diakses user
        </p>
        {enrollments.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold text-sm">
              User belum terdaftar di kelas manapun.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => {
              const tingkatanList = allTingkatan[enrollment.classId] ?? [];
              const isSaving = savingClass === enrollment.classId;
              const isSuccess = saveSuccess === enrollment.classId;
              const isDeleting = deletingClass === enrollment.classId;
              return (
                <Card key={enrollment.classId} className="p-5 border-none shadow-md rounded-2xl bg-white">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Kelas</p>
                      <h3 className="text-base font-black text-slate-800">{enrollment.className}</h3>
                    </div>
                    <button
                      onClick={() => handleDeleteClass(enrollment.classId, enrollment.className)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Hapus kelas"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tingkatan Akses</p>
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 mb-4 cursor-pointer"
                    value={selectedTingkatan[enrollment.classId] ?? ""}
                    onChange={(e) =>
                      setSelectedTingkatan((prev) => ({
                        ...prev,
                        [enrollment.classId]: Number(e.target.value),
                      }))
                    }
                  >
                    {tingkatanList.length === 0 && <option value="">Memuat...</option>}
                    {tingkatanList.map((t) => (
                      <option key={t.id_tingkatan} value={t.id_tingkatan}>
                        {t.nama_tingkatan}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => handleSaveTingkatan(enrollment.classId)}
                    disabled={isSaving || tingkatanList.length === 0}
                    className={`w-full rounded-xl font-black py-5 transition-all duration-300 ${
                      isSuccess ? "bg-emerald-500 hover:bg-emerald-600" : "bg-[#0C4E8C] hover:bg-[#093d6d]"
                    }`}
                  >
                    {isSaving ? "Menyimpan..." : isSuccess ? (
                      <><CheckCircle className="mr-2 h-4 w-4" /> Tersimpan</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Simpan</>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Progress Kelas</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {progress.map((item) => (
            <Card key={item.id} className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {item.className}
                  </h3>
                  <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                    {item.progressPercent}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Materi {item.completedMaterialCount}/{item.totalMaterialCount}
                  </span>
                  <span>
                    Tugas {item.completedAssignmentCount}/{item.totalAssignmentCount}
                  </span>
                  <span>
                    Kuis {item.completedQuizCount}/{item.totalQuizCount}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progress terakhir diupdate{" "}
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </Card>
          ))}
          {progress.length === 0 && (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Belum ada data progress untuk pengguna ini.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* --- TAMBAHAN: Filter kelas untuk submission --- */}
      <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-full md:w-80 mb-6">
        <Filter className="h-4 w-4 text-[#0C4E8C]" />
        <select
          className="text-sm font-bold w-full outline-none bg-transparent cursor-pointer text-slate-600"
          value={selectedClassFilter}
          onChange={(e) => setSelectedClassFilter(e.target.value)}
        >
          <option value="all">Semua Mata Kuliah</option>
          {classes.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Pengumpulan</h2>
          {submissionsLoading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat halaman...
            </span>
          )}
        </div>

        {submissionsLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-60 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubmissions.map((submission) => {
              const status: SubmissionItem["status"] = submission.status;
              const statusConfig =
                status === "approved"
                  ? {
                      label: "approved",
                      className:
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                      icon: <CheckCircle className="h-3 w-3" />,
                    }
                  : status === "rejected"
                    ? {
                        label: "rejected",
                        className:
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                        icon: <XCircle className="h-3 w-3" />,
                      }
                    : {
                        label: "pending",
                        className:
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-600",
                        icon: <Clock className="h-3 w-3" />,
                      };

              return (
                <Card
                  key={submission.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-24 bg-gradient-to-br from-[#0C4E8C] to-[#11C4D4] p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-xs font-medium uppercase tracking-wide">
                        {submission.title ? "Pengumpulan" : "Tugas"}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusConfig.className}`}
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">
                      {submission.title || "Pengumpulan Tugas"}
                    </h3>
                  </div>

                  <div className="flex flex-col flex-1 p-4 gap-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {submission.className}
                    </p>

                    {submission.answer && (
                      <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span>{submission.answer}</span>
                      </div>
                    )}

                    {submission.file && submission.file.url ? (
                      <div
                        onClick={() => {
                          setPreviewFile({ name: submission.file!.name, url: submission.file!.url! });
                          setFilePreviewOpen(true);
                        }}
                        className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer hover:bg-blue-50 border border-slate-100 transition-all"
                      >
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-xs truncate font-medium text-slate-600">{submission.file.name}</span>
                        <span className="ml-auto text-[10px] font-bold text-blue-600 uppercase">Preview</span>
                      </div>
                    ) : submission.file ? (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        File: {submission.file.name}
                      </p>
                    ) : null}

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Dikirim: {new Date(submission.createdAt).toLocaleString()}
                    </p>

                    {/* --- TAMBAHAN: Scoring section --- */}
                    {submission.user_pengumpulan !== undefined && (
                      <div className="border-t border-slate-100 pt-4 mt-2">
                        {submission.user_pengumpulan.score !== null && (
                          <div className="mb-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-100/50 p-3.5 flex flex-col gap-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest">Nilai Akhir</span>
                              <div className="bg-white text-[#0C4E8C] px-3 py-1 rounded-full text-sm font-black shadow-sm border border-blue-100 flex items-center gap-1">
                                <span>{submission.user_pengumpulan.score}</span>
                                <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
                              </div>
                            </div>
                            {submission.user_pengumpulan.feedback && (
                              <div className="bg-white/60 p-3 rounded-lg border border-white/40 text-xs text-slate-600 relative overflow-hidden group hover:bg-white/90 transition-colors">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-300 rounded-l-lg"></div>
                                <span className="font-bold not-italic text-slate-700 block mb-1.5 flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Feedback Mentor
                                </span>
                                <p className="leading-relaxed italic pl-1">"{submission.user_pengumpulan.feedback}"</p>
                              </div>
                            )}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className={`w-full text-xs rounded-xl h-10 font-bold transition-all shadow-sm ${
                            submission.user_pengumpulan.score !== null 
                              ? "bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50" 
                              : "bg-[#0C4E8C] hover:bg-[#093d6d] text-white hover:shadow-md"
                          }`}
                          onClick={() => {
                            setSelectedSub(submission);
                            setInputScore(submission.user_pengumpulan?.score?.toString() || "");
                            setInputFeedback(submission.user_pengumpulan?.feedback || "");
                            setScoringOpen(true);
                          }}
                        >
                          {submission.user_pengumpulan.score !== null ? (
                            <><Edit3 className="h-4 w-4 mr-2" /> Edit Nilai & Feedback</>
                          ) : (
                            <><PlusCircle className="h-4 w-4 mr-2" /> Input Nilai & Feedback</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {filteredSubmissions.length === 0 && (
              <div className="col-span-full">
                <Card className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Belum ada pengumpulan.
                  </p>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || submissionsLoading}
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
            disabled={currentPage >= totalPages || submissionsLoading}
          >
            Selanjutnya
          </Button>
        </div>
      )}

      {/* --- TAMBAHAN: Modal Tambah Kelas --- */}
      {addClassOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl bg-white border-none">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Tambah Kelas</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setAddClassOpen(false); setAddClassId(""); setAddTingkatanId(""); setAddTingkatanOptions([]); }}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Pilih Kelas</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  value={addClassId}
                  onChange={(e) => handleAddClassChange(e.target.value)}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {availableClasses.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Pilih Tingkatan</label>
                <select
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                  value={addTingkatanId}
                  onChange={(e) => setAddTingkatanId(Number(e.target.value))}
                  disabled={!addClassId || loadingAddTingkatan}
                >
                  <option value="">{loadingAddTingkatan ? "Memuat..." : "-- Pilih Tingkatan --"}</option>
                  {addTingkatanOptions.map((t) => (
                    <option key={t.id_tingkatan} value={t.id_tingkatan}>{t.nama_tingkatan}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button
                variant="ghost"
                className="flex-1 h-14 rounded-2xl font-bold text-slate-500"
                onClick={() => { setAddClassOpen(false); setAddClassId(""); setAddTingkatanId(""); setAddTingkatanOptions([]); }}
              >
                Batal
              </Button>
              <Button
                className="flex-1 h-14 rounded-2xl font-black bg-[#0C4E8C] hover:bg-[#093d6d]"
                onClick={handleAddClass}
                disabled={!addClassId || !addTingkatanId || addingClass}
              >
                {addingClass ? "Menambahkan..." : "Tambah"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- TAMBAHAN: Modal Penilaian --- */}
      {scoringOpen && selectedSub && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl bg-white border-none">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Penilaian Tugas</h3>
              <Button variant="ghost" size="icon" onClick={() => setScoringOpen(false)} className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Skor (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inputScore}
                  onChange={(e) => setInputScore(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg outline-none focus:border-blue-500"
                  placeholder="Masukkan skor..."
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Feedback Mentor</label>
                <textarea
                  value={inputFeedback}
                  onChange={(e) => setInputFeedback(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none focus:border-blue-500 h-32 resize-none"
                  placeholder="Tulis masukan mentor di sini..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold text-slate-500" onClick={() => setScoringOpen(false)}>
                Batal
              </Button>
              <Button className="flex-1 h-14 rounded-2xl font-black bg-[#0C4E8C] hover:bg-[#093d6d]" onClick={handleUpdateScore}>
                Simpan Nilai
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* --- TAMBAHAN: Modal File Preview --- */}
      {filePreviewOpen && previewFile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 md:p-10">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-full flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText className="h-6 w-6 text-[#0C4E8C]" />
                </div>
                <h3 className="font-black text-slate-700 truncate max-w-xs md:max-w-xl">{previewFile.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFilePreviewOpen(false)}
                className="rounded-full h-12 w-12 hover:bg-rose-50 hover:text-rose-500"
              >
                <X className="h-8 w-8" />
              </Button>
            </div>
            <div className="flex-1 bg-slate-100">
              <iframe
                src={`${previewFile.url}#toolbar=0&navpanes=0`}
                className="w-full h-full border-none"
                title="Preview File"
              />
            </div>
            <div className="p-6 border-t flex justify-center bg-white">
              <Button className="px-12 h-12 rounded-full font-black bg-slate-800" onClick={() => setFilePreviewOpen(false)}>
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
