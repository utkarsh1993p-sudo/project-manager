"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIButtonProps {
  action: string;
  context: object;
  label?: string;
  onResult: (result: string) => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export function AIButton({
  action,
  context,
  label = "Generate with AI",
  onResult,
  variant = "secondary",
  size = "sm",
}: AIButtonProps) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, context }),
      });
      const data = await res.json();
      if (data.result) onResult(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={generate} disabled={loading}>
      <Sparkles size={14} className={loading ? "animate-pulse" : ""} />
      {loading ? "Generating..." : label}
    </Button>
  );
}
