import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, ChevronDown, ChevronUp, Edit3, Trash2, Eye } from "lucide-react";
import type { Assignment, Quiz, Material, QuizQuestion } from "../types";
import { AddMaterialModal } from "./AddMaterialModal";
import { AddAssignmentModal } from "./AddAssignmentModal";
import { AddQuizModal } from "./AddQuizModal";

interface AdminLevelCardProps {
  level: number;
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
  classId: string;
  onAddMaterial: (material: Material) => void;
  onAddAssignment: (assignment: Assignment) => void;
  onAddQuiz: (quiz: Quiz) => void;
}

type LocalQuiz = Quiz & {
  description?: string;
  deadline?: string;
};

type MaterialEditDraft = {
  title: string;
  description: string;
  meetingNumber: string;
};

type QuizEditDraft = {
  id: string;
  title: string;
  duration: string;
  meetingNumber: string;
  description: string;
  deadline: string;
  questions: QuizQuestion[];
};

type LevelCardItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  number: number;
  extra?: string;
  type: "materi" | "tugas" | "kuis";
};

export function AdminLevelCard({
  level,
  namaLevel,
  materials,
  assignments,
  quizzes,
  classId,
  onAddMaterial,
  onAddAssignment,
  onAddQuiz,
}: AdminLevelCardProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"materi" | "tugas" | "kuis">("materi");
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [localMaterials, setLocalMaterials] = useState(materials);
  const [localAssignments, setLocalAssignments] = useState(assignments);
  const [localQuizzes, setLocalQuizzes] = useState<LocalQuiz[]>(
    quizzes.map((quiz) => ({
      ...quiz,
      description: quiz.questions?.length
        ? `Kuis ${quiz.questions.length} soal, durasi ${quiz.duration} menit`
        : "",
      deadline: "",
    })),
  );
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialEditDraft>({
    title: "",
    description: "",
    meetingNumber: "",
  });
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [quizDraft, setQuizDraft] = useState<QuizEditDraft | null>(null);

  useEffect(() => {
    setLocalMaterials(materials);
  }, [materials]);

  useEffect(() => {
    setLocalAssignments(assignments);
  }, [assignments]);

  useEffect(() => {
    setLocalQuizzes(
      quizzes.map((quiz) => ({
        ...quiz,
        description: quiz.questions?.length
          ? `Kuis ${quiz.questions.length} soal, durasi ${quiz.duration} menit`
          : "",
        deadline: "",
      })),
    );
  }, [quizzes]);

  const totalItems =
    localMaterials.length + localAssignments.length + localQuizzes.length;

  const itemsByTab: Record<"materi" | "tugas" | "kuis", LevelCardItem[]> = {
    materi: localMaterials.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      badge: `${item.files?.length ?? 0} files`,
      number: index + 1,
      type: "materi",
      extra: `Pertemuan ${item.meetingNumber}`,
    })),
    tugas: localAssignments.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      badge: `Pertemuan ${item.meetingNumber}`,
      number: index + 1,
      type: "tugas",
      extra: item.dueDate
        ? `Deadline ${new Date(item.dueDate).toLocaleDateString("id-ID")}`
        : "",
    })),
    kuis: localQuizzes.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description ?? "Tidak ada deskripsi",
      badge: `${item.duration} menit`,
      number: index + 1,
      type: "kuis",
      extra: `${item.questions?.length ?? 0} soal`,
    })),
  };

  const toggleItem = (id: string) => {
    setOpenItemId((current) => (current === id ? null : id));
    setEditingMaterialId(null);
    setEditingQuizId(null);
  };

  const beginEditMaterial = (material: Material) => {
    setEditingMaterialId(material.id);
    setOpenItemId(material.id);
    setMaterialDraft({
      title: material.title,
      description: material.description,
      meetingNumber: material.meetingNumber.toString(),
    });
  };

  const cancelEditMaterial = () => {
    setEditingMaterialId(null);
  };

  const saveMaterialEdit = (materialId: string) => {
    setLocalMaterials((prev) =>
      prev.map((item) =>
        item.id === materialId
          ? {
              ...item,
              title: materialDraft.title,
              description: materialDraft.description,
              meetingNumber: parseInt(materialDraft.meetingNumber) || item.meetingNumber,
            }
          : item,
      ),
    );
    setEditingMaterialId(null);
  };

  const deleteMaterial = (materialId: string) => {
    if (confirm("Hapus materi ini? Aksi ini tidak dapat dibatalkan.")) {
      setLocalMaterials((prev) => prev.filter((item) => item.id !== materialId));
      if (openItemId === materialId) setOpenItemId(null);
    }
  };

  const beginEditQuiz = (quiz: LocalQuiz) => {
    setEditingQuizId(quiz.id);
    setOpenItemId(quiz.id);
    setQuizDraft({
      id: quiz.id,
      title: quiz.title,
      duration: quiz.duration.toString(),
      meetingNumber: quiz.meetingNumber.toString(),
      description: quiz.description ?? "",
      deadline: quiz.deadline ?? "",
      questions: quiz.questions.map((q) => ({ ...q })),
    });
  };

  const cancelEditQuiz = () => {
    setEditingQuizId(null);
    setQuizDraft(null);
  };

  const saveQuizEdit = () => {
    if (!quizDraft) return;
    setLocalQuizzes((prev) =>
      prev.map((item) =>
        item.id === quizDraft.id
          ? {
              ...item,
              title: quizDraft.title,
              duration: parseInt(quizDraft.duration) || item.duration,
              meetingNumber: parseInt(quizDraft.meetingNumber) || item.meetingNumber,
              description: quizDraft.description,
              deadline: quizDraft.deadline,
              questions: quizDraft.questions,
            }
          : item,
      ),
    );
    setEditingQuizId(null);
    setQuizDraft(null);
  };

  const updateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    if (!quizDraft) return;
    const updatedQuestions = [...quizDraft.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuizDraft({ ...quizDraft, questions: updatedQuestions });
  };

  const addQuizQuestion = () => {
    if (!quizDraft) return;
    setQuizDraft({
      ...quizDraft,
      questions: [
        ...quizDraft.questions,
        { id: `q${Date.now()}`, question: "", options: ["", "", "", ""], correctAnswer: 0 },
      ],
    });
  };

  const removeQuizQuestion = (index: number) => {
    if (!quizDraft) return;
    setQuizDraft({
      ...quizDraft,
      questions: quizDraft.questions.filter((_, i) => i !== index),
    });
  };

  const deleteQuiz = (quizId: string) => {
    if (confirm("Hapus kuis ini? Aksi ini tidak dapat dibatalkan.")) {
      setLocalQuizzes((prev) => prev.filter((item) => item.id !== quizId));
      if (openItemId === quizId) setOpenItemId(null);
    }
  };

  const navigateToDetail = (type: "material" | "assignment" | "quiz", id: string) => {
    navigate(`/${type}/${id}`);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="w-full p-6 flex items-center justify-between gap-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <div className="flex items-center gap-8">
            <div className="w-21 h-21 rounded-2xl grid place-items-center text-white font-semibold text-2xl bg-linear-to-br from-[#0C4E8C] to-[#11C4D4]">
              {level}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400 mb-2">
                Tingkatan {level}
              </p>
              <h3 className="text-2xl font-bold">{namaLevel}</h3>

              <div className="flex items-center gap-4 mt-1">
          {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {totalItems} konten tersedia • Materi {materials.length} • Tugas {assignments.length} • Kuis {quizzes.length}
          </p> */}
          {/* Konten tersedia */}
          {/* <div className="p-2 w-fit h-fit rounded-lg bg-secondary">
            <p className="text-sm text-white">{totalItems} Konten tersedia</p>
          </div> */}
          {/* Jumlah Materi */}
          <div className="p-2 w-fit h-fit rounded-lg bg-secondary shadow-md bg-linear-to-br from-slate-800 via-indigo-600 to-sky-500">
            <p className="font-medium text-sm text-white">{materials.length} Materi</p>
          </div>
          {/* Jumlah Tugas */}
          <div className="p-2 w-fit h-fit rounded-lg bg-secondary shadow-md bg-linear-to-br from-slate-800 via-purple-600 to-pink-500">
            <p className="text-sm text-white">{assignments.length} Tugas</p>
          </div>
          {/* Jumlah Kuis */}
          <div className="p-2 w-fit h-fit rounded-lg bg-secondary shadow-md bg-linear-to-br from-slate-800 via-emerald-600 to-teal-500">
            <p className="text-sm text-white">{quizzes.length} Kuis</p>
          </div>
        </div>
              {/* <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {totalItems} konten tersedia • Materi {materials.length} • Tugas {assignments.length} • Kuis {quizzes.length}
              </p> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[#0C4E8C] text-white">Admin</Badge>
            {isOpen ? (
              <ChevronUp className="h-6 w-6 text-gray-500" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-500" />
            )}
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button className="bg-secondary hover:bg-primary" size="sm" onClick={() => setShowMaterialModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Materi
              </Button>
              <Button className="bg-secondary hover:bg-primary" size="sm" onClick={() => setShowAssignmentModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Tugas
              </Button>
              <Button className="bg-secondary hover:bg-primary" size="sm" onClick={() => setShowQuizModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Kuis
              </Button>
            </div>

            <div className="w-fit flex mx-auto rounded-full border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-slate-900 shadow-sm px-1 py-1">
              {(["materi", "tugas", "kuis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-semibold cursor-pointer transition-colors focus:outline-none ${
                    activeTab === tab
                      ? "bg-secondary text-white rounded-2xl"
                      : "text-gray-600 dark:text-gray-300 hover:text-black hover:bg-gray-200 dark:hover:text-white rounded-2xl"
                  }`}
                >
                  {tab === "materi"
                    ? `Materi (${materials.length})`
                    : tab === "tugas"
                    ? `Tugas (${assignments.length})`
                    : `Kuis (${quizzes.length})`}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {itemsByTab[activeTab].length > 0 ? (
                itemsByTab[activeTab].map((item) => {
                  const isOpenItem = openItemId === item.id;
                  const isEditingMaterial = editingMaterialId === item.id;
                  const isEditingQuiz = editingQuizId === item.id;
                  const currentQuiz = localQuizzes.find((quiz) => quiz.id === item.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#0C4E8C] to-[#11C4D4] text-white grid place-items-center font-semibold">
                            {item.number}
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">{item.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-1">
                          <div>{item.badge}</div>
                          {item.extra ? <div>{item.extra}</div> : null}
                        </div>
                        {isOpenItem ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>

                      {isOpenItem && (
                        <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-4">
                          {item.type === "materi" && (
                            <>
                              {isEditingMaterial ? (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Judul Materi</label>
                                    <input
                                      type="text"
                                      value={materialDraft.title}
                                      onChange={(e) => setMaterialDraft({ ...materialDraft, title: e.target.value })}
                                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Deskripsi</label>
                                    <textarea
                                      value={materialDraft.description}
                                      onChange={(e) => setMaterialDraft({ ...materialDraft, description: e.target.value })}
                                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 h-28 resize-none"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Pertemuan Ke-</label>
                                    <input
                                      type="number"
                                      min={1}
                                      value={materialDraft.meetingNumber}
                                      onChange={(e) => setMaterialDraft({ ...materialDraft, meetingNumber: e.target.value })}
                                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                    />
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <Button size="sm" onClick={() => saveMaterialEdit(item.id)}>
                                      Simpan perubahan
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditMaterial}>
                                      Batal
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <p className="text-sm text-gray-500">Deskripsi</p>
                                      <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.subtitle}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Pertemuan</p>
                                      <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.extra}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <Button size="sm" variant="outline" onClick={() => beginEditMaterial(localMaterials.find((m) => m.id === item.id)!)}>
                                      <Edit3 className="mr-2 h-4 w-4" /> Update
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteMaterial(item.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => navigateToDetail("material", item.id)}>
                                      <Eye className="mr-2 h-4 w-4" /> Lihat detail
                                    </Button>
                                  </div>
                                </>
                              )}
                            </>
                          )}

                          {item.type === "tugas" && (
                            <>
                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="text-sm text-gray-500">Deskripsi</p>
                                  <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.subtitle}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Deadline</p>
                                  <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.extra || "Belum ada deadline"}</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                <Button size="sm" variant="outline" onClick={() => navigate(`/submissions/assignment/${item.id}`)}>
                                  Lihat Pengumpulan
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => navigateToDetail("assignment", item.id)}>
                                  <Eye className="mr-2 h-4 w-4" /> Buka tugas
                                </Button>
                              </div>
                            </>
                          )}

                          {item.type === "kuis" && (
                            <>
                              {isEditingQuiz && quizDraft ? (
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Judul Kuis</label>
                                    <input
                                      type="text"
                                      value={quizDraft.title}
                                      onChange={(e) => setQuizDraft({ ...quizDraft, title: e.target.value })}
                                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                    />
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Durasi (menit)</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={quizDraft.duration}
                                        onChange={(e) => setQuizDraft({ ...quizDraft, duration: e.target.value })}
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Pertemuan</label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={quizDraft.meetingNumber}
                                        onChange={(e) => setQuizDraft({ ...quizDraft, meetingNumber: e.target.value })}
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Deadline</label>
                                    <input
                                      type="date"
                                      value={quizDraft.deadline}
                                      onChange={(e) => setQuizDraft({ ...quizDraft, deadline: e.target.value })}
                                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Deskripsi</label>
                                    <textarea
                                      value={quizDraft.description}
                                      onChange={(e) => setQuizDraft({ ...quizDraft, description: e.target.value })}
                                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 h-28 resize-none"
                                    />
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm text-gray-500">Soal saat ini: {quizDraft.questions.length}</p>
                                      <Button size="sm" variant="outline" onClick={addQuizQuestion}>
                                        <Plus className="mr-2 h-4 w-4" /> Tambah Soal
                                      </Button>
                                    </div>
                                    <div className="space-y-4">
                                      {quizDraft.questions.map((question, index) => (
                                        <div key={question.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                                          <div className="flex items-start justify-between gap-3">
                                            <p className="font-medium">Soal {index + 1}</p>
                                            <button
                                              type="button"
                                              className="text-sm text-red-600 hover:text-red-800"
                                              onClick={() => removeQuizQuestion(index)}
                                            >
                                              Hapus
                                            </button>
                                          </div>
                                          <div className="mt-3 space-y-3">
                                            <input
                                              type="text"
                                              value={question.question}
                                              onChange={(e) => updateQuizQuestion(index, "question", e.target.value)}
                                              placeholder="Pertanyaan"
                                              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                            />
                                            <div className="grid gap-3 md:grid-cols-2">
                                              {question.options.map((option, optionIndex) => (
                                                <input
                                                  key={optionIndex}
                                                  type="text"
                                                  value={option}
                                                  onChange={(e) => {
                                                    const updated = [...question.options];
                                                    updated[optionIndex] = e.target.value;
                                                    updateQuizQuestion(index, "options", updated);
                                                  }}
                                                  placeholder={`Pilihan ${String.fromCharCode(65 + optionIndex)}`}
                                                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                                />
                                              ))}
                                            </div>
                                            <div>
                                              <label className="block text-sm font-medium mb-2">Jawaban benar</label>
                                              <select
                                                value={question.correctAnswer}
                                                onChange={(e) => updateQuizQuestion(index, "correctAnswer", Number(e.target.value))}
                                                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
                                              >
                                                {question.options.map((_, optionIndex) => (
                                                  <option key={optionIndex} value={optionIndex}>
                                                    {String.fromCharCode(65 + optionIndex)}
                                                  </option>
                                                ))}
                                              </select>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <Button size="sm" onClick={saveQuizEdit}>
                                      Simpan Perubahan
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditQuiz}>
                                      Batal
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <p className="text-sm text-gray-500">Deskripsi</p>
                                      <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.subtitle}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Deadline</p>
                                      <p className="mt-1 text-base text-gray-800 dark:text-gray-200">
                                        {currentQuiz?.deadline || "Belum diatur"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <div>
                                      <p className="text-sm text-gray-500">Durasi</p>
                                      <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.badge}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gray-500">Jumlah Soal</p>
                                      <p className="mt-1 text-base text-gray-800 dark:text-gray-200">{item.extra}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <Button size="sm" variant="outline" onClick={() => currentQuiz && beginEditQuiz(currentQuiz)}>
                                      <Edit3 className="mr-2 h-4 w-4" /> Update
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => deleteQuiz(item.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => navigate(`/submissions/quiz/${item.id}`)}>
                                      View Submissions
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => navigateToDetail("quiz", item.id)}>
                                      <Eye className="mr-2 h-4 w-4" /> Lihat kuis
                                    </Button>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950 rounded-3xl border border-gray-200 dark:border-gray-800">
                  Tidak ada konten di tab ini.
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      <AddMaterialModal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        classId={classId}
        level={level}
        onAdd={onAddMaterial}
      />
      <AddAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        classId={classId}
        level={level}
        onAdd={onAddAssignment}
      />
      <AddQuizModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        classId={classId}
        level={level}
        onAdd={onAddQuiz}
      />
    </>
  );
}
