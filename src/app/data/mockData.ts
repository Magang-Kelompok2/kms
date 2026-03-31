import type { Class, Material, Assignment, Quiz, User, Submission, UserProgress } from "../types";

export const classes: Class[] = [
  {
    id: "perpajakan",
    name: "Perpajakan",
    description: "Mata kuliah tentang sistem perpajakan dan regulasi pajak di Indonesia",
    color: "from-[#0C4E8C] to-[#0C81E4]",
    icon: "https://images.unsplash.com/photo-1772588627474-ae6acc69ac42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXglMjBjYWxjdWxhdG9yJTIwZmluYW5jZXxlbnwxfHx8fDE3NzQ4NDI4MDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    totalLevels: 3,
  },
  {
    id: "audit",
    name: "Audit",
    description: "Mata kuliah tentang audit keuangan dan pemeriksaan laporan keuangan",
    color: "from-[#0C81E4] to-[#11C4D4]",
    icon: "https://images.unsplash.com/photo-1521579498714-ff08ba4836ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdWRpdCUyMGNoZWNrbGlzdCUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDg0MjgwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    totalLevels: 3,
  },
  {
    id: "akuntansi",
    name: "Akuntansi",
    description: "Mata kuliah tentang prinsip dan praktik akuntansi keuangan",
    color: "from-[#11C4D4] to-[#4FE7AF]",
    icon: "https://images.unsplash.com/photo-1636819483716-854492c76683?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2NvdW50aW5nJTIwbGVkZ2VyJTIwYm9va3N8ZW58MXx8fHwxNzc0ODQyODA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    totalLevels: 3,
  },
];

