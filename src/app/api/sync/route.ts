import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── helpers ────────────────────────────────────────────────────────────────

async function getJiraAuth() {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("*").eq("type", "jira").single();
  if (!data) return null;
  const token = Buffer.from(`${data.email}:${data.api_token}`).toString("base64");
  const domain = data.domain.replace(/\.atlassian\.net\/?$/, "").trim();
  return {
    headers: { Authorization: `Basic ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    domain,
    projectKey: data.jira_project_key,
  };
}

async function getConfluenceAuth() {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("*").eq("type", "confluence").single();
  if (!data) return null;
  const token = Buffer.from(`${data.email}:${data.api_token}`).toString("base64");
  const domain = data.domain.replace(/\.atlassian\.net\/?$/, "").trim();
  return {
    headers: { Authorization: `Basic ${token}`, Accept: "application/json", "Content-Type": "application/json" },
    domain,
    spaceKey: data.confluence_space_key,
  };
}

function markdownToConfluenceHtml(markdown: string): string {
  return markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<)/gm, "<p>")
    .replace(/(?<!>)$/gm, "</p>")
    .replace(/<p><\/p>/g, "");
}

function buildProjectOverviewHtml(
  project: {
    name: string;
    status: string;
    progress: number;
    description?: string | null;
    owner?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    team_members: Array<{ name: string; role: string; email: string }>;
  },
  taskCounts: Record<string, number>
): string {
  const total = Object.values(taskCounts).reduce((a, b) => a + b, 0);
  const teamRows = project.team_members
    .map((m) => `<tr><td>${m.name}</td><td>${m.role}</td><td>${m.email}</td></tr>`)
    .join("") || "<tr><td colspan='3'>No team members</td></tr>";

  return `<h1>${project.name}</h1>
<table>
  <tr><th>Status</th><td>${project.status}</td></tr>
  <tr><th>Progress</th><td>${project.progress}%</td></tr>
  ${project.owner ? `<tr><th>Owner</th><td>${project.owner}</td></tr>` : ""}
  ${project.start_date ? `<tr><th>Start Date</th><td>${project.start_date}</td></tr>` : ""}
  ${project.end_date ? `<tr><th>End Date</th><td>${project.end_date}</td></tr>` : ""}
</table>
${project.description ? `<p>${project.description}</p>` : ""}
<h2>Team</h2>
<table>
  <tr><th>Name</th><th>Role</th><th>Email</th></tr>
  ${teamRows}
</table>
<h2>Tasks Summary</h2>
<table>
  <tr><th>Status</th><th>Count</th></tr>
  <tr><td>To Do</td><td>${taskCounts["todo"] ?? 0}</td></tr>
  <tr><td>In Progress</td><td>${taskCounts["in-progress"] ?? 0}</td></tr>
  <tr><td>In Review</td><td>${taskCounts["review"] ?? 0}</td></tr>
  <tr><td>Done</td><td>${taskCounts["done"] ?? 0}</td></tr>
  <tr><td>Blocked</td><td>${taskCounts["blocked"] ?? 0}</td></tr>
  <tr><th>Total</th><th>${total}</th></tr>
</table>
<p><em>Last synced: ${new Date().toISOString()}</em></p>`;
}

const JIRA_STATUS_MAP: Record<string, string> = {
  "To Do": "todo", "In Progress": "in-progress", "In Review": "review",
  "Done": "done", "Blocked": "blocked",
};
const JIRA_PRIORITY_MAP: Record<string, string> = {
  Highest: "urgent", High: "high", Medium: "medium", Low: "low", Lowest: "low",
};

// ─── POST /api/sync — run full bidirectional sync ────────────────────────────
// Body: { projectId?: string }  — if omitted, syncs all projects

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { projectId } = body as { projectId?: string };

  const supabase = await createClient();
  const results: Record<string, unknown> = {};

  // ── 1. JIRA → Supabase (pull issues into tasks) ──────────────────────────
  const jiraAuth = await getJiraAuth();
  if (jiraAuth) {
    try {
      const jiraRes = await fetch(
        `https://${jiraAuth.domain}.atlassian.net/rest/api/3/search/jql?jql=project=${jiraAuth.projectKey} ORDER BY updated DESC&maxResults=100&fields=summary,status,priority,assignee,duedate,labels`,
        { headers: jiraAuth.headers }
      );
      if (jiraRes.ok) {
        const jiraData = await jiraRes.json();
        const issues = jiraData.issues ?? [];
        let jiraCreated = 0, jiraUpdated = 0;

        // Get projects to map tasks to
        const projectQuery = projectId
          ? supabase.from("projects").select("id").eq("id", projectId)
          : supabase.from("projects").select("id");
        const { data: projects } = await projectQuery;

        for (const issue of issues) {
          const fields = issue.fields;
          const taskData = {
            title: `[${issue.key}] ${fields.summary}`,
            status: JIRA_STATUS_MAP[fields.status?.name] ?? "todo",
            priority: JIRA_PRIORITY_MAP[fields.priority?.name] ?? "medium",
            assignee: fields.assignee?.displayName ?? "",
            due_date: fields.duedate ?? null,
            tags: ["jira", issue.key.toLowerCase(), ...(fields.labels ?? [])],
            jira_key: issue.key,
          };

          // Find all tasks for this jira_key (may be duplicates from prior sync bugs)
          const { data: existingTasks } = await supabase
            .from("tasks").select("id, project_id").eq("jira_key", issue.key);

          const existing = existingTasks?.[0] ?? null;

          if (existing) {
            await supabase.from("tasks").update(taskData).eq("id", existing.id);
            // Delete duplicate rows for the same jira_key
            if (existingTasks && existingTasks.length > 1) {
              const dupeIds = existingTasks.slice(1).map((t) => t.id);
              await supabase.from("tasks").delete().in("id", dupeIds);
            }
            jiraUpdated++;
          } else if (projects && projects.length > 0) {
            const targetProjectId = projectId ?? projects[0].id;
            await supabase.from("tasks").insert({ ...taskData, project_id: targetProjectId });
            jiraCreated++;
          }
        }
        // Reconcile: mark tasks as "done" if their JIRA issue no longer exists
        const fetchedKeys = new Set(issues.map((i: { key: string }) => i.key));
        const reconcileQuery = projectId
          ? supabase.from("tasks").select("id, jira_key").eq("project_id", projectId).not("jira_key", "is", null)
          : supabase.from("tasks").select("id, jira_key").not("jira_key", "is", null);
        const { data: jiraTasks } = await reconcileQuery;
        let reconciled = 0;
        for (const task of jiraTasks ?? []) {
          if (task.jira_key && !fetchedKeys.has(task.jira_key)) {
            await supabase.from("tasks").update({ status: "done" }).eq("id", task.id);
            reconciled++;
          }
        }

        results.jiraToSupabase = { ok: true, synced: issues.length, created: jiraCreated, updated: jiraUpdated, reconciled };
      } else {
        const err = await jiraRes.json();
        results.jiraToSupabase = { ok: false, error: err.errorMessages?.[0] ?? `JIRA returned ${jiraRes.status}` };
      }
    } catch (e) {
      results.jiraToSupabase = { ok: false, error: String(e) };
    }

    // ── 2. Supabase tasks (no jira_key) → JIRA (create new issues) ──────────
    try {
      const taskQuery = projectId
        ? supabase.from("tasks").select("*, project:projects(name)").eq("project_id", projectId).is("jira_key", null)
        : supabase.from("tasks").select("*, project:projects(name)").is("jira_key", null);
      const { data: newTasks } = await taskQuery;

      const priorityMap: Record<string, string> = {
        urgent: "Highest", high: "High", medium: "Medium", low: "Low",
      };

      let pushed = 0;
      for (const task of newTasks ?? []) {
        const projectName = (task as unknown as { project?: { name?: string } }).project?.name ?? "";
        const projectLabel = projectName
          ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
          : null;

        const res = await fetch(
          `https://${jiraAuth.domain}.atlassian.net/rest/api/3/issue`,
          {
            method: "POST",
            headers: jiraAuth.headers,
            body: JSON.stringify({
              fields: {
                project: { key: jiraAuth.projectKey },
                summary: task.title,
                issuetype: { name: "Task" },
                priority: task.priority ? { name: priorityMap[task.priority] ?? "Medium" } : undefined,
                labels: projectLabel ? [projectLabel] : undefined,
              },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.key) {
            await supabase.from("tasks").update({
              jira_key: data.key,
              tags: [...(task.tags ?? []), "jira", data.key.toLowerCase()],
            }).eq("id", task.id);
            pushed++;
          }
        }
      }
      results.supabaseToJira = { ok: true, pushed };
    } catch (e) {
      results.supabaseToJira = { ok: false, error: String(e) };
    }
  } else {
    results.jiraToSupabase = { ok: false, error: "JIRA not connected" };
    results.supabaseToJira = { ok: false, error: "JIRA not connected" };
  }

  // ── 3. Supabase workspace_docs → Confluence (push updated docs) ──────────
  const confAuth = await getConfluenceAuth();
  if (confAuth) {
    try {
      const docsQuery = projectId
        ? supabase.from("workspace_docs").select("*").eq("project_id", projectId)
        : supabase.from("workspace_docs").select("*");
      const { data: docs } = await docsQuery;

      let confPushed = 0, confFailed = 0;
      const confBase = `https://${confAuth.domain}.atlassian.net/wiki/rest/api/content`;

      for (const doc of docs ?? []) {
        // Check if page exists
        const searchRes = await fetch(
          `${confBase}?spaceKey=${confAuth.spaceKey}&title=${encodeURIComponent(doc.title)}&expand=version`,
          { headers: confAuth.headers }
        );
        const searchData = await searchRes.json();
        const existing = searchData.results?.[0];

        const htmlContent = markdownToConfluenceHtml(doc.content ?? "");

        if (existing) {
          const r = await fetch(`${confBase}/${existing.id}`, {
            method: "PUT",
            headers: confAuth.headers,
            body: JSON.stringify({
              version: { number: existing.version.number + 1 },
              title: doc.title,
              type: "page",
              body: { storage: { value: htmlContent, representation: "storage" } },
            }),
          });
          r.ok ? confPushed++ : confFailed++;
        } else {
          const r = await fetch(confBase, {
            method: "POST",
            headers: confAuth.headers,
            body: JSON.stringify({
              type: "page",
              title: doc.title,
              space: { key: confAuth.spaceKey },
              body: { storage: { value: htmlContent, representation: "storage" } },
            }),
          });
          r.ok ? confPushed++ : confFailed++;
        }
      }
      results.supabaseToConfluence = { ok: true, pushed: confPushed, failed: confFailed };
    } catch (e) {
      results.supabaseToConfluence = { ok: false, error: String(e) };
    }

    // ── 3b. Push project overview pages to Confluence ──────────────────────
    try {
      const projectsQuery = projectId
        ? supabase.from("projects").select("*, team_members(*), tasks(status)").eq("id", projectId)
        : supabase.from("projects").select("*, team_members(*), tasks(status)");
      const { data: projects } = await projectsQuery;

      const confBase = `https://${confAuth.domain}.atlassian.net/wiki/rest/api/content`;
      let overviewPushed = 0, overviewFailed = 0;

      for (const project of projects ?? []) {
        const taskCounts: Record<string, number> = { todo: 0, "in-progress": 0, review: 0, done: 0, blocked: 0 };
        for (const t of (project.tasks as Array<{ status: string }>) ?? []) {
          if (t.status in taskCounts) taskCounts[t.status]++;
        }
        const pageTitle = `${project.name} - Project Overview`;
        const htmlContent = buildProjectOverviewHtml(project, taskCounts);

        const searchRes = await fetch(
          `${confBase}?spaceKey=${confAuth.spaceKey}&title=${encodeURIComponent(pageTitle)}&expand=version`,
          { headers: confAuth.headers }
        );
        const searchData = await searchRes.json();
        const existing = searchData.results?.[0];

        if (existing) {
          const r = await fetch(`${confBase}/${existing.id}`, {
            method: "PUT",
            headers: confAuth.headers,
            body: JSON.stringify({
              version: { number: existing.version.number + 1 },
              title: pageTitle,
              type: "page",
              body: { storage: { value: htmlContent, representation: "storage" } },
            }),
          });
          r.ok ? overviewPushed++ : overviewFailed++;
        } else {
          const r = await fetch(confBase, {
            method: "POST",
            headers: confAuth.headers,
            body: JSON.stringify({
              type: "page",
              title: pageTitle,
              space: { key: confAuth.spaceKey },
              body: { storage: { value: htmlContent, representation: "storage" } },
            }),
          });
          r.ok ? overviewPushed++ : overviewFailed++;
        }
      }
      results.confluenceProjectOverviews = { ok: true, pushed: overviewPushed, failed: overviewFailed };
    } catch (e) {
      results.confluenceProjectOverviews = { ok: false, error: String(e) };
    }

    // ── 4. Confluence → Supabase (pull pages back into workspace_docs) ──────
    try {
      const confBase = `https://${confAuth.domain}.atlassian.net/wiki/rest/api/content`;
      const pagesRes = await fetch(
        `${confBase}?spaceKey=${confAuth.spaceKey}&type=page&limit=50&expand=body.storage,version`,
        { headers: confAuth.headers }
      );

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        const pages = pagesData.results ?? [];
        let confPulled = 0;

        const docQuery = projectId
          ? supabase.from("workspace_docs").select("*").eq("project_id", projectId)
          : supabase.from("workspace_docs").select("*");
        const { data: existingDocs } = await docQuery;

        for (const page of pages) {
          const match = (existingDocs ?? []).find(
            (d: { title: string }) => d.title.toLowerCase() === page.title.toLowerCase()
          );
          const rawHtml = page.body?.storage?.value ?? "";
          // Strip HTML tags for plain text storage
          const plainText = rawHtml
            .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, "\n$1\n")
            .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
            .replace(/<[^>]+>/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          if (match) {
            await supabase.from("workspace_docs").update({
              content: plainText,
              last_updated: new Date().toISOString(),
            }).eq("id", match.id);
            confPulled++;
          }
        }
        results.confluenceToSupabase = { ok: true, pulled: confPulled, total: pages.length };
      } else {
        results.confluenceToSupabase = { ok: false, error: `Confluence returned ${pagesRes.status}` };
      }
    } catch (e) {
      results.confluenceToSupabase = { ok: false, error: String(e) };
    }
  } else {
    results.supabaseToConfluence = { ok: false, error: "Confluence not connected" };
    results.confluenceToSupabase = { ok: false, error: "Confluence not connected" };
  }

  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString(), results });
}

// GET /api/sync — lightweight status check (which integrations are connected)
export async function GET() {
  const supabase = await createClient();
  const { data: integrations } = await supabase
    .from("integrations")
    .select("type, domain, jira_project_key, confluence_space_key");

  const jira = integrations?.find((i) => i.type === "jira") ?? null;
  const confluence = integrations?.find((i) => i.type === "confluence") ?? null;

  return NextResponse.json({
    jira: jira ? { connected: true, domain: jira.domain, projectKey: jira.jira_project_key } : { connected: false },
    confluence: confluence
      ? { connected: true, domain: confluence.domain, spaceKey: confluence.confluence_space_key }
      : { connected: false },
  });
}
