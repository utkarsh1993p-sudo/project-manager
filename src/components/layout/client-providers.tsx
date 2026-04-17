"use client";

import { NotificationsProvider } from "@/contexts/notifications-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <NotificationsProvider>{children}</NotificationsProvider>;
}
