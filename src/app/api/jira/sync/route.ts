import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeAtlassianDomain } from "@/lib/utils";

// POST /api/jira/sync — pull JIRA issues into a specific project, filtered by project_label
// Body: { projectId: string, projectLabel?: string }
export async function POST(req: NextRequest) {
  const { projectId, projectLabel } = await req.json();
  const supabase = await createClient();

  // Get JIRA credentials
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("type", "jira")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "JIRA not connected" }, { status: 400 });
  }

  // Resolve projectLabel from DB if not provided
  let label = projectLabel as string | undefined;
  if (!label) {
    const { data: proj } = await supabase
      .from("projects")
      .select("project_label")
      .eq("id", projectId)
      .single();
    label = proj?.project_label ?? undefined;
  }

  const auth = Buffer.from(`${integration.email}:${integration.api_token}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, Accept: "application/json" };

  // Build JQL — if a project label exists, scope to only issues with that label
  const labelFilter = label
    ? ` AND labels="${label.toLowerCase()}"`
    : "";
  const jql = `project=${integration.jira_project_key}${labelFilter} ORDER BY updated DESC`;

  // Fetch JIRA issues scoped to this project's label
  const res = await fetch(
    `https://${normalizeAtlassianDomain(integration.domain)}.atlassian.net/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,priority,assignee,duedate,labels,description,issuetype`,
    { headers }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch JIRA issues" }, { status: 502 });
  }

  const data = await res.json();
  const issues = data.issues ?? [];

  const statusMap: Record<string, string> = {
    "To Do": "todo",
    "In Progress": "in-progress",
    "In Review": "review",
    "Done": "done",
    "Blocked": "blocked",
  };

  const priorityMap: Record<string, string> = {
    Highest: "urgent",
    High: "high",
    Medium: "medium",
    Low: "low",
    Lowest: "low",
  };

  let created = 0;
  let updated = 0;

  for (const issue of issues) {
    const fields = issue.fields;
    const taskData = {
      project_id: projectId,
      title: `[${issue.key}] ${fields.summary}`,
      status: statusMap[fields.status?.name] ?? "todo",
      priority: priorityMap[fields.priority?.name] ?? "medium",
      assignee: fields.assignee?.displayName ?? "",
      due_date: fields.duedate ?? null,
      tags: ["jira", issue.key.toLowerCase(), ...(fields.labels ?? [])],
      jira_key: issue.key,
    };

    // Check if task with this jira_key already exists
    const { data: existing } = await supabase
      .from("tasks")
      .select("id")
      .eq("project_id", projectId)
      .eq("jira_key", issue.key)
      .single();

    if (existing) {
      await supabase.from("tasks").update(taskData).eq("id", existing.id);
      updated++;
    } else {
      await supabase.from("tasks").insert(taskData);
      created++;
    }
  }

  return NextResponse.json({
    ok: true,
    synced: issues.length,
    created,
    updated,
  });
}

// GET /api/jira/sync — push a single task status back to JIRA
export async function GET(req: NextRequest) {
  const jiraKey = req.nextUrl.searchParams.get("jiraKey");
  const status = req.nextUrl.searchParams.get("status");

  if (!jiraKey || !status) {
    return NextResponse.json({ error: "Missing jiraKey or status" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: integration } = await supabase
    .from("integrations")
    .select("*")
    .eq("type", "jira")
    .single();

  if (!integration) {
    return NextResponse.json({ error: "JIRA not connected" }, { status: 400 });
  }

  const auth = Buffer.from(`${integration.email}:${integration.api_token}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Get available transitions
  const transRes = await fetch(
    `https://${normalizeAtlassianDomain(integration.domain)}.atlassian.net/rest/api/3/issue/${jiraKey}/transitions`,
    { headers }
  );
  const transData = await transRes.json();
  const transitions: Array<{ id: string; name: string }> = transData.transitions ?? [];

  // Map app status → JIRA transition name
  const statusToTransition: Record<string, string[]> = {
    "todo": ["To Do", "Open", "Backlog"],
    "in-progress": ["In Progress", "Start Progress", "Start"],
    "review": ["In Review", "Review", "Code Review"],
    "done": ["Done", "Close", "Resolve", "Complete"],
    "blocked": ["Blocked", "On Hold"],
  };

  const targetNames = statusToTransition[status] ?? [];
  const transition = transitions.find((t) =>
    targetNames.some((n) => t.name.toLowerCase().includes(n.toLowerCase()))
  );

  if (!transition) {
    return NextResponse.json({ error: `No matching transition for status: ${status}` }, { status: 404 });
  }

  await fetch(
    `https://${normalizeAtlassianDomain(integration.domain)}.atlassian.net/rest/api/3/issue/${jiraKey}/transitions`,
    { method: "POST", headers, body: JSON.stringify({ transition: { id: transition.id } }) }
  );

  return NextResponse.json({ ok: true, transition: transition.name });
}
