import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeAtlassianDomain } from "@/lib/utils";
import { revalidatePath } from "next/cache";

async function getAtlassianAuth(type: "jira" | "confluence") {
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("*").eq("type", type).single();
  if (!data) return null;
  const domain = normalizeAtlassianDomain(data.domain);
  const token = Buffer.from(`${data.email}:${data.api_token}`).toString("base64");
  return { domain, token, headers: { Authorization: `Basic ${token}`, "Content-Type": "application/json", Accept: "application/json" }, data };
}

function buildConfluenceHtml(name: string, description: string, goals: string[]): string {
  const goalList = goals.map((g) => `<li>${g}</li>`).join("");
  return `<h1>${name}</h1><h2>Overview</h2><p>${description}</p><h2>Goals</h2><ul>${goalList}</ul><h2>Status</h2><p>This project was just created. Update this page as the project progresses.</p>`;
}

// GET /api/projects/:id is in [id]/route.ts
// POST /api/projects — create project + optional JIRA epic + Confluence page
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    name, description, status, startDate, endDate, owner, goals,
    createJiraEpic, jiraProjectKey, jiraEpicName,
    createConfluencePage, confluenceSpaceKey, confluencePageTitle,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const results: Record<string, unknown> = {};

  // ── 1. Create in Supabase ──────────────────────────────────────────────────
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: name.trim(),
      description: description?.trim() ?? "",
      status: status ?? "planning",
      start_date: startDate || null,
      end_date: endDate || null,
      owner: owner?.trim() ?? "",
      goals: goals ?? [],
      progress: 0,
    })
    .select()
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: projectError?.message ?? "Failed to create project" }, { status: 500 });
  }

  // Create default workspace docs
  await supabase.from("workspace_docs").insert([
    { project_id: project.id, type: "project-overview", title: "Project Overview", content: `# ${name} — Project Overview\n\n## Objective\n${description}\n\n## Goals\n${(goals as string[]).map((g: string) => `- ${g}`).join("\n")}` },
    { project_id: project.id, type: "stakeholder-map", title: "Stakeholder Map", content: "# Stakeholder Map\n\nAdd your stakeholders here." },
    { project_id: project.id, type: "risk-log", title: "Risk Log", content: "# Risk Log\n\nNo risks identified yet." },
    { project_id: project.id, type: "action-plan", title: "Action Plan", content: "# Action Plan\n\nAdd your actions here." },
  ]);

  results.supabase = { ok: true, projectId: project.id };

  // ── 2. Create JIRA Epic ────────────────────────────────────────────────────
  if (createJiraEpic) {
    try {
      const auth = await getAtlassianAuth("jira");
      if (!auth) {
        results.jira = { ok: false, error: "JIRA not connected" };
      } else {
        const projectKey = jiraProjectKey || auth.data.jira_project_key;
        // Get issue types to find Epic
        const typesRes = await fetch(
          `https://${auth.domain}.atlassian.net/rest/api/3/issuetype`,
          { headers: auth.headers }
        );
        const types = await typesRes.json();
        const epicType = Array.isArray(types) ? types.find((t: { name: string }) => t.name === "Epic") : null;

        const issueBody = {
          fields: {
            project: { key: projectKey },
            summary: jiraEpicName || name,
            issuetype: { name: epicType ? "Epic" : "Task" },
            description: {
              type: "doc", version: 1,
              content: [{ type: "paragraph", content: [{ type: "text", text: description || name }] }],
            },
            ...(epicType ? { customfield_10011: jiraEpicName || name } : {}),
          },
        };

        const jiraRes = await fetch(
          `https://${auth.domain}.atlassian.net/rest/api/3/issue`,
          { method: "POST", headers: auth.headers, body: JSON.stringify(issueBody) }
        );
        const jiraData = await jiraRes.json();

        if (jiraRes.ok && jiraData.key) {
          // Store JIRA key on a placeholder task or just return it
          results.jira = { ok: true, key: jiraData.key, url: `https://${auth.domain}.atlassian.net/browse/${jiraData.key}` };
        } else {
          results.jira = { ok: false, error: jiraData.errors ? JSON.stringify(jiraData.errors) : "Failed to create epic" };
        }
      }
    } catch (err: unknown) {
      results.jira = { ok: false, error: err instanceof Error ? err.message : "JIRA error" };
    }
  }

  // ── 3. Create Confluence Page ──────────────────────────────────────────────
  if (createConfluencePage) {
    try {
      const auth = await getAtlassianAuth("confluence");
      if (!auth) {
        results.confluence = { ok: false, error: "Confluence not connected" };
      } else {
        const spaceKey = confluenceSpaceKey || auth.data.confluence_space_key;
        const pageTitle = confluencePageTitle || name;
        const html = buildConfluenceHtml(name, description || "", goals || []);

        const pageRes = await fetch(
          `https://${auth.domain}.atlassian.net/wiki/rest/api/content`,
          {
            method: "POST",
            headers: auth.headers,
            body: JSON.stringify({
              type: "page",
              title: pageTitle,
              space: { key: spaceKey },
              body: { storage: { value: html, representation: "storage" } },
            }),
          }
        );
        const pageData = await pageRes.json();

        if (pageRes.ok && pageData.id) {
          const linkBase = pageData._links?.base ?? `https://${auth.domain}.atlassian.net/wiki`;
          const webui = pageData._links?.webui ?? "";
          results.confluence = { ok: true, pageId: pageData.id, url: webui ? `${linkBase}${webui}` : "" };
        } else {
          results.confluence = { ok: false, error: pageData.message ?? "Failed to create page" };
        }
      }
    } catch (err: unknown) {
      results.confluence = { ok: false, error: err instanceof Error ? err.message : "Confluence error" };
    }
  }

  revalidatePath("/projects");
  revalidatePath("/");

  return NextResponse.json({ project, results });
}
