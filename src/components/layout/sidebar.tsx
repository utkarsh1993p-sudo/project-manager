"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Team", href: "/team", icon: Users },
  { label: "Settings & Integrations", href: "/settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <motion.div
            key={item.href}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 relative",
                active
                  ? "text-blue-700"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-blue-50 border border-blue-100 shadow-[0_4px_16px_rgba(37,99,235,0.12)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {!active && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gray-50 opacity-0 hover:opacity-100 transition-opacity duration-150"
                />
              )}
              <Icon size={16} className="relative z-10 shrink-0" />
              <span className="relative z-10 flex-1">{item.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

function UserBlock() {
  return (
    <div className="px-4 py-4 border-t border-gray-100">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-sm">
          UP
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">Utkarsh Pandey</p>
          <p className="text-xs text-gray-400 truncate">Admin</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="px-6 py-5 border-b border-gray-100">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-md"
        >
          <span className="text-white font-bold text-sm">PM</span>
        </motion.div>
        <div>
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-bold text-gray-900 text-base leading-tight tracking-tight"
          >
            ProjectFlow
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="text-xs text-gray-400 mt-0.5"
          >
            Real time management
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm cursor-pointer"
      >
        <Menu size={18} className="text-gray-600" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="md:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">ProjectFlow</p>
                  <p className="text-xs text-gray-400">AI-Powered</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <UserBlock />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="hidden md:flex w-60 shrink-0 border-r border-gray-100 bg-white flex-col min-h-screen">
        <Logo />
        <NavLinks />
        <UserBlock />
      </aside>
    </>
  );
}
