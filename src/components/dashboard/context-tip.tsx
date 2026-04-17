"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ContextTipProps {
  text: string;
  enabled: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ContextTip({ text, enabled, children, className }: ContextTipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    if (!enabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={ref}
      className={`relative ${className ?? ""}`}
      onMouseEnter={() => enabled && setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onMouseMove={handleMouseMove}
    >
      {children}

      <AnimatePresence>
        {visible && enabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 4 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute z-50"
            style={{
              left: Math.min(pos.x + 12, (ref.current?.offsetWidth ?? 300) - 200),
              top: pos.y + 16,
            }}
          >
            <div className="bg-gray-900 text-white text-xs leading-relaxed rounded-xl px-3 py-2.5 max-w-[200px] shadow-xl">
              <div className="absolute -top-1.5 left-4 w-3 h-3 bg-gray-900 rotate-45 rounded-sm" />
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
