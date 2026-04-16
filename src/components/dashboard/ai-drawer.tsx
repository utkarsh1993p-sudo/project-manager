"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, RefreshCw, Copy, Check, ChevronDown, FileText,
} from "lucide-react";
import type { Project } from "@/types";

interface AiDrawerProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
}

const ACTIONS = [
  { id: "executive-summary", label: "Executive Summary", description: "High-level status across all projects" },
  { id: "risk-report", label: "Risk Report", description: "Consolidated open risks and mitigations" },
  { id: "velocity-report", label: "Velocity Report", description: "Task completion trends by project" },
  { id: "team-workload", label: "Team Workload", description: "Who is working on what across projects" },
  { id: "milestone-outlook", label: "Milestone Outlook", description: "Upcoming milestones and timeline health" },
  { id: "weekly-standup", label: "Weekly Standup Notes", description: "Ready-to-share standup summary" },
  { id: "project-brief", label: "Project Brief", description: "One-page brief for a selected project" },
  { id: "status-update", label: "Status Update Email", description: "Draft a stakeholder status update" },
];

export function AiDrawer({ open, onClose, projects }: AiDrawerProps) {
  const [selectedAction, setSelectedAction] = useState(ACTIONS[0].id);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const targetProjects =
        selectedProject === "all" ? projects : projects.filter((p) => p.id === selectedProject);

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: selectedAction, projects: targetProjects }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Generation failed. Please try again.");
      } else {
        setResult(data.content ?? "");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setResult(null);
    setError(null);
    setCopied(false);
  }

  const action = ACTIONS.find((a) => a.id === selectedAction)!;

  return (
    <Drawer
      open={open}
      onClose={() => { onClose(); reset(); }}
      title="AI Assistant"
      subtitle="Powered by Groq · llama-3.3-70b"
      width="xl"
    >
      {/* Two-panel layout — controls left, output right */}
      <div className="flex h-full divide-x divide-gray-100">

        {/* ── Left panel: controls ── */}
        <div className="w-80 shrink-0 flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Scope */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Scope</label>
              <div className="relative">
                <select
                  value={selectedProject}
                  onChange={(e) => { setSelectedProject(e.target.value); reset(); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none pr-8"
                >
                  <option value="all">All projects ({projects.length})</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Action list */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Action</label>
              <div className="space-y-1.5">
                {ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAction(a.id); reset(); }}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                      selectedAction === a.id
                        ? "border-violet-300 bg-violet-50"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${selectedAction === a.id ? "text-violet-800" : "text-gray-800"}`}>{a.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{a.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button — sticky at bottom of left panel */}
          <div className="mt-auto p-4 border-t border-gray-100">
            <Button
              onClick={generate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white"
            >
              {loading
                ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
                : <><Sparkles size={13} /> Generate</>
              }
            </Button>
          </div>
        </div>

        {/* ── Right panel: output ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Output header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">{action.label}</span>
              {result && <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Ready</Badge>}
            </div>
            {result && (
              <button
                onClick={copyResult}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>

          {/* Output body */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Sparkles size={20} className="text-violet-500 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-gray-500">Generating {action.label}…</p>
                <p className="text-xs text-gray-400">This usually takes 5–10 seconds</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700 max-w-md text-center">
                  {error}
                </div>
              </div>
            )}

            {result && !loading && (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
            )}

            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                  <Sparkles size={24} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">Select an action and generate</p>
                  <p className="text-xs text-gray-400 mt-1">Output will appear here instantly</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
