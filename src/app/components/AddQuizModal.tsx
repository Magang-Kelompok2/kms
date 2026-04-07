import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { X, Plus, Trash2, Clock } from "lucide-react";

interface MateriOption {
  id_materi: number;
  title_materi: string;
}

interface AddQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  level: number;
  onAdd: (quiz: any) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0=A, 1=B, 2=C, 3=D
}

export function AddQuizModal({
  isOpen,
  onClose,
  classId,
  level,
  onAdd,
}: AddQuizModalProps) {
  const [title, setTitle] = useState("");
  const [meetingNumber, setMeetingNumber] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [selectedMateriId, setSelectedMateriId] = useState<number | "">("");
  const [materiOptions, setMateriOptions] = useState<MateriOption[]>([]);
  const [materiLoading, setMateriLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !classId) return;
    const fetchMateri = async () => {
      setMateriLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials?classId=${classId}`,
        );
        const json = await res.json();
        if (json.success) {
          const filtered = (json.data as any[])
            .filter((m) => m.id_tingkatan === level)
            .map((m) => ({
              id_materi: m.id_materi,
              title_materi: m.title_materi,
            }));
          setMateriOptions(filtered);
        }
      } catch {
        setMateriOptions([]);
      } finally {
        setMateriLoading(false);
      }
    };
    fetchMateri();
  }, [isOpen, classId, level]);

  if (!isOpen) return null;

  const initializeQuestions = () => {
    const num = parseInt(numberOfQuestions);
    if (num > 0 && num <= 50) {
      const newQuestions: Question[] = Array.from({ length: num }, (_, i) => ({
        id: `q${i + 1}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      }));
      setQuestions(newQuestions);
      setShowQuestionForm(true);
    } else {
      alert("Jumlah soal harus antara 1-50");
    }
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setNumberOfQuestions((questions.length - 1).toString());
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
    setNumberOfQuestions((questions.length + 1).toString());
  };

  const resetForm = () => {
    setTitle("");
    setMeetingNumber("");
    setDuration("");
    setDeadline("");
    setNumberOfQuestions("");
    setQuestions([]);
    setShowQuestionForm(false);
    setSelectedMateriId("");
    setError(null);
  };

  const handleSubmit = async () => {
    // FIX: deadline dihapus dari validasi wajib
    if (!title || !meetingNumber || !duration) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    if (!selectedMateriId) {
      alert("Mohon pilih materi yang terkait");
      return;
    }
    if (questions.length === 0) {
      alert("Mohon buat minimal 1 soal");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Soal nomor ${i + 1} belum diisi`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(
            `Pilihan ${String.fromCharCode(65 + j)} pada soal ${i + 1} belum diisi`,
          );
          return;
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Simpan kuis ke tabel tugas
      const kuisRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tugas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_tugas: title,
          deskripsi: "",
          type: "Kuis",
          id_materi: Number(selectedMateriId),
          id_kelas: Number(classId),
          pertemuan: parseInt(meetingNumber),
          // FIX: deadline null jika tidak diisi
          deadline: deadline ? new Date(deadline).toISOString() : null,
          durasi: parseInt(duration),
        }),
      });
      const kuisJson = await kuisRes.json();
      if (!kuisJson.success)
        throw new Error(kuisJson.error ?? "Gagal menyimpan kuis");

      const id_tugas = kuisJson.data.id_tugas;

      // 2. Simpan soal-soal ke tabel soal_kuis
      const opsiMap = ["a", "b", "c", "d"];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const soalRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/kuis/${id_tugas}/soal`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pertanyaan: q.question,
              opsi_a: q.options[0],
              opsi_b: q.options[1],
              opsi_c: q.options[2],
              opsi_d: q.options[3],
              jawaban_benar: opsiMap[q.correctAnswer],
              urutan: i + 1,
            }),
          },
        );
        const soalJson = await soalRes.json();
        if (!soalJson.success) throw new Error(`Gagal menyimpan soal ${i + 1}`);
      }

      // 3. Update local state
      onAdd({
        id: String(id_tugas),
        title,
        classId,
        meetingNumber: parseInt(meetingNumber),
        level,
        duration: parseInt(duration),
        // FIX: dueDate null jika deadline tidak diisi
        dueDate: deadline ? new Date(deadline).toISOString() : null,
        isPublished: true,
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Tambah Kuis - Level {level}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Pilih Materi */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Materi Terkait <span className="text-red-500">*</span>
            </label>
            {materiLoading ? (
              <p className="text-sm text-gray-500">Memuat daftar materi...</p>
            ) : materiOptions.length === 0 ? (
              <p className="text-sm text-red-500">
                Belum ada materi di tingkatan ini. Tambahkan materi terlebih
                dahulu.
              </p>
            ) : (
              <select
                value={selectedMateriId}
                onChange={(e) => setSelectedMateriId(Number(e.target.value))}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
              >
                <option value="">-- Pilih Materi --</option>
                {materiOptions.map((m) => (
                  <option key={m.id_materi} value={m.id_materi}>
                    {m.title_materi}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Judul Kuis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kuis Dasar-dasar Perpajakan"
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Pertemuan Ke- <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={meetingNumber}
                  onChange={(e) => setMeetingNumber(e.target.value)}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Durasi (menit) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    min="5"
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
                  />
                  <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* FIX: Deadline opsional */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Deadline{" "}
                <span className="text-gray-400 text-xs font-normal">
                  (opsional)
                </span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
              />
            </div>

            {/* Jumlah soal */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Jumlah Soal <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                placeholder="10"
                min="1"
                max="50"
                disabled={showQuestionForm}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 disabled:opacity-50"
              />
            </div>

            {!showQuestionForm && numberOfQuestions && (
              <Button
                onClick={initializeQuestions}
                className="w-full text-base py-6"
              >
                Buat {numberOfQuestions} Soal
              </Button>
            )}
          </div>

          {/* Questions Form */}
          {showQuestionForm && questions.length > 0 && (
            <div className="space-y-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Soal-Soal Kuis</h3>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Soal
                </Button>
              </div>

              {questions.map((question, qIndex) => (
                <div
                  key={question.id}
                  className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-lg">Soal {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(qIndex)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Pertanyaan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(qIndex, "question", e.target.value)
                      }
                      placeholder="Tulis pertanyaan di sini..."
                      className="w-full h-24 px-4 py-3 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Pilihan Jawaban <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={question.correctAnswer === oIndex}
                            onChange={() =>
                              updateQuestion(qIndex, "correctAnswer", oIndex)
                            }
                            className="w-5 h-5 text-blue-600"
                          />
                          <div className="flex-1 flex items-center gap-2">
                            <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded font-semibold text-sm">
                              {String.fromCharCode(65 + oIndex)}
                            </span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, e.target.value)
                              }
                              placeholder={`Pilihan ${String.fromCharCode(65 + oIndex)}`}
                              className="flex-1 px-4 py-2 text-base border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Pilih radio button untuk menandai jawaban yang benar
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3 z-10">
          <Button
            onClick={handleSubmit}
            disabled={loading || !showQuestionForm || questions.length === 0}
            className="flex-1 text-base py-6"
          >
            {loading
              ? "Menyimpan..."
              : `Simpan Kuis (${questions.length} soal)`}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="text-base py-6"
          >
            Batal
          </Button>
        </div>
      </div>
    </div>
  );
}
