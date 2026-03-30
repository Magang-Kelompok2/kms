import type { Class, Material, Assignment, Quiz } from "../types";

export const classes: Class[] = [
  {
    id: "perpajakan",
    name: "Perpajakan",
    description: "Mata kuliah tentang sistem perpajakan dan regulasi pajak di Indonesia",
    color: "from-[#0C4E8C] to-[#0C81E4]",
    icon: "https://images.unsplash.com/photo-1772588627474-ae6acc69ac42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXglMjBjYWxjdWxhdG9yJTIwZmluYW5jZXxlbnwxfHx8fDE3NzQ4NDI4MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "audit",
    name: "Audit",
    description: "Mata kuliah tentang audit keuangan dan pemeriksaan laporan keuangan",
    color: "from-[#0C81E4] to-[#11C4D4]",
    icon: "https://images.unsplash.com/photo-1521579498714-ff08ba4836ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdWRpdCUyMGNoZWNrbGlzdCUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDg0MjgwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: "akuntansi",
    name: "Akuntansi",
    description: "Mata kuliah tentang prinsip dan praktik akuntansi keuangan",
    color: "from-[#11C4D4] to-[#4FE7AF]",
    icon: "https://images.unsplash.com/photo-1636819483716-854492c76683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2NvdW50aW5nJTIwbGVkZ2VyJTIwYm9va3N8ZW58MXx8fHwxNzc0ODQyODA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

export const materials: Material[] = [
  // Perpajakan
  {
    id: "mat-perp-1",
    title: "Pengenalan Sistem Perpajakan Indonesia",
    description: "Dasar-dasar perpajakan dan jenis-jenis pajak di Indonesia",
    content: "Materi lengkap tentang sistem perpajakan...",
    classId: "perpajakan",
    meetingNumber: 1,
    createdAt: "2026-03-15",
    isPublished: true,
  },
  {
    id: "mat-perp-2",
    title: "PPh Pasal 21 - Pajak Penghasilan Karyawan",
    description: "Perhitungan dan pelaporan PPh 21",
    content: "Materi lengkap tentang PPh 21...",
    classId: "perpajakan",
    meetingNumber: 2,
    createdAt: "2026-03-22",
    isPublished: true,
  },
  {
    id: "mat-perp-3",
    title: "PPN - Pajak Pertambahan Nilai",
    description: "Konsep dan mekanisme PPN",
    content: "Materi lengkap tentang PPN...",
    classId: "perpajakan",
    meetingNumber: 3,
    createdAt: "2026-03-29",
    isPublished: false,
  },
  
  // Audit
  {
    id: "mat-aud-1",
    title: "Konsep Dasar Audit",
    description: "Pengenalan audit dan tujuan pemeriksaan",
    content: "Materi lengkap tentang konsep dasar audit...",
    classId: "audit",
    meetingNumber: 1,
    createdAt: "2026-03-16",
    isPublished: true,
  },
  {
    id: "mat-aud-2",
    title: "Audit Planning & Risk Assessment",
    description: "Perencanaan audit dan penilaian risiko",
    content: "Materi lengkap tentang audit planning...",
    classId: "audit",
    meetingNumber: 2,
    createdAt: "2026-03-23",
    isPublished: true,
  },
  
  // Akuntansi
  {
    id: "mat-akun-1",
    title: "Persamaan Akuntansi Dasar",
    description: "Aset, Liabilitas, dan Ekuitas",
    content: "Materi lengkap tentang persamaan akuntansi...",
    classId: "akuntansi",
    meetingNumber: 1,
    createdAt: "2026-03-17",
    isPublished: true,
  },
  {
    id: "mat-akun-2",
    title: "Jurnal dan Posting ke Buku Besar",
    description: "Proses pencatatan transaksi keuangan",
    content: "Materi lengkap tentang jurnal...",
    classId: "akuntansi",
    meetingNumber: 2,
    createdAt: "2026-03-24",
    isPublished: true,
  },
];

export const assignments: Assignment[] = [
  {
    id: "assign-perp-1",
    title: "Tugas: Analisis Jenis Pajak",
    description: "Buat analisis tentang 5 jenis pajak yang ada di Indonesia",
    dueDate: "2026-04-05",
    classId: "perpajakan",
    meetingNumber: 1,
    materialId: "mat-perp-1",
    isPublished: true,
  },
  {
    id: "assign-perp-2",
    title: "Tugas: Perhitungan PPh 21",
    description: "Hitung PPh 21 untuk 3 kasus yang berbeda",
    dueDate: "2026-04-12",
    classId: "perpajakan",
    meetingNumber: 2,
    materialId: "mat-perp-2",
    isPublished: true,
  },
  {
    id: "assign-aud-1",
    title: "Tugas: Studi Kasus Audit",
    description: "Analisis studi kasus audit laporan keuangan",
    dueDate: "2026-04-10",
    classId: "audit",
    meetingNumber: 2,
    materialId: "mat-aud-2",
    isPublished: true,
  },
];

export const quizzes: Quiz[] = [
  {
    id: "quiz-perp-1",
    title: "Kuis: Dasar-dasar Perpajakan",
    classId: "perpajakan",
    meetingNumber: 1,
    duration: 30,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Apa kepanjangan dari PPh?",
        options: [
          "Pajak Penghasilan Harian",
          "Pajak Penghasilan",
          "Pajak Pertambahan Harta",
          "Pajak Penjualan Harian",
        ],
        correctAnswer: 1,
      },
      {
        id: "q2",
        question: "Berapa tarif PPN di Indonesia?",
        options: ["10%", "11%", "12%", "15%"],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "quiz-akun-1",
    title: "Kuis: Persamaan Akuntansi",
    classId: "akuntansi",
    meetingNumber: 1,
    duration: 20,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Persamaan akuntansi dasar adalah?",
        options: [
          "Aset = Liabilitas - Ekuitas",
          "Aset = Liabilitas + Ekuitas",
          "Aset + Liabilitas = Ekuitas",
          "Aset = Ekuitas - Liabilitas",
        ],
        correctAnswer: 1,
      },
    ],
  },
];

// Mock user access data - user "2" has access to some materials
export const userAccess = {
  userId: "2",
  classIds: ["perpajakan", "audit", "akuntansi"],
  materialIds: ["mat-perp-1", "mat-perp-2", "mat-aud-1", "mat-akun-1", "mat-akun-2"],
  quizIds: ["quiz-perp-1", "quiz-akun-1"],
  assignmentIds: ["assign-perp-1", "assign-perp-2"],
};