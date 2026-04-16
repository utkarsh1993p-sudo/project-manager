import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAtlassianHeaders() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("type", "jira")
    .single();

  if (!data) return null;

  const token = Buffer.from(`${data.email}:${data.api_token}`).toString("base64");
  const domain = data.domain.replace(/\.atlassian\.net\/?$/, "").trim();
  return {
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    domain,
    projectKey: data.jira_project_key,
  };
}

// GET /api/jira?resource=projects|issues|statuses
export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource");
  const projectKey = req.nextUrl.searchParams.get("projectKey");

  const auth = await getAtlassianHeaders();
  if (!auth) {
    return NextResponse.json({ error: "JIRA not connected" }, { status: 400 });
  }

  const base = `https://${auth.domain}.atlassian.net/rest/api/3`;

  let url = "";
  if (resource === "projects") {
    url = `${base}/project/search?maxResults=50`;
  } else if (resource === "issues") {
    const key = projectKey ?? auth.projectKey;
    url = `${base}/search?jql=project=${key} ORDER BY created DESC&maxResults=50&fields=summary,status,priority,assignee,duedate,labels`;
  } else if (resource === "statuses") {
    url = `${base}/project/${projectKey ?? auth.projectKey}/statuses`;
  } else {
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  const res = await fetch(url, { headers: auth.headers });
  const data = await res.json();

  if (!res.ok) {
    const message =
      data?.errorMessages?.[0] ??
      data?.message ??
      `Jira returned ${res.status}`;
    return NextResponse.json({ error: message }, { status: res.status });
  }

  return NextResponse.json(data);
}

// POST /api/jira — create an issue
export async function POST(req: NextRequest) {
  const body = await req.json();
  const auth = await getAtlassianHeaders();
  if (!auth) {
    return NextResponse.json({ error: "JIRA not connected" }, { status: 400 });
  }

  const res = await fetch(
    `https://${auth.domain}.atlassian.net/rest/api/3/issue`,
    {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify({
        fields: {
          project: { key: body.projectKey ?? auth.projectKey },
          summary: body.summary,
          description: body.description
            ? {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: body.description }],
                  },
                ],
              }
            : undefined,
          issuetype: { name: body.issueType ?? "Task" },
          priority: body.priority ? { name: body.priority } : undefined,
        },
      }),
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

// PATCH /api/jira — transition issue status
export async function PATCH(req: NextRequest) {
  const { issueKey, transitionId } = await req.json();
  const auth = await getAtlassianHeaders();
  if (!auth) {
    return NextResponse.json({ error: "JIRA not connected" }, { status: 400 });
  }

  const res = await fetch(
    `https://${auth.domain}.atlassian.net/rest/api/3/issue/${issueKey}/transitions`,
    {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify({ transition: { id: transitionId } }),
    }
  );

  return NextResponse.json({ ok: res.ok }, { status: res.status });
}