export const materials: Material[] = [
  // Perpajakan - Level 1
  {
    id: "mat-perp-1",
    title: "Pengenalan Sistem Perpajakan Indonesia",
    description: "Dasar-dasar perpajakan dan jenis-jenis pajak di Indonesia",
    content: "Materi lengkap tentang sistem perpajakan...",
    classId: "perpajakan",
    meetingNumber: 1,
    level: 1,
    createdAt: "2026-03-15",
    isPublished: true,
    files: [
      {
        id: "file-1",
        name: "Pengantar Perpajakan.pdf",
        type: "pdf",
        url: "https://example.com/pengantar-perpajakan.pdf",
      },
      {
        id: "file-2",
        name: "Video: Sistem Pajak Indonesia",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "15:30",
      },
      {
        id: "file-3",
        name: "Jenis-Jenis Pajak.pdf",
        type: "pdf",
        url: "https://example.com/jenis-pajak.pdf",
      },
    ],
  },
  {
    id: "mat-perp-2",
    title: "PPh Pasal 21 - Pajak Penghasilan Karyawan",
    description: "Perhitungan dan pelaporan PPh 21",
    content: "Materi lengkap tentang PPh 21...",
    classId: "perpajakan",
    meetingNumber: 2,
    level: 1,
    createdAt: "2026-03-22",
    isPublished: true,
    files: [
      {
        id: "file-4",
        name: "Modul PPh 21.pdf",
        type: "pdf",
        url: "https://example.com/pph21.pdf",
      },
      {
        id: "file-5",
        name: "Tutorial Perhitungan PPh 21",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "22:15",
      },
    ],
  },
  // Perpajakan - Level 2
  {
    id: "mat-perp-3",
    title: "PPN - Pajak Pertambahan Nilai",
    description: "Konsep dan mekanisme PPN",
    content: "Materi lengkap tentang PPN...",
    classId: "perpajakan",
    meetingNumber: 3,
    level: 2,
    createdAt: "2026-03-29",
    isPublished: true,
    files: [
      {
        id: "file-6",
        name: "Konsep PPN.pdf",
        type: "pdf",
        url: "https://example.com/ppn.pdf",
      },
      {
        id: "file-7",
        name: "Video Penjelasan PPN",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "18:45",
      },
    ],
  },
  
  // Audit - Level 1
  {
    id: "mat-aud-1",
    title: "Konsep Dasar Audit",
    description: "Pengenalan audit dan tujuan pemeriksaan",
    content: "Materi lengkap tentang konsep dasar audit...",
    classId: "audit",
    meetingNumber: 1,
    level: 1,
    createdAt: "2026-03-16",
    isPublished: true,
    files: [
      {
        id: "file-8",
        name: "Dasar-dasar Audit.pdf",
        type: "pdf",
        url: "https://example.com/dasar-audit.pdf",
      },
      {
        id: "file-9",
        name: "Intro to Auditing",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "20:00",
      },
    ],
  },
  {
    id: "mat-aud-2",
    title: "Audit Planning & Risk Assessment",
    description: "Perencanaan audit dan penilaian risiko",
    content: "Materi lengkap tentang audit planning...",
    classId: "audit",
    meetingNumber: 2,
    level: 1,
    createdAt: "2026-03-23",
    isPublished: true,
    files: [
      {
        id: "file-10",
        name: "Audit Planning.pdf",
        type: "pdf",
        url: "https://example.com/audit-planning.pdf",
      },
    ],
  },
  
  // Akuntansi - Level 1
  {
    id: "mat-akun-1",
    title: "Persamaan Akuntansi Dasar",
    description: "Aset, Liabilitas, dan Ekuitas",
    content: "Materi lengkap tentang persamaan akuntansi...",
    classId: "akuntansi",
    meetingNumber: 1,
    level: 1,
    createdAt: "2026-03-17",
    isPublished: true,
    files: [
      {
        id: "file-11",
        name: "Persamaan Akuntansi.pdf",
        type: "pdf",
        url: "https://example.com/persamaan-akuntansi.pdf",
      },
      {
        id: "file-12",
        name: "Video Persamaan Akuntansi",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "12:30",
      },
      {
        id: "file-13",
        name: "Contoh Kasus.pdf",
        type: "pdf",
        url: "https://example.com/contoh-kasus.pdf",
      },
    ],
  },
  {
    id: "mat-akun-2",
    title: "Jurnal dan Posting ke Buku Besar",
    description: "Proses pencatatan transaksi keuangan",
    content: "Materi lengkap tentang jurnal...",
    classId: "akuntansi",
    meetingNumber: 2,
    level: 1,
    createdAt: "2026-03-24",
    isPublished: true,
    files: [
      {
        id: "file-14",
        name: "Jurnal Umum.pdf",
        type: "pdf",
        url: "https://example.com/jurnal.pdf",
      },
      {
        id: "file-15",
        name: "Tutorial Posting",
        type: "video",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        duration: "25:00",
      },
    ],
  },
];

