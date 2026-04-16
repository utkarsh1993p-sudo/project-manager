"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, RefreshCw, Copy, Check, ChevronDown,
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
        setError(data.error ?? "Generation failed.");
      } else {
        setResult(data.content);
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
      subtitle="Claude · Powered by Anthropic"
      width="xl"
    >
      <div className="p-4 md:p-6 space-y-5">

        {/* Header badge */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Generate with AI</p>
            <p className="text-xs text-gray-400">Select an action and optionally scope to one project</p>
          </div>
          <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0">Active</Badge>
        </div>

        {/* Action selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Action</label>
          <div className="grid grid-cols-1 gap-2">
            {ACTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAction(a.id); reset(); }}
                className={`text-left rounded-xl border px-4 py-3 transition-all ${
                  selectedAction === a.id
                    ? "border-violet-300 bg-violet-50"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className={`text-sm font-medium ${selectedAction === a.id ? "text-violet-800" : "text-gray-800"}`}>{a.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Project scope */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Scope</label>
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
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={generate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white"
        >
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Generating…</>
            : <><Sparkles size={14} /> Generate {action.label}</>
          }
        </Button>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Output</p>
              <button
                onClick={copyResult}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 max-h-[50vh] overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
