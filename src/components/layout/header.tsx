"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search } from "lucide-react";
import { useNotifications } from "@/contexts/notifications-context";
import { NotificationPanel } from "./notification-panel";

const CYCLE_WORDS = ["PROJECTS", "PLANNING", "RISK MANAGEMENT", "EXECUTION", "METRICS ON DEMAND"];
const CYCLE_DELAY = 2000;

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title }: HeaderProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [wordIndex, setWordIndex] = useState(0);

  // Infinite loop
  useEffect(() => {
    const id = setTimeout(
      () => setWordIndex((i) => (i + 1) % CYCLE_WORDS.length),
      CYCLE_DELAY
    );
    return () => clearTimeout(id);
  }, [wordIndex]);

  return (
    <header className="h-16 md:h-20 border-b border-gray-100 bg-white px-4 md:px-6 flex items-center justify-between shrink-0">

      {/* ── Title row ── */}
      <div className="pl-10 md:pl-0 flex flex-col justify-center gap-1">

        {/* "Dashboard · Think [cycling]" on one line */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-baseline gap-2 flex-wrap"
        >
          {/* Dashboard */}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight tracking-tight uppercase">
            {title}
          </h1>

          {/* Divider dot */}
          <span className="text-gray-300 text-lg font-light select-none">·</span>

          {/* "Think" — fixed accent word */}
          <span className="text-xl md:text-2xl font-bold text-blue-600 leading-tight tracking-tight">
            THINK
          </span>

          {/* Cycling word — vertical ticker */}
          <div
            className="overflow-hidden"
            style={{ height: "1.75rem", minWidth: "180px", display: "flex", alignItems: "flex-start" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={wordIndex}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: "block", lineHeight: "1.75rem" }}
                className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight whitespace-nowrap"
              >
                {CYCLE_WORDS[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-xs text-gray-400"
        >
          PROGRAMME MANAGEMENT DELIVERY DASHBOARD · METRICS ON DEMAND
        </motion.p>
      </div>

      {/* ── Right controls ── */}
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
