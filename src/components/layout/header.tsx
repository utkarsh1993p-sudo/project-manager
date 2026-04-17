"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/contexts/notifications-context";
import { NotificationPanel } from "./notification-panel";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <header className="h-14 md:h-16 border-b border-gray-100 bg-white px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="pl-10 md:pl-0">
        <h1 className="text-base md:text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs md:text-sm text-gray-400 truncate max-w-xs md:max-w-none">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 cursor-pointer">
          <Search size={15} />
        </button>

        {/* Bell with panel */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={() => setPanelOpen((v) => !v)}
            className={`w-8 h-8 md:w-9 md:h-9 rounded-lg border flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
              panelOpen
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Bell size={15} />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 20 }}
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-[0_0_6px_rgba(37,99,235,0.5)]"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
        </div>
      </div>
    </header>
  );
}
