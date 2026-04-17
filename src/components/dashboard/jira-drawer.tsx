"use client";

import { useEffect, useState, useMemo } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw, ArrowLeft, User, Calendar, Tag,
  AlertCircle, Plus, X, CheckCircle2, MessageSquare, ChevronDown,
} from "lucide-react";

interface JiraComment {
  id: string;
  author: { displayName: string; avatarUrls?: { "48x48": string } };
  body: { content?: Array<{ content?: Array<{ text?: string }> }> };
  created: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: { content?: Array<{ content?: Array<{ text?: string }> }> };
    status: { name: string; statusCategory: { colorName: string } };
    priority: { name: string } | null;
    assignee: { displayName: string; avatarUrls?: { "48x48": string } } | null;
    duedate: string | null;
    labels: string[];
    issuetype: { name: string };
  };
}

const STATUS_COLOR: Record<string, string> = {
  "blue-grey": "bg-gray-100 text-gray-700",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
};

const PRIORITY_DOT: Record<string, string> = {
  Highest: "bg-red-500",
  High: "bg-orange-400",
  Medium: "bg-yellow-400",
  Low: "bg-blue-400",
  Lowest: "bg-gray-300",
};

const ISSUE_TYPES = ["Task", "Story", "Bug", "Epic", "Subtask"];
const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"];

function extractText(
  doc: { content?: Array<{ content?: Array<{ text?: string }> }> } | undefined
): string {
  if (!doc) return "";
  return (
    doc.content
      ?.flatMap((block) => block.content ?? [])
      .map((inline) => inline.text ?? "")
      .join(" ") ?? ""
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return iso;
  }
}

interface CreateForm {
  summary: string;
  description: string;
  issueType: string;
  priority: string;
}

const DEFAULT_FORM: CreateForm = {
  summary: "",
  description: "",
  issueType: "Task",
  priority: "Medium",
};

