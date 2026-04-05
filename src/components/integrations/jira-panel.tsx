"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";
import {
  RefreshCw,
  ExternalLink,
  Download,
  Upload,
  AlertCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { colorName: string } };
    priority: { name: string } | null;
    assignee: { displayName: string } | null;
    duedate: string | null;
    labels: string[];
  };
}

const JIRA_STATUS_COLOR: Record<string, string> = {
  "blue-grey": "bg-gray-100 text-gray-700",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
  "red": "bg-red-100 text-red-700",
};

const PRIORITY_COLOR: Record<string, string> = {
  Highest: "text-red-600",
  High: "text-orange-500",
  Medium: "text-yellow-500",
  Low: "text-blue-400",
  Lowest: "text-gray-400",
};

interface JiraPanelProps {
  projectId: string;
  tasks: Task[];
}

export function JiraPanel({ projectId, tasks }: JiraPanelProps) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushing, setPushing] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function syncToDatabase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jira/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`Synced ${data.synced} issues (${data.created} new, ${data.updated} updated)`);
        loadIssues();
      }
    } catch {
      setError("Sync failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadIssues() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jira?resource=issues");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load JIRA issues");
        return;
      }
      const data = await res.json();
      setIssues(data.issues ?? []);
    } catch {
      setError("Could not reach JIRA. Check your connection in Settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIssues(); }, []);

  async function pushTaskToJira(task: Task) {
    setPushing(task.id);
    setMessage(null);
    try {
      const priorityMap: Record<string, string> = {
        urgent: "Highest",
        high: "High",
        medium: "Medium",
        low: "Low",
      };
      const res = await fetch("/api/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: task.title,
          description: task.description ?? "",
          priority: priorityMap[task.priority] ?? "Medium",
        }),
      });
      const data = await res.json();
      if (data.key) {
        setMessage(`Created JIRA issue ${data.key}`);
        loadIssues();
      } else {
        setMessage("Failed to create issue in JIRA");
      }
    } catch {
      setMessage("Error pushing to JIRA");
    } finally {
      setPushing(null);
    }
  }

  async function importIssue(issue: JiraIssue) {
    setImporting(issue.id);
    setMessage(null);
    try {
      const statusMap: Record<string, string> = {
        "To Do": "todo",
        "In Progress": "in-progress",
        "In Review": "review",
        Done: "done",
        Blocked: "blocked",
      };
      const priorityMap: Record<string, string> = {
        Highest: "urgent",
        High: "high",
        Medium: "medium",
        Low: "low",
        Lowest: "low",
      };
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: `[${issue.key}] ${issue.fields.summary}`,
          status: statusMap[issue.fields.status.name] ?? "todo",
          priority: priorityMap[issue.fields.priority?.name ?? "Medium"] ?? "medium",
          assignee: issue.fields.assignee?.displayName ?? "",
          dueDate: issue.fields.duedate ?? "",
          tags: ["jira", issue.key.toLowerCase()],
        }),
      });
      setMessage(`Imported ${issue.key} as a task`);
    } catch {
      setMessage("Error importing issue");
    } finally {
      setImporting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        <RefreshCw size={16} className="animate-spin mr-2" /> Loading JIRA issues...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={18} />
          <p className="text-sm">{error}</p>
        </div>
        <Link href="/settings">
          <Button variant="secondary" size="sm">
            <Settings size={14} /> Configure in Settings
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">JIRA Issues</h3>
          <p className="text-xs text-gray-500">{issues.length} issues from your JIRA project</p>
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <p className="text-xs text-green-600">{message}</p>
          )}
          <Button variant="secondary" size="sm" onClick={loadIssues}>
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={syncToDatabase}>
            <Download size={14} /> Sync to DB
          </Button>
        </div>
      </div>

      {/* Push tasks to JIRA */}
      <Card>
        <CardContent className="py-4">
          <p className="text-xs font-medium text-gray-700 mb-3">
            Push tasks to JIRA
          </p>
          <div className="space-y-2">
            {tasks.filter((t) => t.status !== "done").map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <p className="text-sm text-gray-700 truncate flex-1">{task.title}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pushing === task.id}
                  onClick={() => pushTaskToJira(task)}
                >
                  <Upload size={12} />
                  {pushing === task.id ? "Pushing..." : "Push"}
                </Button>
              </div>
            ))}
            {tasks.filter((t) => t.status !== "done").length === 0 && (
              <p className="text-xs text-gray-400">All tasks are done.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* JIRA issues list */}
      <div className="space-y-2">
        {issues.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No issues found in this JIRA project.
          </p>
        )}
        {issues.map((issue) => (
          <Card key={issue.id}>
            <CardContent className="py-3">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-blue-600 shrink-0 mt-0.5">
                  {issue.key}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {issue.fields.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge
                      className={
                        JIRA_STATUS_COLOR[
                          issue.fields.status.statusCategory.colorName
                        ] ?? "bg-gray-100 text-gray-700"
                      }
                    >
                      {issue.fields.status.name}
                    </Badge>
                    {issue.fields.priority && (
                      <span
                        className={`text-xs font-medium ${PRIORITY_COLOR[issue.fields.priority.name] ?? "text-gray-500"}`}
                      >
                        {issue.fields.priority.name}
                      </span>
                    )}
                    {issue.fields.assignee && (
                      <span className="text-xs text-gray-500">
                        {issue.fields.assignee.displayName}
                      </span>
                    )}
                    {issue.fields.labels.map((l) => (
                      <span
                        key={l}
                        className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={importing === issue.id}
                    onClick={() => importIssue(issue)}
                  >
                    <Download size={12} />
                    {importing === issue.id ? "..." : "Import"}
                  </Button>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-gray-600"
                    title="Open in JIRA"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