export const assignments: Assignment[] = [
  // Level 1
  {
    id: "assign-perp-1",
    title: "Tugas: Analisis Jenis Pajak",
    description: "Buat analisis tentang 5 jenis pajak yang ada di Indonesia",
    dueDate: "2026-04-05",
    classId: "perpajakan",
    meetingNumber: 2,
    level: 1,
    materialId: "mat-perp-2",
    isPublished: true,
    attachments: [
      {
        id: "attach-1",
        name: "Soal Analisis Jenis Pajak.pdf",
        url: "https://example.com/soal-analisis-pajak.pdf",
        type: "pdf",
      },
      {
        id: "attach-2",
        name: "Template Analisis.pdf",
        url: "https://example.com/template-analisis.pdf",
        type: "pdf",
      },
    ],
  },
  {
    id: "assign-aud-1",
    title: "Tugas: Studi Kasus Audit",
    description: "Analisis studi kasus audit laporan keuangan",
    dueDate: "2026-04-10",
    classId: "audit",
    meetingNumber: 2,
    level: 1,
    materialId: "mat-aud-2",
    isPublished: true,
    attachments: [
      {
        id: "attach-3",
        name: "Studi Kasus Perusahaan XYZ.pdf",
        url: "https://example.com/studi-kasus-audit.pdf",
        type: "pdf",
      },
    ],
  },
  {
    id: "assign-akun-1",
    title: "Tugas: Menyusun Jurnal Umum",
    description: "Buat jurnal umum dari transaksi yang diberikan",
    dueDate: "2026-04-08",
    classId: "akuntansi",
    meetingNumber: 2,
    level: 1,
    materialId: "mat-akun-2",
    isPublished: true,
    attachments: [
      {
        id: "attach-4",
        name: "Daftar Transaksi.pdf",
        url: "https://example.com/daftar-transaksi.pdf",
        type: "pdf",
      },
    ],
  },
  
  // Level 2
  {
    id: "assign-perp-2",
    title: "Tugas: Perhitungan PPN",
    description: "Hitung PPN dari berbagai transaksi bisnis",
    dueDate: "2026-04-15",
    classId: "perpajakan",
    meetingNumber: 4,
    level: 2,
    materialId: "mat-perp-3",
    isPublished: true,
    attachments: [
      {
        id: "attach-5",
        name: "Soal Perhitungan PPN.pdf",
        url: "https://example.com/soal-ppn.pdf",
        type: "pdf",
      },
    ],
  },
  {
    id: "assign-aud-2",
    title: "Tugas: Audit Program",
    description: "Susun program audit untuk perusahaan manufaktur",
    dueDate: "2026-04-18",
    classId: "audit",
    meetingNumber: 4,
    level: 2,
    isPublished: true,
    attachments: [
      {
        id: "attach-6",
        name: "Profil Perusahaan Manufaktur.pdf",
        url: "https://example.com/profil-manufaktur.pdf",
        type: "pdf",
      },
      {
        id: "attach-7",
        name: "Panduan Audit Program.pdf",
        url: "https://example.com/panduan-audit.pdf",
        type: "pdf",
      },
    ],
  },
  {
    id: "assign-akun-2",
    title: "Tugas: Neraca Saldo",
    description: "Buat neraca saldo dari buku besar yang diberikan",
    dueDate: "2026-04-16",
    classId: "akuntansi",
    meetingNumber: 4,
    level: 2,
    isPublished: true,
    attachments: [
      {
        id: "attach-8",
        name: "Data Buku Besar.pdf",
        url: "https://example.com/buku-besar.pdf",
        type: "pdf",
      },
    ],
  },
  
  // Level 3
  {
    id: "assign-perp-3",
    title: "Tugas: Perencanaan Pajak",
    description: "Buat strategi perencanaan pajak untuk perusahaan",
    dueDate: "2026-04-25",
    classId: "perpajakan",
    meetingNumber: 6,
    level: 3,
    isPublished: true,
    attachments: [
      {
        id: "attach-9",
        name: "Studi Kasus Perusahaan.pdf",
        url: "https://example.com/studi-kasus-perusahaan.pdf",
        type: "pdf",
      },
    ],
  },
  {
    id: "assign-aud-3",
    title: "Tugas: Laporan Audit",
    description: "Susun laporan audit lengkap dengan opini",
    dueDate: "2026-04-28",
    classId: "audit",
    meetingNumber: 6,
    level: 3,
    isPublished: true,
  },
  {
    id: "assign-akun-3",
    title: "Tugas: Laporan Keuangan Lengkap",
    description: "Susun laporan keuangan lengkap (Neraca, L/R, Perubahan Modal)",
    dueDate: "2026-04-26",
    classId: "akuntansi",
    meetingNumber: 6,
    level: 3,
    isPublished: true,
  },
];

