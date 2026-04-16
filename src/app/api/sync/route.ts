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

          // Check if task already exists across all projects
          const { data: existing } = await supabase
            .from("tasks").select("id, project_id").eq("jira_key", issue.key).single();

          if (existing) {
            await supabase.from("tasks").update(taskData).eq("id", existing.id);
            jiraUpdated++;
          } else if (projects && projects.length > 0) {
            // Insert into first project (or specified project)
            const targetProjectId = projectId ?? projects[0].id;
            await supabase.from("tasks").insert({ ...taskData, project_id: targetProjectId });
            jiraCreated++;
          }
        }
        results.jiraToSupabase = { ok: true, synced: issues.length, created: jiraCreated, updated: jiraUpdated };
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
        ? supabase.from("tasks").select("*").eq("project_id", projectId).is("jira_key", null)
        : supabase.from("tasks").select("*").is("jira_key", null);
      const { data: newTasks } = await taskQuery;

      const priorityMap: Record<string, string> = {
        urgent: "Highest", high: "High", medium: "Medium", low: "Low",
      };

      let pushed = 0;
      for (const task of newTasks ?? []) {
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
