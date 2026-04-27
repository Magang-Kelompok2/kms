import { supabase } from "./supabase";

export type NotificationType = "SUCCESS" | "FAILED" | "INFO";
export type NotificationCategory = "MATERI" | "USER" | "TUGAS" | "KUIS";

type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  status: number;
  category?: NotificationCategory;
  message: string;
  isRead?: boolean;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error ?? "Terjadi kesalahan yang tidak diketahui");
};

export async function createNotification({
  userId,
  type,
  status,
  category,
  message,
  isRead = false,
}: CreateNotificationInput) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      id_user: userId,
      type,
      status,
      category: category ?? null,
      message,
      is_read: isRead,
    })
    .select(
      "id_notification, id_user, type, status, category, message, is_read, created_at",
    )
    .single();

  if (error) throw error;
  return data;
}

export async function createNotificationSafe(
  input: CreateNotificationInput,
) {
  try {
    return await createNotification(input);
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export function buildNotificationMessage(
  _status: number,
  _prefix: string,
  detail: string,
) {
  return detail;
}

export function buildErrorNotificationMessage(
  _prefix: string,
  error: unknown,
  detail?: string,
) {
  if (!detail) {
    return getErrorMessage(error);
  }

  return `${detail}: ${getErrorMessage(error)}`;
}