export const quizzes: Quiz[] = [
  // Level 1
  {
    id: "quiz-perp-1",
    title: "Kuis: Dasar-dasar Perpajakan",
    classId: "perpajakan",
    meetingNumber: 2,
    level: 1,
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
    id: "quiz-aud-1",
    title: "Kuis: Konsep Dasar Audit",
    classId: "audit",
    meetingNumber: 2,
    level: 1,
    duration: 25,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Apa tujuan utama dari audit?",
        options: [
          "Mencari kesalahan",
          "Memberikan opini atas laporan keuangan",
          "Menghitung pajak",
          "Membuat laporan keuangan",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "quiz-akun-1",
    title: "Kuis: Persamaan Akuntansi",
    classId: "akuntansi",
    meetingNumber: 2,
    level: 1,
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
  
  // Level 2
  {
    id: "quiz-perp-2",
    title: "Kuis: PPN dan Mekanismenya",
    classId: "perpajakan",
    meetingNumber: 4,
    level: 2,
    duration: 35,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Siapa yang wajib memungut PPN?",
        options: [
          "Semua perusahaan",
          "Pengusaha Kena Pajak (PKP)",
          "Hanya perusahaan besar",
          "Semua wajib pajak",
        ],
        correctAnswer: 1,
      },
      {
        id: "q2",
        question: "Kapan PPN harus disetor?",
        options: [
          "Akhir bulan",
          "Tanggal 15 bulan berikutnya",
          "Setiap transaksi",
          "Akhir tahun",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "quiz-aud-2",
    title: "Kuis: Prosedur Audit",
    classId: "audit",
    meetingNumber: 4,
    level: 2,
    duration: 30,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Apa yang dimaksud dengan audit evidence?",
        options: [
          "Dokumen perusahaan",
          "Informasi yang digunakan auditor untuk menarik kesimpulan",
          "Laporan keuangan",
          "Catatan akuntansi",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "quiz-akun-2",
    title: "Kuis: Siklus Akuntansi",
    classId: "akuntansi",
    meetingNumber: 4,
    level: 2,
    duration: 25,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Urutan siklus akuntansi yang benar adalah?",
        options: [
          "Jurnal - Posting - Neraca Saldo - Laporan Keuangan",
          "Posting - Jurnal - Neraca Saldo - Laporan Keuangan",
          "Laporan Keuangan - Jurnal - Posting - Neraca Saldo",
          "Neraca Saldo - Jurnal - Posting - Laporan Keuangan",
        ],
        correctAnswer: 0,
      },
    ],
  },
  
  // Level 3
  {
    id: "quiz-perp-3",
    title: "Kuis: Tax Planning dan Strategi Pajak",
    classId: "perpajakan",
    meetingNumber: 6,
    level: 3,
    duration: 40,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Apa perbedaan tax avoidance dan tax evasion?",
        options: [
          "Tidak ada perbedaan",
          "Tax avoidance legal, tax evasion ilegal",
          "Tax avoidance ilegal, tax evasion legal",
          "Keduanya ilegal",
        ],
        correctAnswer: 1,
      },
      {
        id: "q2",
        question: "Apa tujuan utama tax planning?",
        options: [
          "Menghindari pajak",
          "Meminimalkan beban pajak secara legal",
          "Manipulasi laporan keuangan",
          "Tidak membayar pajak",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "quiz-aud-3",
    title: "Kuis: Opini Audit dan Pelaporan",
    classId: "audit",
    meetingNumber: 6,
    level: 3,
    duration: 35,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Jenis opini audit terbaik adalah?",
        options: [
          "Wajar Tanpa Pengecualian",
          "Wajar Dengan Pengecualian",
          "Tidak Wajar",
          "Menolak Memberikan Opini",
        ],
        correctAnswer: 0,
      },
    ],
  },
  {
    id: "quiz-akun-3",
    title: "Kuis: Analisis Laporan Keuangan",
    classId: "akuntansi",
    meetingNumber: 6,
    level: 3,
    duration: 30,
    isPublished: true,
    questions: [
      {
        id: "q1",
        question: "Rasio yang mengukur kemampuan perusahaan membayar hutang jangka pendek adalah?",
        options: [
          "Rasio Profitabilitas",
          "Rasio Likuiditas",
          "Rasio Solvabilitas",
          "Rasio Aktivitas",
        ],
        correctAnswer: 1,
      },
    ],
  },
];

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Super Admin",
    email: "admin@example.com",
    role: "superadmin",
    createdAt: "2026-01-01",
  },
  {
    id: "2",
    name: "John Doe",
    email: "user@example.com",
    role: "user",
    createdAt: "2026-02-15",
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    createdAt: "2026-03-10",
  },
];

