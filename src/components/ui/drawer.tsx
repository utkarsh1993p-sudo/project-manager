"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: "md" | "lg" | "xl";
  children: React.ReactNode;
}

export function Drawer({ open, onClose, title, subtitle, width = "lg", children }: DrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const widthClass = {
    md: "md:max-w-md",
    lg: "md:max-w-2xl",
    xl: "md:max-w-4xl",
  }[width];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel — full width on mobile, capped on desktop */}
      <div
        className={`fixed top-0 right-0 h-full w-full ${widthClass} bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-4 md:px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-base font-semibold text-gray-900 truncate">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
