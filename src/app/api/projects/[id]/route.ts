import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { getAtlassianAuth } from "@/lib/atlassian";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(project);
}

// PATCH /api/projects/[id]
// Body: { startDate?, endDate?, notifyStakeholders?, changeReason?, syncJira?, syncConfluence? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const supabase = await createClient();

  // 1. Build Supabase update
  const updates: Record<string, unknown> = {};
  if (body.startDate !== undefined) updates.start_date = body.startDate || null;
  if (body.endDate !== undefined) updates.end_date = body.endDate || null;
  if (body.status !== undefined) updates.status = body.status;

  const { data: project, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  const results: Record<string, unknown> = { supabase: { ok: true } };

  // 2. Sync end date to JIRA epic
  if (body.endDate !== undefined && body.syncJira !== false) {
    try {
      const auth = await getAtlassianAuth("jira");
      if (auth && project.project_label) {
        const label = project.project_label.toLowerCase();
        const searchRes = await fetch(
          `https://${auth.domain}.atlassian.net/rest/api/3/search/jql?jql=labels="${label}" AND issuetype=Epic&maxResults=1&fields=summary`,
          { headers: auth.headers }
        );
        const searchData = await searchRes.json();
        const epic = searchData.issues?.[0];
        if (epic) {
          const putRes = await fetch(
            `https://${auth.domain}.atlassian.net/rest/api/3/issue/${epic.key}`,
            {
              method: "PUT",
              headers: auth.headers,
              body: JSON.stringify({ fields: { duedate: body.endDate || null } }),
            }
          );
          results.jira = { ok: putRes.ok, key: epic.key };
        } else {
          results.jira = { ok: false, note: "No JIRA epic found with this project label" };
        }
      }
    } catch (err) {
      results.jira = { ok: false, error: String(err) };
    }
  }

  // 3. Confluence: update project overview page with new dates
  if ((body.startDate !== undefined || body.endDate !== undefined) && body.syncConfluence !== false) {
    try {
      const auth = await getAtlassianAuth("confluence");
      if (auth) {
        const spaceKey = auth.data.confluence_space_key;
        // Find the page by title (project name)
        const searchRes = await fetch(
          `https://${auth.domain}.atlassian.net/wiki/rest/api/content?title=${encodeURIComponent(project.name)}&spaceKey=${spaceKey}&expand=version,body.storage`,
          { headers: auth.headers }
        );
        const searchData = await searchRes.json();
        const page = searchData.results?.[0];
        if (page) {
          const start = body.startDate ?? project.start_date ?? "";
          const end = body.endDate ?? project.end_date ?? "";
          const newBody = page.body.storage.value.replace(
            /<p>Project created\. Update this page as it progresses\.<\/p>/,
            `<p>Timeline: ${start} → ${end}. Last updated by ProjectFlow.</p>`
          );
          const updateRes = await fetch(
            `https://${auth.domain}.atlassian.net/wiki/rest/api/content/${page.id}`,
            {
              method: "PUT",
              headers: auth.headers,
              body: JSON.stringify({
                version: { number: page.version.number + 1 },
                title: page.title,
                type: "page",
                body: { storage: { value: newBody, representation: "storage" } },
              }),
            }
          );
          results.confluence = { ok: updateRes.ok, pageId: page.id };
        } else {
          results.confluence = { ok: false, note: "Confluence page not found — will sync on next run" };
        }
      }
    } catch (err) {
      results.confluence = { ok: false, error: String(err) };
    }
  }

  // 4. Email notification to stakeholders
  if (body.notifyStakeholders && body.changeReason) {
    try {
      const { data: stakeholders } = await supabase
        .from("stakeholders")
        .select("*")
        .eq("project_id", id);

      if (stakeholders && stakeholders.length > 0) {
        const notifyRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/notify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectName: project.name,
              startDate: project.start_date,
              endDate: project.end_date,
              changeReason: body.changeReason,
              stakeholders,
            }),
          }
        );
        const notifyData = await notifyRes.json();
        results.notification = notifyData;
      } else {
        results.notification = { ok: false, note: "No stakeholders with emails found" };
      }
    } catch (err) {
      results.notification = { ok: false, error: String(err) };
    }
  }

  return NextResponse.json({ project, results });
}
