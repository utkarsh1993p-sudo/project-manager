import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeAtlassianDomain } from "@/lib/utils";

async function getConfluenceAuth() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("type", "confluence")
    .single();

  if (!data) return null;

  const token = Buffer.from(`${data.email}:${data.api_token}`).toString("base64");
  const domain = normalizeAtlassianDomain(data.domain);
  return {
    headers: {
      Authorization: `Basic ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    domain,
    spaceKey: data.confluence_space_key,
  };
}

// GET /api/confluence?resource=spaces|pages&spaceKey=XXX
export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get("resource");
  const spaceKey = req.nextUrl.searchParams.get("spaceKey");

  const auth = await getConfluenceAuth();
  if (!auth) {
    return NextResponse.json({ error: "Confluence not connected" }, { status: 400 });
  }

  const base = `https://${auth.domain}.atlassian.net/wiki/rest/api`;

  let url = "";
  if (resource === "spaces") {
    url = `${base}/space?limit=50&type=global`;
  } else if (resource === "pages") {
    const key = spaceKey ?? auth.spaceKey;
    url = `${base}/content?spaceKey=${key}&type=page&limit=50&expand=version,body.storage,_links`;
  } else {
    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  }

  const res = await fetch(url, { headers: auth.headers });
  const data = await res.json();
  // Use _links.base from Atlassian's own response — authoritative, never stale from stored domain
  const confluenceBase: string = data._links?.base ?? `https://${auth.domain}.atlassian.net/wiki`;
  return NextResponse.json({ ...data, confluenceBase });
}

// POST /api/confluence — create or update a page
export async function POST(req: NextRequest) {
  const body = await req.json();
  const auth = await getConfluenceAuth();
  if (!auth) {
    return NextResponse.json({ error: "Confluence not connected" }, { status: 400 });
  }

  const base = `https://${auth.domain}.atlassian.net/wiki/rest/api/content`;

  // Check if page already exists by title
  const searchRes = await fetch(
    `${base}?spaceKey=${body.spaceKey ?? auth.spaceKey}&title=${encodeURIComponent(body.title)}&expand=version`,
    { headers: auth.headers }
  );
  const searchData = await searchRes.json();
  const existing = searchData.results?.[0];

  if (existing) {
    // Update existing page
    const res = await fetch(`${base}/${existing.id}`, {
      method: "PUT",
      headers: auth.headers,
      body: JSON.stringify({
        version: { number: existing.version.number + 1 },
        title: body.title,
        type: "page",
        body: {
          storage: {
            value: markdownToConfluenceHtml(body.content),
            representation: "storage",
          },
        },
      }),
    });
    const data = await res.json();
    const linkBase = data._links?.base ?? `https://${auth.domain}.atlassian.net/wiki`;
    const webui = data._links?.webui ?? "";
    const pageUrl = webui ? `${linkBase}${webui}` : "";
    return NextResponse.json({ action: "updated", page: data, pageUrl });
  } else {
    // Create new page
    const res = await fetch(base, {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify({
        type: "page",
        title: body.title,
        space: { key: body.spaceKey ?? auth.spaceKey },
        body: {
          storage: {
            value: markdownToConfluenceHtml(body.content),
            representation: "storage",
          },
        },
      }),
    });
    const data = await res.json();
    const linkBase = data._links?.base ?? `https://${auth.domain}.atlassian.net/wiki`;
    const webui = data._links?.webui ?? "";
    const pageUrl = webui ? `${linkBase}${webui}` : "";
    return NextResponse.json({ action: "created", page: data, pageUrl });
  }
}

// Simple markdown → Confluence storage format conversion
function markdownToConfluenceHtml(markdown: string): string {
  return markdown
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- \[x\] (.+)$/gm, "<li><ac:task-status>complete</ac:task-status> $1</li>")
    .replace(/^- \[ \] (.+)$/gm, "<li><ac:task-status>incomplete</ac:task-status> $1</li>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|p])/gm, "<p>")
    .replace(/(?<![>])$/gm, "</p>")
    .replace(/<p><\/p>/g, "");
}
