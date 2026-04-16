"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectDrawer } from "./project-drawer";
import { JiraDrawer } from "./jira-drawer";
import { ConfluenceDrawer } from "./confluence-drawer";
import { formatDate } from "@/lib/utils";
import {
  Users, AlertTriangle, Clock, TrendingUp,
  Target, CheckCircle2, ArrowRight, Sparkles,
  ChevronRight, Zap, FileText, Settings2,
  RefreshCw, Rocket, CheckCircle, XCircle,
} from "lucide-react";

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  planning: "bg-blue-100 text-blue-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

const WORKFLOW_STEPS = [
  { label: "START", title: "Use Claude as a Project Partner", bullets: ["Use Co-Work mode (desktop)", "Connect it to your project files", "Treat it like part of your team"], note: "Setup once. Reuse across projects.", color: "bg-green-50 border-green-200", labelColor: "bg-green-500", icon: Zap },
  { label: "Step 2", title: "Load Your Project Context", bullets: ["Project goals", "Stakeholders", "Timeline", "Risks"], note: "Claude works from your context.", color: "bg-yellow-50 border-yellow-200", labelColor: "bg-yellow-500", icon: FileText },
  { label: "Step 3", title: "Define How Claude Should Work", bullets: ["Read files before answering", "Ask questions first", "Break work into steps"], note: "Guide the thinking, not just output.", color: "bg-yellow-50 border-yellow-200", labelColor: "bg-yellow-500", icon: Settings2 },
  { label: "Step 4", title: "Build Your Project Workspace", bullets: ["project-overview.md", "stakeholder-map.md", "risk-log.md", "action-plan.md"], note: "Your files become Claude's system.", color: "bg-blue-50 border-blue-200", labelColor: "bg-blue-500", icon: Target },
  { label: "Step 5", title: "Use Claude for Planning", bullets: ["Draft stakeholder updates", "Prepare executive summaries", "Simulate pushback"], note: "Faster structured planning.", color: "bg-blue-50 border-blue-200", labelColor: "bg-blue-500", icon: TrendingUp },
  { label: "Step 6", title: "Claude for Alignment & Decisions", bullets: ["Break down scope", "Build timelines", "Identify dependencies"], note: "Better conversations, faster decisions.", color: "bg-purple-50 border-purple-200", labelColor: "bg-purple-500", icon: Users },
  { label: "Step 7", title: "Manage Risk & Adjust Execution", bullets: ["Update plans in real-time", "Adjust timelines", "Refine deliverables"], note: "Claude Co-Work can update your project files.", color: "bg-red-50 border-red-200", labelColor: "bg-red-500", icon: AlertTriangle },
  { label: "Step 8", title: "Correct and Iterate", bullets: ["Identify what's off", "Refine outputs", "Improve direction"], note: "Iterate, don't restart.", color: "bg-red-50 border-red-200", labelColor: "bg-red-500", icon: RefreshCw },
  { label: "Step 9", title: "Standardize Your Workflow", bullets: ["Reuse prompts", "Build templates", "Automate recurring work"], note: "Efficiency compounds over time.", color: "bg-blue-50 border-blue-200", labelColor: "bg-blue-500", icon: Settings2 },
  { label: "FINISH", title: "Run Projects With Leverage", bullets: ["Faster planning", "Better communication", "Stronger execution", "Less manual effort"], note: "Claude amplifies your execution.", color: "bg-teal-50 border-teal-200", labelColor: "bg-teal-500", icon: Rocket },
];

interface DashboardClientProps {
  projects: Project[];
  jiraConnected: boolean;
  confluenceConnected: boolean;
  jiraDomain?: string;
  jiraKey?: string;
  confluenceDomain?: string;
}

