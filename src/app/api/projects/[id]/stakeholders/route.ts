import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

// POST — create stakeholder
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: project_id } = await params;
  const body = await req.json();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stakeholders")
    .insert({
      project_id,
      name: body.name?.trim(),
      role: body.role?.trim() ?? "",
      email: body.email?.trim() ?? "",
      influence: body.influence ?? "medium",
      interest: body.interest ?? "medium",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — update stakeholder
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id: project_id } = await params;
  const body = await req.json();
  const { stakeholderId, ...fields } = body;
  if (!stakeholderId) return NextResponse.json({ error: "stakeholderId required" }, { status: 400 });

  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (fields.name !== undefined) updates.name = fields.name;
  if (fields.role !== undefined) updates.role = fields.role;
  if (fields.email !== undefined) updates.email = fields.email;
  if (fields.influence !== undefined) updates.influence = fields.influence;
  if (fields.interest !== undefined) updates.interest = fields.interest;

  const { data, error } = await supabase
    .from("stakeholders")
    .update(updates)
    .eq("id", stakeholderId)
    .eq("project_id", project_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — remove stakeholder
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: project_id } = await params;
  const { stakeholderId } = await req.json();
  if (!stakeholderId) return NextResponse.json({ error: "stakeholderId required" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("stakeholders")
    .delete()
    .eq("id", stakeholderId)
    .eq("project_id", project_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
