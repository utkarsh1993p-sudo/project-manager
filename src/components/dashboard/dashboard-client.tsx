"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ProjectDrawer } from "./project-drawer";
import { JiraDrawer } from "./jira-drawer";
import { ConfluenceDrawer } from "./confluence-drawer";
import { AiDrawer } from "./ai-drawer";
import { formatDate } from "@/lib/utils";
import {
  Users, AlertTriangle, TrendingUp, Target,
  CheckCircle2, ArrowRight, Sparkles, ChevronRight,
  RefreshCw, CheckCircle, XCircle, Zap,
} from "lucide-react";


const SYNC_INTERVAL_MS = 5 * 60 * 1000;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  planning: "bg-blue-100 text-blue-700 border-blue-200",
  "on-hold": "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

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
  const [aiOpen, setAiOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { ok: boolean; error?: string }> | null>(null);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const syncingRef = useRef(false);

  const openTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status !== "done").length;
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
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => runSync(true), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [runSync]);

  const stats = [
    { label: "Total Projects", value: projects.length, icon: Target, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Active Projects", value: activeCount, icon: TrendingUp, gradient: "from-emerald-500 to-teal-600", bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Open Tasks", value: openTasks, icon: CheckCircle2, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-600" },
    { label: "Open Risks", value: openRisks, icon: AlertTriangle, gradient: "from-rose-500 to-red-600", bg: "bg-rose-50", text: "text-rose-600" },
  ];

  return (
    <>
      <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
      <JiraDrawer open={jiraOpen} onClose={() => setJiraOpen(false)} />
      <ConfluenceDrawer open={confluenceOpen} onClose={() => setConfluenceOpen(false)} />
      <AiDrawer open={aiOpen} onClose={() => setAiOpen(false)} projects={projects} />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-8 space-y-8">

        {/* ── Stat cards ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} variants={fadeUp} custom={i}>
                <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                      <Icon size={18} className={s.text} />
                    </div>
                  </div>
                  <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${s.gradient} opacity-60`} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Sync bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${jiraConnected && confluenceConnected ? "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.4)]" : "bg-amber-400"}`} />
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {jiraConnected && confluenceConnected ? "All integrations connected" : "Partial integrations"}
              </p>
              <p className="text-xs text-gray-400">
                {lastSyncedAt
                  ? `Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · Auto-syncs every 5 min`
                  : "Auto-syncs every 5 min · Click to sync now"}
              </p>
            </div>
          </div>
          <button
            onClick={() => runSync(false)}
            disabled={syncing}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync All"}
          </button>
        </motion.div>

        {/* ── Sync results ── */}
        <AnimatePresence>
          {showSyncResults && syncResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sync Results</p>
                <button onClick={() => setShowSyncResults(false)} className="text-xs text-gray-400 hover:text-gray-600">Dismiss</button>
              </div>
              {Object.entries(syncResults).map(([key, val]) => {
                const result = val as { ok: boolean; error?: string; synced?: number; created?: number; updated?: number; pushed?: number; pulled?: number; failed?: number; reconciled?: number };
                const label: Record<string, string> = {
                  jiraToSupabase: "JIRA → Supabase",
                  supabaseToJira: "Supabase → JIRA",
                  supabaseToConfluence: "Supabase → Confluence",
                  confluenceToSupabase: "Confluence → Supabase",
                  confluenceProjectOverviews: "Project Overviews → Confluence",
                };
                const detail = result.ok
                  ? [
                      result.synced != null && `${result.synced} synced`,
                      result.created != null && `${result.created} created`,
                      result.updated != null && `${result.updated} updated`,
                      result.pushed != null && `${result.pushed} pushed`,
                      result.pulled != null && `${result.pulled} pulled`,
                      result.reconciled != null && result.reconciled > 0 && `${result.reconciled} closed`,
                      result.failed != null && result.failed > 0 && `${result.failed} failed`,
                    ].filter(Boolean).join(" · ")
                  : result.error;
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    {result.ok ? <CheckCircle size={13} className="text-emerald-500 shrink-0" /> : <XCircle size={13} className="text-red-400 shrink-0" />}
                    <span className="font-medium text-gray-700 w-52 shrink-0">{label[key] ?? key}</span>
                    <span className={result.ok ? "text-gray-400" : "text-red-500"}>{detail}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Integrations ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* JIRA */}
          <motion.div variants={fadeUp} custom={0}>
            <button
              onClick={() => jiraConnected && setJiraOpen(true)}
              className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
                jiraConnected
                  ? "border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md hover:border-blue-200"
                  : "border-gray-100 bg-gray-50 cursor-default"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">JIRA</p>
                  <p className="text-xs text-gray-500 truncate">{jiraConnected ? `${jiraDomain} · ${jiraKey}` : "Not connected"}</p>
                </div>
                <Badge className={jiraConnected ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-500 border-0"}>
                  {jiraConnected ? "Live" : "Setup"}
                </Badge>
              </div>
              {jiraConnected
                ? <p className="text-xs text-blue-600 flex items-center gap-1 font-medium">View issues <ChevronRight size={12} /></p>
                : <Link href="/settings" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Configure →</Link>}
            </button>
          </motion.div>

          {/* Confluence */}
          <motion.div variants={fadeUp} custom={1}>
            <button
              onClick={() => confluenceConnected && setConfluenceOpen(true)}
              className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
                confluenceConnected
                  ? "border-blue-100 bg-gradient-to-br from-sky-50 to-blue-50 hover:shadow-md hover:border-blue-200"
                  : "border-gray-100 bg-gray-50 cursor-default"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">Confluence</p>
                  <p className="text-xs text-gray-500 truncate">{confluenceConnected ? confluenceDomain : "Not connected"}</p>
                </div>
                <Badge className={confluenceConnected ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-100 text-gray-500 border-0"}>
                  {confluenceConnected ? "Live" : "Setup"}
                </Badge>
              </div>
              {confluenceConnected
                ? <p className="text-xs text-blue-600 flex items-center gap-1 font-medium">View pages <ChevronRight size={12} /></p>
                : <Link href="/settings" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Configure →</Link>}
            </button>
          </motion.div>

          {/* AI Assistant */}
          <motion.div variants={fadeUp} custom={2}>
            <button
              onClick={() => setAiOpen(true)}
              className="w-full text-left rounded-2xl border border-purple-100 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 hover:shadow-md hover:border-purple-200 p-5 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">AI Assistant</p>
                  <p className="text-xs text-purple-500">Claude · 8 actions</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge>
              </div>
              <p className="text-xs text-violet-600 flex items-center gap-1 font-medium">Generate reports <ChevronRight size={12} /></p>
            </button>
          </motion.div>

          {/* SharePoint */}
          <motion.div variants={fadeUp} custom={3}>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">SharePoint</p>
                  <p className="text-xs text-gray-400">Not connected</p>
                </div>
                <Badge className="bg-gray-100 text-gray-500 border-0">Setup</Badge>
              </div>
              <a href="/settings" className="text-xs text-blue-600 hover:underline">Configure →</a>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Projects ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex items-center justify-between mb-4"
          >
            <h2 className="text-base font-bold text-gray-900">Your Projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {projects.map((project, i) => (
              <motion.div key={project.id} variants={fadeUp} custom={i}>
                <button onClick={() => setSelectedProject(project)} className="w-full text-left group">
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 p-5 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{project.name}</h3>
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`border text-xs ${STATUS_STYLES[project.status]}`}>{project.status}</Badge>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                        <span>Progress</span>
                        <span className="font-semibold text-gray-600">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Users size={11} />{project.team.length} members</span>
                      <span className="flex items-center gap-1"><CheckCircle2 size={11} />{project.tasks.filter(t => t.status !== "done").length} open tasks</span>
                      <span className="flex items-center gap-1"><AlertTriangle size={11} />{project.risks.filter(r => r.status === "open").length} risks</span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Quick actions banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg">Run projects with leverage</p>
              <p className="text-blue-100 text-sm">AI-powered planning, alignment, and execution — all in one place.</p>
            </div>
          </div>
          <Link href="/projects" className="shrink-0 hidden md:flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
            Open Projects <ArrowRight size={14} />
          </Link>
        </motion.div>

      </main>
    </>
  );
}
