export type UserRole = "superadmin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  content: string;
  classId: string;
  meetingNumber: number;
  createdAt: string;
  isPublished: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  classId: string;
  meetingNumber: number;
  materialId?: string;
  isPublished: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  classId: string;
  meetingNumber: number;
  duration: number; // in minutes
  isPublished: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface UserAccess {
  userId: string;
  classId: string;
  materialIds: string[];
  quizIds: string[];
  assignmentIds: string[];
}