interface JiraDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function JiraDrawer({ open, onClose }: JiraDrawerProps) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<JiraIssue | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Comments state
  const [comments, setComments] = useState<JiraComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [labelFilter, setLabelFilter] = useState<string>("all");

  // Create issue state
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadIssues();
  }, [open]);

  useEffect(() => {
    if (selected) loadComments(selected.key);
    else setComments([]);
  }, [selected]);

  async function loadIssues() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jira?resource=issues");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load");
        return;
      }
      const data = await res.json();
      setIssues(data.issues ?? []);
    } catch {
      setError("Could not reach JIRA. Configure in Settings.");
    } finally {
      setLoading(false);
    }
  }

  async function loadComments(issueKey: string) {
    setCommentsLoading(true);
    setComments([]);
    try {
      const res = await fetch(`/api/jira?resource=comments&issueKey=${issueKey}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } finally {
      setCommentsLoading(false);
    }
  }

  async function updateStatus(issue: JiraIssue, newStatus: string) {
    setUpdatingStatus(true);
    await fetch(`/api/jira/sync?jiraKey=${issue.key}&status=${newStatus}`);
    await loadIssues();
    if (selected?.key === issue.key) {
      setSelected((s) =>
        s ? { ...s, fields: { ...s.fields, status: { ...s.fields.status, name: newStatus } } } : s
      );
    }
    setUpdatingStatus(false);
  }

  async function createIssue() {
    if (!form.summary.trim()) { setCreateError("Summary is required."); return; }
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const res = await fetch("/api/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: form.summary.trim(),
          description: form.description.trim(),
          issueType: form.issueType,
          priority: form.priority,
        }),
      });
      const data = await res.json();
      if (data.key) {
        setCreateSuccess(`Created ${data.key} successfully!`);
        setForm(DEFAULT_FORM);
        setTimeout(() => { loadIssues(); setCreateSuccess(null); setCreating(false); }, 1500);
      } else {
        const msg = data.errors
          ? Object.values(data.errors).join(", ")
          : data.errorMessages?.[0] ?? "Failed to create issue.";
        setCreateError(msg);
      }
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  function update(field: keyof CreateForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Derived filter options from loaded issues
  const allStatuses = useMemo(() => {
    const seen = new Set<string>();
    issues.forEach((i) => seen.add(i.fields.status.name));
    return Array.from(seen).sort();
  }, [issues]);

  const allLabels = useMemo(() => {
    const seen = new Set<string>();
    issues.forEach((i) => i.fields.labels.forEach((l) => seen.add(l)));
    return Array.from(seen).sort();
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((i) => {
      if (statusFilter !== "all" && i.fields.status.name !== statusFilter) return false;
      if (labelFilter !== "all" && !i.fields.labels.includes(labelFilter)) return false;
      return true;
    });
  }, [issues, statusFilter, labelFilter]);

  const drawerTitle = selected
    ? `${selected.key} — ${selected.fields.summary}`
    : creating
    ? "Create JIRA Issue"
    : "JIRA Issues";

  const drawerSubtitle = selected
    ? selected.fields.status.name
    : creating
    ? "Add a new issue to your project"
    : `${filteredIssues.length} of ${issues.length} issues`;

  return (
    <Drawer
      open={open}
      onClose={() => { onClose(); setSelected(null); setCreating(false); setStatusFilter("all"); setLabelFilter("all"); }}
      title={drawerTitle}
      subtitle={drawerSubtitle}
      width="xl"
    >
      <div className="p-4 md:p-6 h-full overflow-y-auto">

        {/* ── Issue detail ── */}
        {selected ? (
          <div>
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4"
            >
              <ArrowLeft size={14} /> Back to all issues
            </button>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">STATUS</p>
                    <Badge className={STATUS_COLOR[selected.fields.status.statusCategory.colorName] ?? "bg-gray-100 text-gray-700"}>
                      {selected.fields.status.name}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">PRIORITY</p>
                    {selected.fields.priority && (
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[selected.fields.priority.name] ?? "bg-gray-300"}`} />
                        <span className="text-sm text-gray-700">{selected.fields.priority.name}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">TYPE</p>
                    <span className="text-sm text-gray-700">{selected.fields.issuetype?.name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">ASSIGNEE</p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                        <User size={12} className="text-blue-700" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {selected.fields.assignee?.displayName ?? "Unassigned"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">DUE DATE</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{selected.fields.duedate ?? "No due date"}</span>
                    </div>
                  </div>
                  {selected.fields.labels.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">LABELS</p>
                      <div className="flex flex-wrap gap-1">
                        {selected.fields.labels.map((l) => (
                          <span key={l} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            <Tag size={10} /> {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">DESCRIPTION</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed min-h-20">
                  {extractText(selected.fields.description) || (
                    <span className="text-gray-400 italic">No description</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">UPDATE STATUS</p>
                <div className="flex flex-wrap gap-2">
                  {["todo", "in-progress", "review", "done", "blocked"].map((s) => (
                    <Button
                      key={s}
                      variant="secondary"
                      size="sm"
                      disabled={updatingStatus}
                      onClick={() => updateStatus(selected, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* ── Comments ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={14} className="text-gray-400" />
                  <p className="text-xs text-gray-400 font-medium">COMMENTS</p>
                  {!commentsLoading && (
                    <span className="text-xs text-gray-400">({comments.length})</span>
                  )}
                </div>

                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                    <RefreshCw size={13} className="animate-spin" /> Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-400 italic bg-gray-50 rounded-xl p-4">No comments yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                              <User size={11} className="text-indigo-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {comment.author.displayName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{formatDate(comment.created)}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {extractText(comment.body) || <span className="italic text-gray-400">Empty comment</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        ) : creating ? (
          /* ── Create issue form ── */
          <div className="space-y-5">
            <button
              onClick={() => { setCreating(false); setCreateError(null); setCreateSuccess(null); setForm(DEFAULT_FORM); }}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft size={14} /> Back to issues
            </button>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Issue Type</label>
              <div className="flex flex-wrap gap-2">
                {ISSUE_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => update("issueType", t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.issueType === t
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Summary <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                placeholder="Add more details..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => update("priority", p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      form.priority === p
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[p]}`} />
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle size={15} />
                <p className="text-sm">{createError}</p>
              </div>
            )}

            {createSuccess && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                <CheckCircle2 size={15} />
                <p className="text-sm">{createSuccess}</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <Button onClick={createIssue} disabled={createLoading || !form.summary.trim()}>
                {createLoading ? "Creating..." : `Create ${form.issueType}`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setCreating(false); setForm(DEFAULT_FORM); setCreateError(null); }}
              >
                <X size={14} /> Cancel
              </Button>
            </div>
          </div>

        ) : (
          /* ── Issues list ── */
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{filteredIssues.length} of {issues.length} issues</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={loadIssues} disabled={loading}>
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button size="sm" onClick={() => { setCreating(true); setCreateError(null); setCreateSuccess(null); }}>
                  <Plus size={14} /> Create Issue
                </Button>
              </div>
            </div>

            {/* ── Filters ── */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  {allStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Label filter */}
              {allLabels.length > 0 && (
                <div className="relative">
                  <select
                    value={labelFilter}
                    onChange={(e) => setLabelFilter(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">All Labels</option>
                    {allLabels.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}

              {(statusFilter !== "all" || labelFilter !== "all") && (
                <button
                  onClick={() => { setStatusFilter("all"); setLabelFilter("all"); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <X size={11} /> Clear filters
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <AlertCircle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
              </div>
            )}

            <div className="space-y-2">
              {filteredIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => setSelected(issue)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {issue.fields.priority && (
                      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${PRIORITY_DOT[issue.fields.priority.name] ?? "bg-gray-300"}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-blue-600 shrink-0">{issue.key}</span>
                        <span className="text-xs text-gray-400">{issue.fields.issuetype?.name}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                        {issue.fields.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-xs ${STATUS_COLOR[issue.fields.status.statusCategory.colorName] ?? "bg-gray-100 text-gray-700"}`}>
                          {issue.fields.status.name}
                        </Badge>
                        {issue.fields.labels.length > 0 && (
                          <div className="flex gap-1">
                            {issue.fields.labels.slice(0, 2).map((l) => (
                              <span key={l} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                                {l}
                              </span>
                            ))}
                            {issue.fields.labels.length > 2 && (
                              <span className="text-xs text-gray-400">+{issue.fields.labels.length - 2}</span>
                            )}
                          </div>
                        )}
                        {issue.fields.assignee && (
                          <span className="text-xs text-gray-500">{issue.fields.assignee.displayName}</span>
                        )}
                        {issue.fields.duedate && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} /> {issue.fields.duedate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {!loading && filteredIssues.length === 0 && !error && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm mb-3">
                    {issues.length > 0 ? "No issues match the current filters." : "No issues found in this JIRA project."}
                  </p>
                  {issues.length === 0 && (
                    <Button size="sm" onClick={() => setCreating(true)}>
                      <Plus size={14} /> Create your first issue
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
