"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeft, User, Calendar, Tag, AlertCircle } from "lucide-react";

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

function extractText(description: JiraIssue["fields"]["description"]): string {
  if (!description) return "";
  return (
    description.content
      ?.flatMap((block) => block.content ?? [])
      .map((inline) => inline.text ?? "")
      .join(" ") ?? ""
  );
}

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

  useEffect(() => {
    if (open) loadIssues();
  }, [open]);

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

  async function updateStatus(issue: JiraIssue, newStatus: string) {
    setUpdatingStatus(true);
    await fetch(`/api/jira/sync?jiraKey=${issue.key}&status=${newStatus}`);
    await loadIssues();
    if (selected?.key === issue.key) {
      setSelected((s) => s ? { ...s, fields: { ...s.fields, status: { ...s.fields.status, name: newStatus } } } : s);
    }
    setUpdatingStatus(false);
  }

  const title = selected ? `${selected.key} — ${selected.fields.summary}` : "JIRA Issues";
  const subtitle = selected ? selected.fields.status.name : `${issues.length} issues`;

  return (
    <Drawer open={open} onClose={() => { onClose(); setSelected(null); }} title={title} subtitle={subtitle} width="xl">
      <div className="p-6">
        {/* Issue detail view */}
        {selected ? (
          <div>
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4"
            >
              <ArrowLeft size={14} /> Back to all issues
            </button>

            <div className="space-y-6">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">STATUS</p>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOR[selected.fields.status.statusCategory.colorName] ?? "bg-gray-100 text-gray-700"}>
                        {selected.fields.status.name}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">PRIORITY</p>
                    <div className="flex items-center gap-2">
                      {selected.fields.priority && (
                        <>
                          <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_DOT[selected.fields.priority.name] ?? "bg-gray-300"}`} />
                          <span className="text-sm text-gray-700">{selected.fields.priority.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">TYPE</p>
                    <span className="text-sm text-gray-700">{selected.fields.issuetype.name}</span>
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
                      <span className="text-sm text-gray-700">
                        {selected.fields.duedate ?? "No due date"}
                      </span>
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

              {/* Description */}
              <div>
                <p className="text-xs text-gray-400 font-medium mb-2">DESCRIPTION</p>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed min-h-20">
                  {extractText(selected.fields.description) || <span className="text-gray-400 italic">No description</span>}
                </div>
              </div>

              {/* Update status */}
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
            </div>
          </div>
        ) : (
          /* Issues list */
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{issues.length} issues from your JIRA project</p>
              <Button variant="secondary" size="sm" onClick={loadIssues} disabled={loading}>
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </Button>
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
              {issues.map((issue) => (
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
                        <span className="text-xs text-gray-400">{issue.fields.issuetype.name}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                        {issue.fields.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-xs ${STATUS_COLOR[issue.fields.status.statusCategory.colorName] ?? "bg-gray-100 text-gray-700"}`}>
                          {issue.fields.status.name}
                        </Badge>
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

              {!loading && issues.length === 0 && !error && (
                <p className="text-center text-gray-400 text-sm py-12">No issues found in this JIRA project.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
