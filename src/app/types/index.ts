export type UserRole = "superadmin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  content: string;
  classId: string;
  meetingNumber: number;
  level: number;
  createdAt: string;
  isPublished: boolean;
  files: MaterialFile[];
}

export interface MaterialFile {
  id: string;
  name: string;
  type: "pdf" | "video";
  url: string;
  duration?: string; // for videos
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  meetingNumber: number;
  level: number;
  materialId?: string;
  isPublished: boolean;
  attachments?: AssignmentFile[]; // PDF files from superadmin
}

export interface AssignmentFile {
  id: string;
  name: string;
  url: string;
  type: "pdf";
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  classId: string;
  meetingNumber: number;
  level: number;
  duration: number; // in minutes
  isPublished: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Submission {
  id: string;
  userId: string;
  quizId?: string;
  assignmentId?: string;
  classId: string;
  level: number;
  answers: any;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  score?: number;
  feedback?: string;
}

export interface UserProgress {
  userId: string;
  classId: string;
  currentLevel: number;
  completedMaterials: string[];
  completedQuizzes: string[];
  submissions: Submission[];
}

export interface Class {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  totalLevels: number;
}

export interface UserAccess {
  userId: string;
  classId: string;
  materialIds: string[];
  quizIds: string[];
  assignmentIds: string[];
}