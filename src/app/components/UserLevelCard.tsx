import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "./ui/card";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import type { Assignment, Quiz, Material } from "../types";

interface UserLevelCardProps {
  level: number;
  namaLevel: string;
  materials: Material[];
  assignments: Assignment[];
  quizzes: Quiz[];
  classId: string;
  isLocked: boolean;
  userLevel: number;
}

type LevelCardItem = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  number: number;
  path: string;
  extra?: string;
};

export function UserLevelCard({
  level,
  namaLevel,
  materials,
  assignments,
  quizzes,
  isLocked,
}: UserLevelCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'materi' | 'tugas' | 'kuis'>('materi');
  const navigate = useNavigate();

  const totalItems = materials.length + assignments.length + quizzes.length;

  const itemsByTab: Record<'materi' | 'tugas' | 'kuis', LevelCardItem[]> = {
    materi: materials.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      badge: `${item.files?.length ?? 0} files`,
      number: index + 1,
      path: `/material/${item.id}`,
    })),
    tugas: assignments.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      badge: `Pertemuan ${item.meetingNumber}`,
      extra: `Due ${new Date(item.dueDate).toLocaleDateString("id-ID")}`,
      number: index + 1,
      path: `/assignment/${item.id}`,
    })),
    kuis: quizzes.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.questions?.length ? `${item.questions.length} soal` : "Kuis",
      badge: `${item.duration} menit`,
      extra: item.questions ? `${item.questions.length} soal` : undefined,
      number: index + 1,
      path: `/quiz/${item.id}`,
    })),
  };

  return (
    <Card className={`overflow-hidden ${isLocked ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        className={`cursor-pointer w-full p-6 flex items-center justify-between transition-colors ${
          !isLocked ? "hover:bg-gray-50 dark:hover:bg-gray-900" : ""
        }`}
        disabled={isLocked}
      >
        <div className="flex items-center text-left gap-8">
          <div
            className={`w-21 h-21 rounded-2xl grid place-items-center text-white font-semibold text-2xl ${
              isLocked ? "bg-gray-400 dark:bg-gray-600" : "bg-linear-to-br from-[#0C4E8C] to-[#11C4D4]"
            }`}
          >
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
          </div>
        </div>

        {!isLocked && (
          <div className="flex items-center gap-4">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>
        )}
      </button>

      {isOpen && !isLocked && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-6">
          <div className="w-fit flex mx-auto rounded-full border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-slate-900 shadow-sm px-1 py-1">
            {(["materi", "tugas", "kuis"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-bold cursor-pointer transition-colors focus:outline-none ${
                  activeTab === tab
                    ? "bg-secondary text-white rounded-2xl"
                    : "text-gray-600 dark:text-gray-300 hover:text-black hover:bg-gray-200 dark:hover:text-white rounded-2xl"
                }`}
              >
                {tab === "materi" ? `Materi (${materials.length})` : tab === "tugas" ? `Tugas (${assignments.length})` : `Kuis (${quizzes.length})`}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {itemsByTab[activeTab].length > 0 ? (
              itemsByTab[activeTab].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="w-full text-left flex items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#0C4E8C] to-[#11C4D4] text-white grid place-items-center font-semibold">
                      {item.number}
                    </div>
                    <div>
                      <h4 className="font-bold text-xl">{item.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <div>{item.badge}</div>
                    {item.extra ? <div>{item.extra}</div> : null}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-950 rounded-3xl border border-gray-200 dark:border-gray-800">
                Tidak ada konten di tab ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Locked Message */}
      {isLocked && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 text-center">
          <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">
            Selesaikan tingkatan sebelumnya untuk membuka akses ke tingkatan ini.
          </p>
        </div>
      )}
    </Card>
  );
}