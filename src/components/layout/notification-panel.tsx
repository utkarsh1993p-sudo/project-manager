"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, type Notification, type NotifType } from "@/contexts/notifications-context";
import {
  Bell, RefreshCw, FolderKanban, FileText, Sparkles,
  CheckCircle2, X, Trash2,
} from "lucide-react";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_META: Record<NotifType, { label: string; icon: React.ElementType; color: string; bg: string; dot: string }> = {
  sync:       { label: "Sync",       icon: RefreshCw,    color: "text-blue-600",    bg: "bg-blue-50",    dot: "bg-blue-500" },
  jira:       { label: "JIRA",       icon: FolderKanban, color: "text-indigo-600",  bg: "bg-indigo-50",  dot: "bg-indigo-500" },
  confluence: { label: "Confluence", icon: FileText,     color: "text-sky-600",     bg: "bg-sky-50",     dot: "bg-sky-500" },
  project:    { label: "Projects",   icon: FolderKanban, color: "text-violet-600",  bg: "bg-violet-50",  dot: "bg-violet-500" },
  ai:         { label: "AI",         icon: Sparkles,     color: "text-purple-600",  bg: "bg-purple-50",  dot: "bg-purple-500" },
};

const GROUP_ORDER: NotifType[] = ["sync", "jira", "confluence", "project", "ai"];

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function NotifItem({ n, onClose }: { n: Notification; onClose: () => void }) {
  const router = useRouter();
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;

  function handleClick() {
    if (n.href) { router.push(n.href); onClose(); }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      onClick={n.href ? handleClick : undefined}
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors duration-150 ${
        n.href ? "cursor-pointer hover:bg-blue-50/50" : "cursor-default"
      } ${!n.read ? "bg-blue-50/30" : ""}`}
    >
      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={14} className={meta.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${n.read ? "text-gray-700" : "text-gray-900"}`}>
            {n.title}
          </p>
          <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(n.timestamp)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.description}</p>
      </div>
      {!n.read && <div className={`w-1.5 h-1.5 rounded-full ${meta.dot} mt-2 shrink-0`} />}
    </motion.div>
  );
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAllRead, clear } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Group by type, preserve GROUP_ORDER, only show types that have items
  const grouped = GROUP_ORDER.reduce<Record<string, Notification[]>>((acc, type) => {
    const items = notifications.filter((n) => n.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  const hasAny = notifications.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-full right-0 mt-2 w-[380px] bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.14)] border border-gray-100 z-50 overflow-hidden"
          style={{ transformOrigin: "top right" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-medium bg-blue-600 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={12} /> Mark all read
                </button>
              )}
              {hasAny && (
                <button
                  onClick={clear}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} /> Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[480px] overflow-y-auto">
            {!hasAny ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Bell size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">Updates from syncs, JIRA, Confluence, and projects will appear here.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const meta = TYPE_META[type as NotifType];
                const GroupIcon = meta.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 sticky top-0 z-10 border-b border-gray-100">
                      <GroupIcon size={12} className={meta.color} />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{meta.label}</span>
                      <span className="text-xs text-gray-400 ml-auto">{items.length}</span>
                    </div>
                    <AnimatePresence>
                      {items.map((n) => (
                        <NotifItem key={n.id} n={n} onClose={onClose} />
                      ))}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