export function DashboardClient({
  projects,
  jiraConnected,
  confluenceConnected,
  jiraDomain,
  jiraKey,
  confluenceDomain,
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [jiraOpen, setJiraOpen] = useState(false);
  const [confluenceOpen, setConfluenceOpen] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { ok: boolean; error?: string }> | null>(null);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const syncingRef = useRef(false);

  const totalTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== "done").length;
  const openRisks = projects.flatMap((p) => p.risks.filter((r) => r.status === "open")).length;
  const activeCount = projects.filter((p) => p.status === "active").length;

  const runSync = useCallback(async (silent = false) => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    if (!silent) setShowSyncResults(false);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setLastSyncedAt(new Date());
      setSyncResults(data.results ?? null);
      if (!silent) setShowSyncResults(true);
      router.refresh();
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // Auto-poll every 5 minutes
  useEffect(() => {
    const id = setInterval(() => runSync(true), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [runSync]);

  return (
    <>
      {/* Drawers */}
      <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
      <JiraDrawer open={jiraOpen} onClose={() => setJiraOpen(false)} />
      <ConfluenceDrawer open={confluenceOpen} onClose={() => setConfluenceOpen(false)} />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Projects", short: "Projects", value: projects.length, icon: Target, color: "text-blue-600 bg-blue-50" },
            { label: "Active Projects", short: "Active", value: activeCount, icon: TrendingUp, color: "text-green-600 bg-green-50" },
            { label: "Open Tasks", short: "Tasks", value: totalTasks, icon: CheckCircle2, color: "text-purple-600 bg-purple-50" },
            { label: "Open Risks", short: "Risks", value: openRisks, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-2 md:gap-4 p-3 md:py-5 md:px-6">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] md:text-sm text-gray-500 truncate">
                      <span className="md:hidden">{stat.short}</span>
                      <span className="hidden md:inline">{stat.label}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sync bar */}
        <div className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${jiraConnected && confluenceConnected ? "bg-green-500" : "bg-yellow-400"}`} />
            <div>
              <p className="text-sm font-medium text-gray-800">
                {jiraConnected && confluenceConnected ? "All integrations connected" : "Partial integrations"}
              </p>
              <p className="text-xs text-gray-500">
                {lastSyncedAt
                  ? `Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Auto-syncs every 5 min`
                  : "Auto-syncs every 5 min · Click to sync now"}
              </p>
            </div>
          </div>
          <button
            onClick={() => runSync(false)}
            disabled={syncing}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync All"}
          </button>
        </div>

        {/* Sync results */}
        {showSyncResults && syncResults && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sync Results</p>
              <button onClick={() => setShowSyncResults(false)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
            </div>
            {Object.entries(syncResults).map(([key, val]) => {
              const result = val as { ok: boolean; error?: string; synced?: number; created?: number; updated?: number; pushed?: number; pulled?: number; failed?: number; reconciled?: number };
              const label: Record<string, string> = {
                jiraToSupabase: "JIRA → Supabase",
                supabaseToJira: "Supabase → JIRA",
                supabaseToConfluence: "Supabase → Confluence",
                confluenceToSupabase: "Confluence → Supabase",
              };
              const detail = result.ok
                ? [
                    result.synced != null && `${result.synced} synced`,
                    result.created != null && `${result.created} created`,
                    result.updated != null && `${result.updated} updated`,
                    result.pushed != null && `${result.pushed} pushed`,
                    result.pulled != null && `${result.pulled} pulled`,
                    result.reconciled != null && result.reconciled > 0 && `${result.reconciled} closed (deleted in JIRA)`,
                    result.failed != null && result.failed > 0 && `${result.failed} failed`,
                  ].filter(Boolean).join(" · ")
                : result.error;
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {result.ok
                    ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                    : <XCircle size={14} className="text-red-400 shrink-0" />}
                  <span className="font-medium text-gray-700 w-44 shrink-0">{label[key] ?? key}</span>
                  <span className={result.ok ? "text-gray-500" : "text-red-500"}>{detail}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Integration tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {/* JIRA tile — clickable */}
          <button
            onClick={() => jiraConnected && setJiraOpen(true)}
            className={`text-left rounded-xl border p-4 transition-all ${
              jiraConnected
                ? "border-blue-200 bg-blue-50 hover:shadow-md hover:border-blue-300 cursor-pointer"
                : "border-gray-200 bg-gray-50 cursor-default"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">J</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">JIRA</p>
                <p className="text-xs text-gray-500 truncate">
                  {jiraConnected ? `${jiraDomain} · ${jiraKey}` : "Not connected"}
                </p>
              </div>
              <Badge className={jiraConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                {jiraConnected ? "Live" : "Setup"}
              </Badge>
            </div>
            {jiraConnected && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                Click to view issues <ChevronRight size={12} />
              </p>
            )}
            {!jiraConnected && (
              <Link href="/settings" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                Configure in Settings →
              </Link>
            )}
          </button>

          {/* Confluence tile — clickable */}
          <button
            onClick={() => confluenceConnected && setConfluenceOpen(true)}
            className={`text-left rounded-xl border p-4 transition-all ${
              confluenceConnected
                ? "border-blue-200 bg-blue-50 hover:shadow-md hover:border-blue-300 cursor-pointer"
                : "border-gray-200 bg-gray-50 cursor-default"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Confluence</p>
                <p className="text-xs text-gray-500 truncate">
                  {confluenceConnected ? confluenceDomain : "Not connected"}
                </p>
              </div>
              <Badge className={confluenceConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                {confluenceConnected ? "Live" : "Setup"}
              </Badge>
            </div>
            {confluenceConnected && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                Click to view pages <ChevronRight size={12} />
              </p>
            )}
            {!confluenceConnected && (
              <Link href="/settings" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                Configure in Settings →
              </Link>
            )}
          </button>

          {/* AI tile */}
          <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">AI Assistant</p>
                <p className="text-xs text-purple-700">GPT-4o · 8 actions</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Active</Badge>
            </div>
            <p className="text-xs text-purple-600">
              Open any project → click the AI button to generate summaries, reports & more
            </p>
          </div>
        </div>

        {/* Projects — clickable tiles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Your Projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="text-left"
              >
                <Card className="hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3 shrink-0">
                        <Badge className={STATUS_STYLES[project.status]}>{project.status}</Badge>
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users size={12} />{project.team.length} members</span>
                      <span className="flex items-center gap-1"><Clock size={12} />Due {formatDate(project.endDate)}</span>
                      <span className="flex items-center gap-1"><AlertTriangle size={12} />{project.risks.filter((r) => r.status === "open").length} risks</span>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>

        {/* 9-Step Workflow */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">How to Use Claude AI to Run Projects</h2>
            <p className="text-sm text-gray-500 mt-0.5">From context to execution.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className={`rounded-xl border p-4 ${step.color}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block text-white text-xs font-bold px-2 py-0.5 rounded-full ${step.labelColor}`}>{step.label}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">{step.title}</h3>
                      <ul className="space-y-0.5">
                        {step.bullets.map((b) => (
                          <li key={b} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />{b}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-gray-500 mt-2 italic">{step.note}</p>
                    </div>
                    <Icon size={20} className="text-gray-400 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 text-white text-center py-4 px-6">
            <p className="font-semibold text-sm">Stop using AI for answers. Start using it to run your projects.</p>
          </div>
        </section>
      </main>
    </>
  );
}
