"use client";

import { useState } from "react";
import { Sparkles, X, Copy, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Project } from "@/types";

const AI_ACTIONS = [
  { id: "project_summary", label: "Project Summary", desc: "3-5 sentence status overview" },
  { id: "executive_summary", label: "Executive Summary", desc: "Leadership-ready brief" },
  { id: "stakeholder_update", label: "Stakeholder Update Email", desc: "Ready-to-send email draft" },
  { id: "risk_assessment", label: "Risk Assessment", desc: "Analyze all risks with mitigations" },
  { id: "action_plan", label: "30-Day Action Plan", desc: "Prioritized next steps" },
  { id: "weekly_report", label: "Weekly Status Report", desc: "Full weekly report with RAG status" },
  { id: "pushback_simulator", label: "Simulate Pushback", desc: "Stakeholder objections + responses" },
  { id: "scope_breakdown", label: "Scope Breakdown", desc: "Goals → deliverables with estimates" },
];

interface AIAssistantProps {
  project: Project;
}

export function AIAssistant({ project }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ action: string; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate(action: string, label: string) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          context: {
            name: project.name,
            description: project.description,
            status: project.status,
            progress: project.progress,
            goals: project.goals,
            startDate: project.startDate,
            endDate: project.endDate,
            team: project.team.map((m) => ({ name: m.name, role: m.role })),
            stakeholders: project.stakeholders,
            risks: project.risks,
            tasks: project.tasks.map((t) => ({
              title: t.title,
              status: t.status,
              priority: t.priority,
              assignee: t.assignee,
            })),
            timeline: project.timeline,
          },
        }),
      });
      const data = await res.json();
      if (data.result) setResult({ action: label, text: data.result });
    } finally {
      setLoading(null);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Result panel */}
      {result && (
        <Card className="mb-3 w-96 shadow-xl border-blue-100">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">{result.action}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={copy}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-white"
              >
                <Copy size={12} />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setResult(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-white"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 max-h-80 overflow-y-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {result.text}
            </pre>
          </div>
        </Card>
      )}

      {/* Action menu */}
      {open && (
        <Card className="mb-3 w-72 shadow-xl">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">AI Assistant</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Generate content for this project</p>
          </div>
          <div className="py-1">
            {AI_ACTIONS.map((action) => (
              <button
                key={action.id}
                onClick={() => generate(action.id, action.label)}
                disabled={!!loading}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.desc}</p>
                  </div>
                  {loading === action.id && (
                    <Sparkles size={14} className="text-blue-500 animate-pulse shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Sparkles size={18} />
        <span className="text-sm font-semibold">AI Assistant</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
