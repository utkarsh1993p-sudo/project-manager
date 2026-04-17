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
    <nav className="flex-1 px-3 py-4 space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <motion.div
            key={item.href}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                active
                  ? "bg-white/15 text-white shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-white/20"
                  : "text-slate-400 hover:bg-white/8 hover:text-white border border-transparent"
              )}
              style={active ? { backdropFilter: "blur(8px)" } : {}}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-white/20"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={16} className="relative z-10 shrink-0" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </nav>
  );
}

function UserBlock() {
  return (
    <div className="px-4 py-4 border-t border-white/10">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 shadow-lg ring-2 ring-white/20">
          UP
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">Utkarsh Pandey</p>
          <p className="text-xs text-slate-400 truncate">Admin</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="px-6 py-5 border-b border-white/10">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-white font-bold text-sm">PM</span>
        </div>
        <div>
          <p className="font-semibold text-white text-sm leading-tight">ProjectFlow</p>
          <p className="text-xs text-slate-400">AI-Powered</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-slate-900 border border-white/20 rounded-lg flex items-center justify-center shadow-sm"
      >
        <Menu size={18} className="text-slate-300" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden fixed top-0 left-0 h-full w-72 z-50 flex flex-col"
            style={{
              background: "linear-gradient(160deg, #0f1729 0%, #111827 50%, #0f1729 100%)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">PM</span>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">ProjectFlow</p>
                  <p className="text-xs text-slate-400">AI-Powered</p>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <UserBlock />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col min-h-screen"
        style={{
          background: "linear-gradient(160deg, #0f1729 0%, #111827 60%, #0d1520 100%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Mirror sheen at top */}
        <div className="absolute top-0 left-0 w-60 h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
        <Logo />
        <NavLinks />
        <UserBlock />
      </aside>
    </>
  );
}
