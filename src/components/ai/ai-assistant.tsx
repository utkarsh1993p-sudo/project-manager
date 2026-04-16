"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, ChevronDown, Copy, Check } from "lucide-react";
import type { Project } from "@/types";

// Lightweight markdown renderer — no extra dependencies needed
function MarkdownText({ text }: { text: string }) {
  function renderInline(str: string): React.ReactNode[] {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={i}>{part.slice(1, -1)}</em>;
      return part;
    });
  }

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (!line.trim()) {
      elements.push(<div key={i} className="h-1.5" />);
    } else if (line.startsWith("### ")) {
      elements.push(
        <p key={i} className="font-semibold text-sm mt-2 mb-0.5">
          {renderInline(line.slice(4))}
        </p>
      );
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      const depth = line.startsWith("## ") ? 3 : 2;
      elements.push(
        <p key={i} className="font-bold text-sm mt-2 mb-0.5">
          {renderInline(line.slice(depth))}
        </p>
      );
    } else if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm leading-relaxed">
          <span className="shrink-0 mt-0.5 text-gray-400">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        elements.push(
          <div key={i} className="flex gap-1.5 text-sm leading-relaxed">
            <span className="shrink-0 font-medium text-gray-500 w-4">{match[1]}.</span>
            <span>{renderInline(match[2])}</span>
          </div>
        );
      }
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}

const QUICK_ACTIONS = [
  { id: "project_summary", label: "Project Summary" },
  { id: "executive_summary", label: "Executive Summary" },
  { id: "stakeholder_update", label: "Stakeholder Email" },
  { id: "risk_assessment", label: "Risk Assessment" },
  { id: "action_plan", label: "30-Day Plan" },
  { id: "weekly_report", label: "Weekly Report" },
  { id: "pushback_simulator", label: "Simulate Pushback" },
  { id: "scope_breakdown", label: "Scope Breakdown" },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  project: Project;
}

export function AIAssistant({ project }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm your AI project assistant for **${project.name}**. Ask me anything or pick a quick action below.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const projectContext = {
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
  };

  async function send(action?: string, actionLabel?: string) {
    const userText = actionLabel ?? input.trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action ?? "chat",
          context: action
            ? projectContext
            : { ...projectContext, message: userText },
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.result ?? data.error ?? "Something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get a response. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat panel */}
      {open && (
        <div
          className="mb-3 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={14} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">AI Assistant</p>
                <p className="text-xs opacity-75 truncate max-w-[230px]">{project.name}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0 mb-0.5">
                    <Sparkles size={10} className="text-white" />
                  </div>
                )}
                <div
                  className={`group flex flex-col gap-1 max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`px-3 py-2.5 rounded-2xl ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <MarkdownText text={msg.content} />
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "assistant" && msg.content.length > 50 && (
                    <button
                      onClick={() => copy(msg.content, i)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                    >
                      {copiedIndex === i ? (
                        <><Check size={10} /> Copied</>
                      ) : (
                        <><Copy size={10} /> Copy</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                  <Sparkles size={10} className="text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick action chips */}
          <div className="px-3 pt-2 pb-1 border-t border-gray-100 shrink-0 bg-white">
            <div
              className="flex gap-1.5 overflow-x-auto pb-1.5"
              style={{ scrollbarWidth: "none" }}
            >
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => send(a.id, a.label)}
                  disabled={loading}
                  className="shrink-0 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 disabled:opacity-40 transition-colors whitespace-nowrap border border-blue-100"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 shrink-0 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything about this project..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) send();
                }}
                disabled={loading}
                className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Sparkles size={18} />
        <span className="text-sm font-semibold">AI Assistant</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
