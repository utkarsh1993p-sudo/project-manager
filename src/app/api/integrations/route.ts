import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — fetch all saved integrations (tokens redacted)
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("integrations")
    .select("id, type, domain, email, jira_project_key, confluence_space_key, created_at");

  return NextResponse.json(data ?? []);
}

// POST — save or update an integration
export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await createClient();

  // Upsert by type (only one JIRA + one Confluence config)
  const { data: existing } = await supabase
    .from("integrations")
    .select("id")
    .eq("type", body.type)
    .single();

  if (existing) {
    const updatePayload: Record<string, unknown> = {
      domain: body.domain,
      email: body.email,
      jira_project_key: body.jira_project_key ?? null,
      confluence_space_key: body.confluence_space_key ?? null,
      updated_at: new Date().toISOString(),
    };
    // Only overwrite the token if the user explicitly provided a new one
    if (body.api_token) {
      updatePayload.api_token = body.api_token;
    }

    const { error } = await supabase
      .from("integrations")
      .update(updatePayload)
      .eq("id", existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "updated" });
  } else {
    const { error } = await supabase.from("integrations").insert({
      type: body.type,
      domain: body.domain,
      email: body.email,
      api_token: body.api_token,
      jira_project_key: body.jira_project_key ?? null,
      confluence_space_key: body.confluence_space_key ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: "created" });
  }
}

// DELETE — remove an integration by type
export async function DELETE(req: NextRequest) {
  const { type } = await req.json();
  const supabase = await createClient();
  await supabase.from("integrations").delete().eq("type", type);
  return NextResponse.json({ ok: true });
}
