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
import { ContextTip } from "./context-tip";
import { useNotifications } from "@/contexts/notifications-context";
import {
  Users, AlertTriangle, TrendingUp, Target,
  CheckCircle2, ArrowRight, Sparkles, ChevronRight,
  RefreshCw, CheckCircle, XCircle, Zap, HelpCircle,
  Activity, Shield, BarChart3,
} from "lucide-react";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  planning: "bg-blue-50 text-blue-700 border-blue-200",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
};

const spring = { type: "spring" as const, stiffness: 400, damping: 28 };
const springFast = { type: "spring" as const, stiffness: 500, damping: 30 };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

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
  const { add: addNotif } = useNotifications();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [jiraOpen, setJiraOpen] = useState(false);
  const [confluenceOpen, setConfluenceOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { ok: boolean; error?: string }> | null>(null);
  const [showSyncResults, setShowSyncResults] = useState(false);
  const [contextMode, setContextMode] = useState(false);
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
      const results: Record<string, { ok: boolean; synced?: number; created?: number; updated?: number; pushed?: number; pulled?: number; failed?: number; error?: string }> = data.results ?? {};
      setSyncResults(results);
      if (!silent) setShowSyncResults(true);
      router.refresh();

      // Push notifications for each sync step
      const jiraIn = results.jiraToSupabase;
      const jiraOut = results.supabaseToJira;
      const confIn = results.confluenceToSupabase;
      const confOut = results.supabaseToConfluence;
      const confOverviews = results.confluenceProjectOverviews;

      if (jiraIn?.ok) {
        const count = (jiraIn.synced ?? 0) + (jiraIn.created ?? 0) + (jiraIn.updated ?? 0);
        if (count > 0) addNotif({ type: "jira", title: "JIRA issues synced", description: `${count} issue${count !== 1 ? "s" : ""} pulled from JIRA into your projects.`, href: "/" });
      }
      if (jiraIn && !jiraIn.ok) addNotif({ type: "jira", title: "JIRA sync failed", description: jiraIn.error ?? "Could not pull issues from JIRA.", href: "/settings" });

      if (jiraOut?.ok) {
        const count = (jiraOut.pushed ?? 0) + (jiraOut.created ?? 0);
        if (count > 0) addNotif({ type: "jira", title: "Tasks pushed to JIRA", description: `${count} task${count !== 1 ? "s" : ""} sent from your projects to JIRA.` });
      }

      if (confIn?.ok) {
        const count = (confIn.pulled ?? 0) + (confIn.synced ?? 0);
        if (count > 0) addNotif({ type: "confluence", title: "Confluence pages synced", description: `${count} page${count !== 1 ? "s" : ""} pulled from Confluence.`, href: "/" });
      }

      if (confOut?.ok) {
        const count = (confOut.pushed ?? 0) + (confOut.updated ?? 0);
        if (count > 0) addNotif({ type: "confluence", title: "Pages pushed to Confluence", description: `${count} workspace doc${count !== 1 ? "s" : ""} updated in Confluence.` });
      }

      if (confOverviews?.ok) {
        const count = (confOverviews.pushed ?? 0) + (confOverviews.updated ?? 0);
        if (count > 0) addNotif({ type: "confluence", title: "Project overviews updated", description: `${count} project overview page${count !== 1 ? "s" : ""} synced to Confluence.` });
      }

      // Always add a summary sync notification
      const anyFailed = Object.values(results).some((r) => !r.ok);
      addNotif({
        type: "sync",
        title: anyFailed ? "Sync completed with errors" : "Sync completed",
        description: anyFailed
          ? "Some integrations had errors. Check Settings to resolve."
          : "All integrations synced successfully.",
        href: anyFailed ? "/settings" : undefined,
      });
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, [router, addNotif]);

  useEffect(() => {
    const id = setInterval(() => runSync(true), SYNC_INTERVAL_MS);
    return () => clearInterval(id);
  }, [runSync]);

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      icon: Target,
      accent: "text-blue-600",
      bg: "bg-blue-50",
      bar: "from-blue-500 to-indigo-500",
      context: "Total number of projects you're managing across all statuses — active, planning, on-hold, and completed.",
    },
    {
      label: "Active Projects",
      value: activeCount,
      icon: TrendingUp,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
      bar: "from-emerald-500 to-teal-500",
      context: "Projects currently in progress. These are actively being worked on and tracked in JIRA.",
    },
    {
      label: "Open Tasks",
      value: openTasks,
      icon: CheckCircle2,
      accent: "text-violet-600",
      bg: "bg-violet-50",
      bar: "from-violet-500 to-purple-500",
      context: "Total tasks across all projects that haven't been marked as done yet. Synced live from JIRA.",
    },
    {
      label: "Open Risks",
      value: openRisks,
      icon: AlertTriangle,
      accent: "text-rose-600",
      bg: "bg-rose-50",
      bar: "from-rose-500 to-red-500",
      context: "Unresolved risks flagged across all projects. Click a project to view and manage each risk.",
    },
  ];

  return (
    <>
      <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
      <JiraDrawer open={jiraOpen} onClose={() => setJiraOpen(false)} />
      <ConfluenceDrawer open={confluenceOpen} onClose={() => setConfluenceOpen(false)} />
      <AiDrawer open={aiOpen} onClose={() => setAiOpen(false)} projects={projects} />

      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 md:p-8 space-y-6">

        {/* ── Enterprise Insights banner ── */}
        {(() => {
          const totalTasks = projects.flatMap((p) => p.tasks).length;
          const doneTasks = projects.flatMap((p) => p.tasks).filter((t) => t.status === "done").length;
          const avgProgress = projects.length
            ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
            : 0;
          const stalledCount = projects.filter((p) => p.status === "on-hold").length;
          const criticalRisks = projects.flatMap((p) => p.risks).filter((r) => r.level === "critical" && r.status === "open").length;

          const pills = [
            { icon: Activity,    label: "Portfolio health",  value: `${avgProgress}%`,                      color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
            { icon: TrendingUp,  label: "Active initiatives", value: `${activeCount} of ${projects.length}`, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            { icon: CheckCircle2,label: "Tasks closed",       value: `${doneTasks} / ${totalTasks}`,          color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100" },
            { icon: Shield,      label: "Critical risks",    value: criticalRisks > 0 ? `${criticalRisks} open` : "Clear", color: criticalRisks > 0 ? "text-rose-600" : "text-emerald-600", bg: criticalRisks > 0 ? "bg-rose-50" : "bg-emerald-50", border: criticalRisks > 0 ? "border-rose-100" : "border-emerald-100" },
            { icon: BarChart3,   label: "Stalled",           value: stalledCount > 0 ? `${stalledCount} on hold` : "None", color: stalledCount > 0 ? "text-amber-600" : "text-gray-400", bg: stalledCount > 0 ? "bg-amber-50" : "bg-gray-50", border: stalledCount > 0 ? "border-amber-100" : "border-gray-100" },
          ];

          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-violet-500 rounded-l-2xl" />

              <div className="pl-6 pr-5 py-5 flex flex-col md:flex-row md:items-center gap-5">
                {/* Left: label + tagline */}
                <div className="flex-1 min-w-0">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-2 mb-1.5"
                  >
                    <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      Enterprise Insights
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse" />
                    <span className="text-[10px] text-gray-400">Live</span>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-base font-bold text-gray-900 leading-snug"
                  >
                    Your view across every inflight initiative
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.24, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-xs text-gray-400 mt-0.5"
                  >
                    Track momentum, surface blockers, and drive decisions — across every function.
                  </motion.p>
                </div>

                {/* Right: portfolio pills */}
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap gap-2"
                >
                  {pills.map((pill, i) => {
                    const PillIcon = pill.icon;
                    return (
                      <motion.div
                        key={pill.label}
                        variants={fadeUp}
                        custom={i}
                        whileHover={{ y: -2, scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${pill.bg} ${pill.border} cursor-default`}
                      >
                        <PillIcon size={13} className={pill.color} />
                        <div>
                          <p className="text-[10px] text-gray-400 leading-none mb-0.5">{pill.label}</p>
                          <p className={`text-xs font-bold leading-none ${pill.color}`}>{pill.value}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Bottom progress bar — portfolio avg */}
              <div className="mx-6 mb-4">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Portfolio completion</span>
                  <span className="font-semibold text-gray-600">{avgProgress}%</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${avgProgress}%` }}
                    transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* ── Context mode toggle ── */}
        <div className="flex items-center justify-end">
          <motion.button
            onClick={() => setContextMode((v) => !v)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springFast}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${
              contextMode
                ? "bg-blue-600 text-white border-blue-600 shadow-[0_4px_12px_rgba(37,99,235,0.35)]"
                : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            <HelpCircle size={13} />
            {contextMode ? "Guide mode ON" : "Guide mode"}
          </motion.button>
        </div>

        {/* ── Stat cards ── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 16px 40px rgba(0,0,0,0.10)" }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <ContextTip text={s.context} enabled={contextMode}>
                  <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 cursor-default">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">{s.value}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                        <Icon size={18} className={s.accent} />
                      </div>
                    </div>
                    <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${s.bar}`} />
                  </div>
                </ContextTip>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Sync bar ── */}
        <ContextTip
          text="Auto-syncs your JIRA tasks, Confluence pages, and project data every 5 minutes. Click Sync All to force an immediate refresh."
          enabled={contextMode}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            className="flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow duration-200"
          >
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                jiraConnected && confluenceConnected
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]"
              }`} />
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
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync All"}
            </button>
          </motion.div>
        </ContextTip>

        {/* ── Sync results ── */}
        <AnimatePresence>
          {showSyncResults && syncResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-2 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Sync Results</p>
                <button onClick={() => setShowSyncResults(false)} className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">Dismiss</button>
              </div>
              {Object.entries(syncResults).map(([key, val]) => {
                const result = val as { ok: boolean; error?: string; synced?: number; created?: number; updated?: number; pushed?: number; pulled?: number; failed?: number; reconciled?: number };
                const labelMap: Record<string, string> = {
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
                    {result.ok
                      ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      : <XCircle size={13} className="text-red-400 shrink-0" />}
                    <span className="font-medium text-gray-700 w-52 shrink-0">{labelMap[key] ?? key}</span>
                    <span className={result.ok ? "text-gray-400" : "text-red-500"}>{detail}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Integration tiles ── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* JIRA */}
          <motion.div
            variants={fadeUp}
            custom={0}
            whileHover={{ y: -6, scale: 1.02, boxShadow: "0 16px 40px rgba(37,99,235,0.12)" }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            <ContextTip
              text="Opens your JIRA issue board — browse all stories, filter by status or label, view comments, and create new issues."
              enabled={contextMode}
            >
              <button
                onClick={() => { if (jiraConnected) { setJiraOpen(true); addNotif({ type: "jira", title: "Opened JIRA board", description: `Viewing issues for ${jiraKey ?? "your project"}.` }); } }}
                className={`w-full text-left rounded-2xl border p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-colors duration-150 ${
                  jiraConnected ? "border-gray-100 cursor-pointer" : "border-gray-100 opacity-60 cursor-default"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">J</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">JIRA</p>
                    <p className="text-xs text-gray-400 truncate">{jiraConnected ? `${jiraDomain} · ${jiraKey}` : "Not connected"}</p>
                  </div>
                  <Badge className={jiraConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-0"}>
                    {jiraConnected ? "Live" : "Setup"}
                  </Badge>
                </div>
                {jiraConnected
                  ? <p className="text-xs text-blue-600 flex items-center gap-1 font-medium">View issues <ChevronRight size={12} /></p>
                  : <Link href="/settings" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Configure →</Link>}
              </button>
            </ContextTip>
          </motion.div>

          {/* Confluence */}
          <motion.div
            variants={fadeUp}
            custom={1}
            whileHover={{ y: -6, scale: 1.02, boxShadow: "0 16px 40px rgba(14,165,233,0.12)" }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            <ContextTip
              text="Opens your Confluence workspace — view project pages, read and edit documentation, and browse space content."
              enabled={contextMode}
            >
              <button
                onClick={() => { if (confluenceConnected) { setConfluenceOpen(true); addNotif({ type: "confluence", title: "Opened Confluence", description: `Browsing pages for ${confluenceDomain ?? "your workspace"}.` }); } }}
                className={`w-full text-left rounded-2xl border p-5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-colors duration-150 ${
                  confluenceConnected ? "border-gray-100 cursor-pointer" : "border-gray-100 opacity-60 cursor-default"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">Confluence</p>
                    <p className="text-xs text-gray-400 truncate">{confluenceConnected ? confluenceDomain : "Not connected"}</p>
                  </div>
                  <Badge className={confluenceConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500 border-0"}>
                    {confluenceConnected ? "Live" : "Setup"}
                  </Badge>
                </div>
                {confluenceConnected
                  ? <p className="text-xs text-blue-600 flex items-center gap-1 font-medium">View pages <ChevronRight size={12} /></p>
                  : <Link href="/settings" className="text-xs text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>Configure →</Link>}
              </button>
            </ContextTip>
          </motion.div>

          {/* AI Assistant */}
          <motion.div
            variants={fadeUp}
            custom={2}
            whileHover={{ y: -6, scale: 1.02, boxShadow: "0 16px 40px rgba(139,92,246,0.14)" }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
          >
            <ContextTip
              text="AI-powered reports using Claude — generate executive summaries, risk reports, velocity analysis, standups, and more across all your projects."
              enabled={contextMode}
            >
              <button
                onClick={() => { setAiOpen(true); addNotif({ type: "ai", title: "AI Assistant opened", description: "Ready to generate reports, summaries, and analysis." }); }}
                className="w-full text-left rounded-2xl border border-purple-100 bg-gradient-to-br from-violet-50/60 via-white to-white p-5 shadow-[0_2px_8px_rgba(139,92,246,0.08)] cursor-pointer transition-colors duration-150"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-sm">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">AI Assistant</p>
                    <p className="text-xs text-violet-500">Claude · 8 actions</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                </div>
                <p className="text-xs text-violet-600 flex items-center gap-1 font-medium">Generate reports <ChevronRight size={12} /></p>
              </button>
            </ContextTip>
          </motion.div>

          {/* SharePoint */}
          <motion.div
            variants={fadeUp}
            custom={3}
            whileHover={{ y: -4, scale: 1.01, boxShadow: "0 12px 32px rgba(0,0,0,0.07)" }}
            whileTap={{ scale: 0.99 }}
            transition={spring}
          >
            <ContextTip
              text="Connect SharePoint to sync documents, files, and team wikis directly into your projects. Configure credentials in Settings."
              enabled={contextMode}
            >
              <div className="rounded-2xl border border-gray-100 bg-white p-5 opacity-70 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
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
                <a href="/settings" className="text-xs text-blue-600 hover:underline cursor-pointer">Configure →</a>
              </div>
            </ContextTip>
          </motion.div>
        </motion.div>

        {/* ── Projects ── */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.4 }}
            className="flex items-center justify-between mb-4"
          >
            <h2 className="text-base font-bold text-gray-900">Your Projects</h2>
            <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, scale: 1.015, boxShadow: "0 20px 48px rgba(0,0,0,0.10)" }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <ContextTip
                  text={`Open "${project.name}" — view tasks, risks, milestones, workspace docs, and the full project detail panel.`}
                  enabled={contextMode}
                >
                  <button onClick={() => { setSelectedProject(project); addNotif({ type: "project", title: `Opened: ${project.name}`, description: `${project.status} · ${project.progress}% complete · ${project.tasks.filter(t => t.status !== "done").length} open tasks` }); }} className="w-full text-left group cursor-pointer">
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5 h-full transition-colors duration-150">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-150">{project.name}</h3>
                          <p className="text-sm text-gray-400 mt-0.5 line-clamp-1">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`border text-xs ${STATUS_STYLES[project.status]}`}>{project.status}</Badge>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors duration-150" />
                        </div>
                      </div>

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
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.9, ease: "easeOut" }}
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
                </ContextTip>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Banner ── */}
        <ContextTip
          text="Jump to your Projects list to create a new project, manage epics, and track everything end-to-end with JIRA and Confluence."
          enabled={contextMode}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(37,99,235,0.22)" }}
            transition={{ delay: 0.55, duration: 0.45, ...spring }}
            className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white flex items-center justify-between shadow-lg cursor-default"
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
            <Link
              href="/projects"
              className="shrink-0 hidden md:flex items-center gap-2 bg-white text-blue-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
            >
              Open Projects <ArrowRight size={14} />
            </Link>
          </motion.div>
        </ContextTip>

      </main>
    </>
  );
}
