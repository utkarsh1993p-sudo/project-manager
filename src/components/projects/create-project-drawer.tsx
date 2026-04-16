"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, X, ChevronRight, ChevronLeft, Check,
  AlertCircle, ExternalLink, Sparkles, RefreshCw,
  Target, Calendar, User, FileText, Tag,
} from "lucide-react";
import { generateProjectLabel } from "@/lib/utils";

interface CreateProjectDrawerProps {
  open: boolean;
  onClose: () => void;
  jiraConnected: boolean;
  jiraProjectKey?: string;
  confluenceConnected: boolean;
  confluenceSpaceKey?: string;
}

const STEPS = ["Details", "Goals", "Integrations", "Review"] as const;
type Step = 0 | 1 | 2 | 3;

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "planning",
  startDate: "",
  endDate: "",
  owner: "",
  projectLabel: "",
};

export function CreateProjectDrawer({
  open,
  onClose,
  jiraConnected,
  jiraProjectKey = "",
  confluenceConnected,
  confluenceSpaceKey = "",
}: CreateProjectDrawerProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [goals, setGoals] = useState<string[]>([""]);
  const [createJiraEpic, setCreateJiraEpic] = useState(jiraConnected);
  const [jiraEpicName, setJiraEpicName] = useState("");
  const [createConfluencePage, setCreateConfluencePage] = useState(confluenceConnected);
  const [confluencePageTitle, setConfluencePageTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{
    project: { id: string; name: string };
    results: Record<string, { ok: boolean; error?: string; key?: string; url?: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateForm(k: string, v: string) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      // Auto-fill label and integration names from project name
      if (k === "name") {
        if (!prev.projectLabel || prev.projectLabel === generateProjectLabel(prev.name)) {
          next.projectLabel = generateProjectLabel(v);
        }
      }
      return next;
    });
    if (k === "name") {
      setJiraEpicName(v);
      setConfluencePageTitle(v);
    }
  }

  function addGoal() { setGoals((g) => [...g, ""]); }
  function removeGoal(i: number) { setGoals((g) => g.filter((_, idx) => idx !== i)); }
  function updateGoal(i: number, v: string) { setGoals((g) => g.map((val, idx) => idx === i ? v : val)); }

  function canProceed(): boolean {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return goals.some((g) => g.trim().length > 0);
    return true;
  }

  function resetAndClose() {
    setStep(0);
    setForm(EMPTY_FORM);
    setGoals([""]);
    setCreateJiraEpic(jiraConnected);
    setCreateConfluencePage(confluenceConnected);
    setJiraEpicName("");
    setConfluencePageTitle("");
    setResult(null);
    setError(null);
    onClose();
  }

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const cleanGoals = goals.filter((g) => g.trim().length > 0);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          projectLabel: form.projectLabel || generateProjectLabel(form.name),
          goals: cleanGoals,
          createJiraEpic,
          jiraProjectKey,
          jiraEpicName: jiraEpicName || form.name,
          createConfluencePage,
          confluenceSpaceKey,
          confluencePageTitle: confluencePageTitle || form.name,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to create project.");
      } else {
        setResult(data);
        setStep(3);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  const stepTitle = result
    ? "Project Created!"
    : STEPS[step];

  const stepSubtitle = [
    "Fill in the core project details",
    "What are you trying to achieve?",
    "Automatically set up in your tools",
    "Confirm and create your project",
  ][step];

  return (
    <Drawer open={open} onClose={resetAndClose} title={`New Project · ${stepTitle}`} subtitle={result ? "All done — your project is live" : stepSubtitle} width="lg">
      <div className="flex flex-col h-full overflow-y-auto">

        {/* Step indicator */}
        {!result && (
          <div className="flex items-center gap-1.5 px-6 pt-4 pb-2 shrink-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i < step ? "bg-emerald-500 text-white" :
                  i === step ? "bg-blue-600 text-white" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i < step ? <Check size={11} /> : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? "text-gray-800" : "text-gray-400"}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-6 py-4 space-y-4">

          {/* ── Step 0: Details ── */}
          {step === 0 && !result && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Q2 Product Launch"
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <Tag size={11} className="inline mr-1" />Project Label
                    <span className="ml-1 text-gray-400 font-normal">(used as JIRA label)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PLQ2"
                    value={form.projectLabel}
                    onChange={(e) => updateForm("projectLabel", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-suggested · max 8 chars</p>
                </div>
                <div className="col-span-1 flex flex-col justify-start">
                  <div className="mt-0.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                    <p className="text-xs font-semibold text-blue-700">Why this matters</p>
                    <p className="text-xs text-blue-600 leading-snug">JIRA issues tagged <code className="bg-blue-100 px-1 rounded">{form.projectLabel || "…"}</code> will sync to this project only</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  placeholder="What is this project about?"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <User size={11} className="inline mr-1" />Owner
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.owner}
                    onChange={(e) => updateForm("owner", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <Calendar size={11} className="inline mr-1" />Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => updateForm("startDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    <Calendar size={11} className="inline mr-1" />End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => updateForm("endDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Goals ── */}
          {step === 1 && !result && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Add the key goals for this project. These appear in Confluence docs and JIRA descriptions.</p>
              {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <input
                    type="text"
                    autoFocus={i === goals.length - 1}
                    placeholder={`Goal ${i + 1}...`}
                    value={g}
                    onChange={(e) => updateGoal(i, e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGoal(); } }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {goals.length > 1 && (
                    <button onClick={() => removeGoal(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addGoal}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Plus size={14} /> Add goal
              </button>
            </div>
          )}

          {/* ── Step 2: Integrations ── */}
          {step === 2 && !result && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">Choose what to create automatically when this project is saved.</p>

              {/* JIRA */}
              <div className={`rounded-xl border p-4 transition-all ${createJiraEpic ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">J</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Create JIRA Epic</p>
                      <p className="text-xs text-gray-500">{jiraConnected ? `Project: ${jiraProjectKey}` : "JIRA not connected"}</p>
                    </div>
                  </div>
                  <button
                    disabled={!jiraConnected}
                    onClick={() => setCreateJiraEpic((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${createJiraEpic && jiraConnected ? "bg-blue-600" : "bg-gray-200"} ${!jiraConnected ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${createJiraEpic && jiraConnected ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {createJiraEpic && jiraConnected && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Epic Name</label>
                    <input
                      type="text"
                      value={jiraEpicName}
                      onChange={(e) => setJiraEpicName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {!jiraConnected && (
                  <a href="/settings" className="text-xs text-blue-600 hover:underline">Connect JIRA in Settings →</a>
                )}
              </div>

              {/* Confluence */}
              <div className={`rounded-xl border p-4 transition-all ${createConfluencePage ? "border-sky-200 bg-sky-50" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                      <FileText size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Create Confluence Page</p>
                      <p className="text-xs text-gray-500">{confluenceConnected ? `Space: ${confluenceSpaceKey}` : "Confluence not connected"}</p>
                    </div>
                  </div>
                  <button
                    disabled={!confluenceConnected}
                    onClick={() => setCreateConfluencePage((v) => !v)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${createConfluencePage && confluenceConnected ? "bg-sky-500" : "bg-gray-200"} ${!confluenceConnected ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${createConfluencePage && confluenceConnected ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                {createConfluencePage && confluenceConnected && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Page Title</label>
                    <input
                      type="text"
                      value={confluencePageTitle}
                      onChange={(e) => setConfluencePageTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                )}
                {!confluenceConnected && (
                  <a href="/settings" className="text-xs text-blue-600 hover:underline">Connect Confluence in Settings →</a>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && !result && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{form.name}</p>
                {form.description && <p className="text-xs text-gray-500">{form.description}</p>}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{form.status}</Badge>
                  <Badge className="bg-violet-100 text-violet-700 border-0 text-xs font-mono">{form.projectLabel || generateProjectLabel(form.name)}</Badge>
                  {form.owner && <span className="text-xs text-gray-500">Owner: {form.owner}</span>}
                  {form.startDate && <span className="text-xs text-gray-500">{form.startDate} → {form.endDate || "TBD"}</span>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Goals ({goals.filter(g => g.trim()).length})</p>
                <ul className="space-y-1">
                  {goals.filter(g => g.trim()).map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Integration Actions</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${createJiraEpic && jiraConnected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                    {createJiraEpic && jiraConnected ? <Check size={9} /> : <X size={9} />}
                  </span>
                  <span className={createJiraEpic && jiraConnected ? "text-gray-700" : "text-gray-400"}>
                    Create JIRA Epic: &quot;{jiraEpicName || form.name}&quot;
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${createConfluencePage && confluenceConnected ? "bg-sky-100 text-sky-600" : "bg-gray-100 text-gray-400"}`}>
                    {createConfluencePage && confluenceConnected ? <Check size={9} /> : <X size={9} />}
                  </span>
                  <span className={createConfluencePage && confluenceConnected ? "text-gray-700" : "text-gray-400"}>
                    Create Confluence Page: &quot;{confluencePageTitle || form.name}&quot;
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── Success ── */}
          {result && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Check size={26} className="text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">{result.project.name}</p>
                  <p className="text-sm text-gray-500 mt-1">Project created successfully</p>
                </div>
              </div>

              <div className="space-y-2">
                {/* Supabase */}
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-800">Saved to Supabase</p>
                    <p className="text-xs text-emerald-600">Project ID: {result.project.id.slice(0, 8)}…</p>
                  </div>
                  <a href={`/projects/${result.project.id}`} className="text-xs text-emerald-700 font-medium hover:underline flex items-center gap-1">
                    Open <ExternalLink size={10} />
                  </a>
                </div>

                {/* JIRA */}
                {result.results.jira && (
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${result.results.jira.ok ? "border-blue-100 bg-blue-50" : "border-red-100 bg-red-50"}`}>
                    {result.results.jira.ok ? <Check size={14} className="text-blue-600 shrink-0" /> : <AlertCircle size={14} className="text-red-500 shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${result.results.jira.ok ? "text-blue-800" : "text-red-700"}`}>
                        {result.results.jira.ok ? `JIRA Epic: ${result.results.jira.key}` : "JIRA Epic failed"}
                      </p>
                      {!result.results.jira.ok && <p className="text-xs text-red-600">{result.results.jira.error}</p>}
                    </div>
                    {result.results.jira.ok && result.results.jira.url && (
                      <a href={result.results.jira.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 font-medium hover:underline flex items-center gap-1">
                        Open <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}

                {/* Confluence */}
                {result.results.confluence && (
                  <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${result.results.confluence.ok ? "border-sky-100 bg-sky-50" : "border-red-100 bg-red-50"}`}>
                    {result.results.confluence.ok ? <Sparkles size={14} className="text-sky-500 shrink-0" /> : <AlertCircle size={14} className="text-red-500 shrink-0" />}
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${result.results.confluence.ok ? "text-sky-800" : "text-red-700"}`}>
                        {result.results.confluence.ok ? "Confluence page created" : "Confluence failed"}
                      </p>
                      {!result.results.confluence.ok && <p className="text-xs text-red-600">{result.results.confluence.error}</p>}
                    </div>
                    {result.results.confluence.ok && result.results.confluence.url && (
                      <a href={result.results.confluence.url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-700 font-medium hover:underline flex items-center gap-1">
                        Open <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="shrink-0 px-6 pb-6 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          {result ? (
            <>
              <Button variant="secondary" onClick={resetAndClose}>Close</Button>
              <Button onClick={() => { router.push(`/projects/${result.project.id}`); resetAndClose(); }}>
                Open Project <ChevronRight size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={() => step === 0 ? resetAndClose() : setStep((s) => (s - 1) as Step)}
              >
                {step === 0 ? "Cancel" : <><ChevronLeft size={14} /> Back</>}
              </Button>
              {step < 3 ? (
                <Button disabled={!canProceed()} onClick={() => setStep((s) => (s + 1) as Step)}>
                  Next <ChevronRight size={14} />
                </Button>
              ) : (
                <Button disabled={creating} onClick={create}>
                  {creating ? <><RefreshCw size={13} className="animate-spin" /> Creating…</> : <>Create Project <Check size={14} /></>}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}
