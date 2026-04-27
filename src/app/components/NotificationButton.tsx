import { Bell, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { AppNotification } from "../types";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL ?? "";

export function NotificationButton() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const hasLoadedRef = useRef(false);
  const seenIdsRef = useRef<Set<number>>(new Set());
  const storageKey = user ? `dismissed_notifications_${user.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setDismissedIds([]);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setDismissedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setDismissedIds([]);
    }
  }, [storageKey]);

  const getNotificationIcon = (type: AppNotification["type"]) => {
    if (type === "SUCCESS") {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }

    if (type === "FAILED") {
      return <XCircle className="h-4 w-4 text-rose-600" />;
    }

    return <Info className="h-4 w-4 text-sky-600" />;
  };

  const showNotificationToast = (item: AppNotification) => {
    toast.custom(
      () => (
        <div className="flex w-[360px] items-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3 shadow-lg">
          <div className="shrink-0">{getNotificationIcon(item.type)}</div>
          <p className="line-clamp-1 text-sm text-foreground">{item.message}</p>
        </div>
      ),
      {
        duration: 3500,
      },
    );
  };

  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;

    try {
      const res = await fetch(`${API}/api/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json.success) return;

      const nextNotifications = (json.data ?? []) as AppNotification[];
      if (hasLoadedRef.current) {
        const newItems = nextNotifications.filter(
          (item) => !seenIdsRef.current.has(item.id_notification),
        );

        newItems
          .slice()
          .reverse()
          .forEach((item) => {
            showNotificationToast(item);
          });
      }

      seenIdsRef.current = new Set(
        nextNotifications.map((item) => item.id_notification),
      );
      hasLoadedRef.current = true;

      setNotifications(nextNotifications);
    } catch {
      // keep the bell usable even if notification fetch fails
    }
  }, [token, user]);

  useEffect(() => {
    const visibleNotifications = notifications.filter(
      (item) => !dismissedIds.includes(item.id_notification),
    );
    setUnreadCount(visibleNotifications.filter((item) => !item.is_read).length);
  }, [dismissedIds, notifications]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!token || !user) return;

    const intervalId = window.setInterval(() => {
      void fetchNotifications();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [fetchNotifications, token, user]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (!open || unreadCount === 0 || !token) return;

    setUnreadCount(0);
    setNotifications((current) =>
      current.map((item) => ({ ...item, is_read: true })),
    );

    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      void fetchNotifications();
    }
  };

  const handleDismiss = (notificationId: number) => {
    setDismissedIds((current) => {
      const next = current.includes(notificationId)
        ? current
        : [...current, notificationId];

      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(next));
      }

      return next;
    });
  };

  const visibleNotifications = notifications.filter(
    (item) => !dismissedIds.includes(item.id_notification),
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {visibleNotifications.length === 0 ? (
            <div className="px-3 py-6 text-sm text-muted-foreground">
              Belum ada notifikasi.
            </div>
          ) : (
            visibleNotifications.map((item) => (
              <div
                key={item.id_notification}
                className="border-b border-border/60 px-3 py-3 last:border-b-0"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-5 text-foreground">
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Hapus notifikasi dari tampilan"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleDismiss(item.id_notification);
                    }}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
