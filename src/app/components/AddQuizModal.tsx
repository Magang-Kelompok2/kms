'use client'

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

  // Ambil token sekali saja untuk digunakan di fungsi-fungsi bawah
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isOpen || !classId) return;
    
    const fetchMateri = async () => {
      setMateriLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/materials?classId=${classId}`,
          {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          }
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
      } catch (err) {
        console.error("Error fetching materi:", err);
        setMateriOptions([]);
      } finally {
        setMateriLoading(false);
      }
    };
    fetchMateri();
  }, [isOpen, classId, level, token]);

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
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
    setNumberOfQuestions(updatedQuestions.length.toString());
  };

  const addQuestion = () => {
    const newCount = questions.length + 1;
    setQuestions([
      ...questions,
      {
        id: `q${newCount}`,
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
    setNumberOfQuestions(newCount.toString());
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
    const sessionData = localStorage.getItem("taxacore_session")
    console.log("Token saat klik simpan:", sessionData)

    if (!sessionData) {
      alert("Sesi tidak ditemukan. Silahkan login ulang!");
      return;
    }

    const parsedSession = JSON.parse(sessionData);
    const actualToken = parsedSession.token;

    if (!actualToken) {
      alert("Token tidak ditemukan dalam data sesi.")
    }

    if (!title || !meetingNumber || !duration || !selectedMateriId) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }
    
    if (questions.length === 0) {
      alert("Mohon buat minimal 1 soal");
      return;
    }

    // Validasi isi soal
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Soal nomor ${i + 1} belum diisi`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          alert(`Pilihan ${String.fromCharCode(65 + j)} pada soal ${i + 1} belum diisi`);
          return;
        }
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Simpan kuis ke tabel tugas (Memakai Token)
      const kuisRes = await fetch(`${import.meta.env.VITE_API_URL}/api/tugas`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${actualToken}` 
        },
        body: JSON.stringify({
          nama_tugas: title,
          deskripsi: "",
          type: "Kuis",
          id_materi: Number(selectedMateriId),
          id_kelas: Number(classId),
          pertemuan: parseInt(meetingNumber),
          deadline: deadline ? new Date(deadline).toISOString() : null,
          durasi: parseInt(duration),
        }),
      });

      const kuisJson = await kuisRes.json();
      if (!kuisJson.success) throw new Error(kuisJson.error ?? "Gagal menyimpan kuis");

      const id_tugas = kuisJson.data.id_tugas;

      

      // 2. Simpan soal-soal ke tabel soal_kuis (Memakai Token)
      const opsiMap = ["a", "b", "c", "d"];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const soalRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/kuis/${id_tugas}/soal`,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
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

      onAdd({
        id: String(id_tugas),
        title,
        classId,
        meetingNumber: parseInt(meetingNumber),
        level,
        duration: parseInt(duration),
        dueDate: deadline ? new Date(deadline).toISOString() : null,
        isPublished: true,
        questions: questions.map((q) => ({ ...q })),
      });

      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold">Tambah Kuis - Level {level}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Materi Terkait *</label>
            {materiLoading ? (
              <p className="text-sm text-gray-500">Memuat materi...</p>
            ) : (
              <select
                value={selectedMateriId}
                onChange={(e) => setSelectedMateriId(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              >
                <option value="">-- Pilih Materi --</option>
                {materiOptions.map((m) => (
                  <option key={m.id_materi} value={m.id_materi}>{m.title_materi}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Judul Kuis *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Pertemuan Ke- *</label>
              <input
                type="number"
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Durasi (menit) *</label>
              <div className="relative">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                />
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Deadline (Opsional)</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Jumlah Soal *</label>
              <input
                type="number"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                disabled={showQuestionForm}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 disabled:opacity-50"
              />
            </div>
          </div>

          {!showQuestionForm && numberOfQuestions && (
            <Button onClick={initializeQuestions} className="w-full py-6">
              Buat {numberOfQuestions} Soal
            </Button>
          )}

          {showQuestionForm && (
            <div className="space-y-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Daftar Soal</h3>
                <Button onClick={addQuestion} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" /> Tambah Soal
                </Button>
              </div>

              {questions.map((q, qIndex) => (
                <div key={q.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between">
                    <h4 className="font-bold">Soal {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button onClick={() => removeQuestion(qIndex)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={q.question}
                    onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                    placeholder="Tulis pertanyaan..."
                    className="w-full h-20 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  />
                  <div className="space-y-2">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={q.correctAnswer === oIndex}
                          onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Opsi ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t p-6 flex gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || !showQuestionForm}
            className="flex-1 py-6"
          >
            {loading ? "Menyimpan..." : "Simpan Kuis"}
          </Button>
          <Button variant="outline" onClick={onClose} className="py-6">Batal</Button>
        </div>
      </div>
    </div>
  );
}