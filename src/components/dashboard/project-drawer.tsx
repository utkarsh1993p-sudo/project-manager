"use client";

import { useEffect, useState } from "react";
import type { Project, Stakeholder } from "@/types";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRiskColor } from "@/lib/utils";
import { useNotifications } from "@/contexts/notifications-context";
import {
  Target, Users, AlertTriangle, CheckCircle2, TrendingUp,
  Calendar, RefreshCw, Pencil, Check, X, Plus, Trash2,
  Mail, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  planning: "bg-blue-100 text-blue-700",
  "on-hold": "bg-yellow-100 text-yellow-700",
  completed: "bg-gray-100 text-gray-600",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  review: "bg-yellow-100 text-yellow-700",
  todo: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
};

const LEVEL_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const LEVELS = ["high", "medium", "low"] as const;

function fmt(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

// ── Editable date field ─────────────────────────────────────────────────────
function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() { onChange(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  return (
    <div className="flex items-center gap-1.5">
      <Calendar size={12} className="text-gray-400 shrink-0" />
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="text-xs border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={commit} className="text-emerald-600 hover:text-emerald-800 cursor-pointer"><Check size={13} /></button>
          <button onClick={cancel} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={13} /></button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors group cursor-pointer"
        >
          <span>{fmt(value) || `Set ${label}`}</span>
          <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}

// ── Stakeholder row ─────────────────────────────────────────────────────────
function StakeholderRow({
  s, projectId, onUpdate, onDelete,
}: {
  s: Stakeholder; projectId: string;
  onUpdate: (updated: Stakeholder) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Stakeholder>(s);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/stakeholders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stakeholderId: s.id, ...draft }),
      });
      if (res.ok) { onUpdate(draft); setExpanded(false); }
    } finally { setSaving(false); }
  }

  async function remove() {
    await fetch(`/api/projects/${projectId}/stakeholders`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stakeholderId: s.id }),
    });
    onDelete();
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {s.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
          <p className="text-xs text-gray-400 truncate">{s.role}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${LEVEL_COLORS[s.influence]}`}>
            I:{s.influence.charAt(0).toUpperCase()}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${LEVEL_COLORS[s.interest]}`}>
            Int:{s.interest.charAt(0).toUpperCase()}
          </span>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Role / Title</label>
              <input
                value={draft.role}
                onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Influence / Interest / Impact selectors */}
          {(["influence", "interest", "impact"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <div className="flex gap-1.5">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDraft((d) => ({ ...d, [field]: lvl }))}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      (draft[field] ?? "medium") === lvl
                        ? LEVEL_COLORS[lvl]
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
              Save
            </Button>
            <button
              onClick={remove}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 cursor-pointer transition-colors"
            >
              <Trash2 size={12} /> Remove
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer ml-auto"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add stakeholder form ────────────────────────────────────────────────────
function AddStakeholderForm({ projectId, onAdd, onCancel }: { projectId: string; onAdd: (s: Stakeholder) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: "", role: "", email: "", influence: "medium" as const, interest: "medium" as const });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!form.name.trim()) { setErr("Name is required"); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/projects/${projectId}/stakeholders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onAdd({ id: data.id, name: data.name, role: data.role ?? "", email: data.email ?? "", influence: data.influence, interest: data.interest });
      } else {
        setErr(data.error ?? "Failed to add");
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-3 space-y-2.5">
      <p className="text-xs font-semibold text-gray-700">Add Stakeholder</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
            className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Role / Title</label>
          <input
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="CTO"
            className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="col-span-2">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jane@company.com"
            className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>
      {(["influence", "interest"] as const).map((field) => (
        <div key={field}>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 block">
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </label>
          <div className="flex gap-1.5">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setForm((f) => ({ ...f, [field]: lvl }))}
                className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  form[field] === lvl
                    ? LEVEL_COLORS[lvl]
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={saving}>
          {saving ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
          Add
        </Button>
        <Button size="sm" variant="secondary" onClick={onCancel}><X size={12} /> Cancel</Button>
      </div>
    </div>
  );
}

// ── Main drawer ─────────────────────────────────────────────────────────────
interface ProjectDrawerProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDrawer({ project, onClose }: ProjectDrawerProps) {
  const { add: addNotif } = useNotifications();
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingDates, setSavingDates] = useState(false);
  const [datesSaved, setDatesSaved] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notifyStakeholders, setNotifyStakeholders] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [addingStakeholder, setAddingStakeholder] = useState(false);

  useEffect(() => {
    if (!project) { setData(null); return; }
    setLoading(true);
    setDatesSaved("idle");
    setNotifyStakeholders(false);
    setChangeReason("");
    setAddingStakeholder(false);
    fetch(`/api/projects/${project.id}`)
      .then((r) => r.json())
      .then((fresh) => {
        setData(fresh);
        setStartDate(fresh.startDate ?? "");
        setEndDate(fresh.endDate ?? "");
        setStakeholders(fresh.stakeholders ?? []);
      })
      .catch(() => {
        setData(project);
        setStartDate(project.startDate ?? "");
        setEndDate(project.endDate ?? "");
        setStakeholders(project.stakeholders ?? []);
      })
      .finally(() => setLoading(false));
  }, [project?.id]);

  const p = data ?? project;
  if (!p) return null;

  const doneTasks = p.tasks.filter((t) => t.status === "done").length;
  const openRisks = p.risks.filter((r) => r.status === "open").length;
  const nextMilestone = p.timeline.find((m) => m.status !== "completed");

  const datesChanged = startDate !== (p.startDate ?? "") || endDate !== (p.endDate ?? "");

  async function saveDates() {
    if (!p) return;
    setSavingDates(true);
    setDatesSaved("saving");
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          notifyStakeholders: notifyStakeholders && stakeholders.some((s) => s.email),
          changeReason: changeReason.trim() || undefined,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setDatesSaved("ok");
        setData((prev) => prev ? { ...prev, startDate, endDate } : prev);
        addNotif({
          type: "project",
          title: `Dates updated: ${p?.name ?? "Project"}`,
          description: `${fmt(startDate)} → ${fmt(endDate)}${result.results?.jira?.ok ? " · Synced to JIRA" : ""}${result.results?.notification?.sent ? ` · ${result.results.notification.sent} stakeholders notified` : ""}`,
        });
        if (notifyStakeholders) setNotifyStakeholders(false);
        setTimeout(() => setDatesSaved("idle"), 3000);
      } else {
        setDatesSaved("err");
      }
    } catch {
      setDatesSaved("err");
    } finally {
      setSavingDates(false);
    }
  }

  return (
    <Drawer open={!!project} onClose={onClose} title={p.name} subtitle={p.description} width="xl">
      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <RefreshCw size={18} className="animate-spin mr-2" /> Loading latest data...
        </div>
      ) : (
        <div className="p-4 md:p-6 space-y-5 h-full overflow-y-auto">

          {/* ── Status + editable dates ── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STATUS_STYLES[p.status]}>{p.status}</Badge>
              <span className="text-xs text-gray-400">·</span>
              <DateField label="Start" value={startDate} onChange={setStartDate} />
              <span className="text-gray-300 text-sm">→</span>
              <DateField label="End" value={endDate} onChange={setEndDate} />
            </div>

            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
              </div>
              <span className="text-sm font-semibold text-gray-700 shrink-0">{p.progress}%</span>
            </div>

            {/* Save dates controls */}
            {datesChanged && (
              <div className="space-y-2 pt-1 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify-toggle"
                    checked={notifyStakeholders}
                    onChange={(e) => setNotifyStakeholders(e.target.checked)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="notify-toggle" className="text-xs text-gray-600 cursor-pointer flex items-center gap-1">
                    <Mail size={11} /> Notify stakeholders by email
                  </label>
                </div>
                {notifyStakeholders && (
                  <textarea
                    value={changeReason}
                    onChange={(e) => setChangeReason(e.target.value)}
                    placeholder="Reason for timeline change (included in email)…"
                    rows={2}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={saveDates} disabled={savingDates}>
                    {savingDates ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                    Save dates
                  </Button>
                  {datesSaved === "ok" && <span className="text-xs text-emerald-600 flex items-center gap-1"><Check size={11} /> Saved & synced</span>}
                  {datesSaved === "err" && <span className="text-xs text-red-500">Save failed</span>}
                </div>
              </div>
            )}
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Tasks", value: p.tasks.length, icon: CheckCircle2, color: "text-blue-600 bg-blue-50" },
              { label: "Done", value: doneTasks, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
              { label: "Open Risks", value: openRisks, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
              { label: "Team", value: p.team.length, icon: Users, color: "text-purple-600 bg-purple-50" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-3 text-center">
                  <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mx-auto mb-1`}>
                    <Icon size={15} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* ── Goals ── */}
          {p.goals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Target size={14} className="text-blue-600" /> Goals
              </h3>
              <ul className="space-y-1.5">
                {p.goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Tasks + Risks ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-600" /> Recent Tasks
              </h3>
              <div className="space-y-1.5">
                {p.tasks.slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Badge className={`text-xs shrink-0 ${TASK_STATUS_COLORS[t.status]}`}>{t.status}</Badge>
                    <span className="text-xs text-gray-700 truncate">{t.title}</span>
                  </div>
                ))}
                {p.tasks.length === 0 && <p className="text-xs text-gray-400">No tasks yet</p>}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" /> Risks
              </h3>
              <div className="space-y-1.5">
                {p.risks.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <Badge className={`text-xs shrink-0 ${getRiskColor(r.level)}`}>{r.level}</Badge>
                    <span className="text-xs text-gray-700 truncate">{r.title}</span>
                  </div>
                ))}
                {p.risks.length === 0 && <p className="text-xs text-gray-400">No risks logged</p>}
              </div>
            </div>
          </div>

          {/* ── Next milestone ── */}
          {nextMilestone && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <Calendar size={16} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">Next Milestone</p>
                <p className="text-sm text-amber-700">{nextMilestone.title} — {fmt(nextMilestone.dueDate)}</p>
              </div>
            </div>
          )}

          {/* ── Team ── */}
          {p.team.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Users size={14} className="text-purple-600" /> Team
              </h3>
              <div className="flex flex-wrap gap-2">
                {p.team.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-xs text-gray-700">{m.name}</span>
                    <Badge className="text-xs bg-gray-100 text-gray-500">{m.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Stakeholders ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users size={14} className="text-indigo-600" /> Stakeholders
                {stakeholders.length > 0 && <span className="text-xs text-gray-400 font-normal">({stakeholders.length})</span>}
              </h3>
              {!addingStakeholder && (
                <button
                  onClick={() => setAddingStakeholder(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer transition-colors font-medium"
                >
                  <Plus size={13} /> Add
                </button>
              )}
            </div>

            <div className="space-y-2">
              {stakeholders.map((s) => (
                <StakeholderRow
                  key={s.id}
                  s={s}
                  projectId={p.id}
                  onUpdate={(updated) => setStakeholders((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                  onDelete={() => setStakeholders((prev) => prev.filter((x) => x.id !== s.id))}
                />
              ))}

              {stakeholders.length === 0 && !addingStakeholder && (
                <p className="text-xs text-gray-400 italic">No stakeholders added yet.</p>
              )}

              {addingStakeholder && (
                <AddStakeholderForm
                  projectId={p.id}
                  onAdd={(s) => { setStakeholders((prev) => [...prev, s]); setAddingStakeholder(false); }}
                  onCancel={() => setAddingStakeholder(false)}
                />
              )}
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="pt-2 border-t border-gray-100">
            <Link href={`/projects/${p.id}`}>
              <Button className="w-full">
                Open Full Project <TrendingUp size={14} />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
