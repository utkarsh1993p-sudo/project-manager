"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type NotifType = "sync" | "jira" | "confluence" | "project" | "ai";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

interface NotificationsCtx {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clear: () => void;
}

const Ctx = createContext<NotificationsCtx | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const add = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNotifications((prev) => [
      { ...n, id, timestamp: new Date(), read: false },
      ...prev,
    ].slice(0, 60));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Ctx.Provider value={{ notifications, unreadCount, add, markAllRead, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications outside NotificationsProvider");
  return ctx;
}
