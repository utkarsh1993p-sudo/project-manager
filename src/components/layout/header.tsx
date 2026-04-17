"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/contexts/notifications-context";
import { NotificationPanel } from "./notification-panel";

const CYCLE_WORDS = ["Insights", "Planning", "Projects", "Ready when you are"];
const CYCLE_DELAY = 1800; // ms between each word

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title }: HeaderProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [wordIndex, setWordIndex] = useState(0);
  const [cyclingDone, setCyclingDone] = useState(false);

  useEffect(() => {
    if (cyclingDone) return;
    if (wordIndex >= CYCLE_WORDS.length - 1) {
      setCyclingDone(true);
      return;
    }
    const id = setTimeout(() => setWordIndex((i) => i + 1), CYCLE_DELAY);
    return () => clearTimeout(id);
  }, [wordIndex, cyclingDone]);

  return (
    <header className="h-16 md:h-20 border-b border-gray-100 bg-white px-4 md:px-6 flex items-center justify-between shrink-0">
      {/* Title block */}
      <div className="pl-10 md:pl-0 flex flex-col justify-center gap-0.5">
        <motion.h1
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl md:text-2xl font-bold text-gray-900 leading-tight"
        >
          {title}
        </motion.h1>

        {/* Cycling subtitle */}
        <div className="h-5 overflow-hidden relative">
          <AnimatePresence mode="popLayout">
            <motion.p
              key={wordIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm text-gray-400 absolute whitespace-nowrap"
            >
              {CYCLE_WORDS[wordIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all duration-150 cursor-pointer"
        >
          <Search size={15} />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            onClick={() => setPanelOpen((v) => !v)}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-150 cursor-pointer relative ${
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
        </motion.div>
      </div>
    </header>
  );
}