export const submissions: Submission[] = [
  {
    id: "sub-1",
    userId: "2",
    quizId: "quiz-perp-1",
    classId: "perpajakan",
    level: 1,
    answers: { q1: 1, q2: 1 },
    submittedAt: "2026-03-28T10:30:00",
    status: "pending",
    score: 100,
  },
  {
    id: "sub-2",
    userId: "3",
    assignmentId: "assign-perp-1",
    classId: "perpajakan",
    level: 1,
    answers: { fileUrl: "https://example.com/submission.pdf" },
    submittedAt: "2026-03-29T14:20:00",
    status: "approved",
    score: 85,
    feedback: "Good work!",
  },
  {
    id: "sub-3",
    userId: "2",
    assignmentId: "assign-perp-1",
    classId: "perpajakan",
    level: 1,
    answers: { fileUrl: "https://example.com/john-submission.pdf" },
    submittedAt: "2026-03-29T16:45:00",
    status: "pending",
    score: 90,
  },
  {
    id: "sub-4",
    userId: "3",
    quizId: "quiz-perp-1",
    classId: "perpajakan",
    level: 1,
    answers: { q1: 0, q2: 1 },
    submittedAt: "2026-03-28T15:20:00",
    status: "rejected",
    score: 50,
    feedback: "Please review the material about PPh before retaking the quiz.",
  },
  {
    id: "sub-5",
    userId: "2",
    assignmentId: "assign-aud-1",
    classId: "audit",
    level: 1,
    answers: { fileUrl: "https://example.com/audit-assignment.pdf" },
    submittedAt: "2026-03-30T09:15:00",
    status: "approved",
    score: 95,
    feedback: "Excellent analysis!",
  },
  {
    id: "sub-6",
    userId: "3",
    quizId: "quiz-akun-1",
    classId: "akuntansi",
    level: 1,
    answers: { q1: 1 },
    submittedAt: "2026-03-27T11:00:00",
    status: "approved",
    score: 100,
    feedback: "Perfect score!",
  },
];

export const userProgress: UserProgress[] = [
  {
    userId: "2",
    classId: "perpajakan",
    currentLevel: 1,
    completedMaterials: ["mat-perp-1", "mat-perp-2"],
    completedQuizzes: [],
    submissions: [submissions[0]],
  },
  {
    userId: "2",
    classId: "audit",
    currentLevel: 1,
    completedMaterials: ["mat-aud-1"],
    completedQuizzes: [],
    submissions: [],
  },
  {
    userId: "2",
    classId: "akuntansi",
    currentLevel: 1,
    completedMaterials: ["mat-akun-1", "mat-akun-2"],
    completedQuizzes: ["quiz-akun-1"],
    submissions: [],
  },
  {
    userId: "3",
    classId: "perpajakan",
    currentLevel: 1,
    completedMaterials: ["mat-perp-1"],
    completedQuizzes: [],
    submissions: [submissions[1]],
  },
];

// Mock user access data - user "2" has access to level 1 materials
export const userAccess = {
  userId: "2",
  classIds: ["perpajakan", "audit", "akuntansi"],
  materialIds: ["mat-perp-1", "mat-perp-2", "mat-aud-1", "mat-aud-2", "mat-akun-1", "mat-akun-2"],
  quizIds: ["quiz-perp-1", "quiz-akun-1"],
  assignmentIds: ["assign-perp-1"],
};