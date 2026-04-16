import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// JIRA sends webhooks for issue created/updated/deleted events.
// Register this URL in JIRA: Project Settings → Webhooks → https://yourdomain.vercel.app/api/webhooks/jira

const STATUS_MAP: Record<string, string> = {
  "To Do": "todo", "In Progress": "in-progress", "In Review": "review",
  "Done": "done", "Blocked": "blocked",
};
const PRIORITY_MAP: Record<string, string> = {
  Highest: "urgent", High: "high", Medium: "medium", Low: "low", Lowest: "low",
};

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });

  const { webhookEvent, issue } = payload;
  if (!issue?.key) return NextResponse.json({ ok: true, skipped: "no issue key" });

  const supabase = await createClient();
  const fields = issue.fields ?? {};

  if (webhookEvent === "jira:issue_deleted") {
    // Remove the jira_key link but keep the task
    await supabase.from("tasks").update({ jira_key: null }).eq("jira_key", issue.key);
    return NextResponse.json({ ok: true, action: "unlinked", key: issue.key });
  }

  // jira:issue_created or jira:issue_updated
  const taskData = {
    title: `[${issue.key}] ${fields.summary}`,
    status: STATUS_MAP[fields.status?.name] ?? "todo",
    priority: PRIORITY_MAP[fields.priority?.name] ?? "medium",
    assignee: fields.assignee?.displayName ?? "",
    due_date: fields.duedate ?? null,
    tags: ["jira", issue.key.toLowerCase(), ...(fields.labels ?? [])],
    jira_key: issue.key,
  };

  // Check if we already have this task
  const { data: existing } = await supabase
    .from("tasks").select("id, project_id").eq("jira_key", issue.key).single();

  if (existing) {
    await supabase.from("tasks").update(taskData).eq("id", existing.id);
    return NextResponse.json({ ok: true, action: "updated", key: issue.key });
  }

  // New issue — insert into the first project we find
  const { data: projects } = await supabase.from("projects").select("id").limit(1);
  if (projects && projects.length > 0) {
    await supabase.from("tasks").insert({ ...taskData, project_id: projects[0].id });
    return NextResponse.json({ ok: true, action: "created", key: issue.key });
  }

  return NextResponse.json({ ok: true, skipped: "no project to assign to" });
}
