import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateProjectLabel } from "@/lib/utils";

// POST /api/admin/backfill-labels
// Assigns project_label to all projects that don't have one.
// Safe to call multiple times — only updates rows where project_label IS NULL.
export async function POST() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, project_label")
    .is("project_label", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const usedLabels = new Set<string>();

  // Fetch already-assigned labels so we don't collide with them
  const { data: existing } = await supabase
    .from("projects")
    .select("project_label")
    .not("project_label", "is", null);
  for (const row of existing ?? []) {
    if (row.project_label) usedLabels.add(row.project_label.toUpperCase());
  }

  const updates: { id: string; label: string }[] = [];

  for (const project of projects ?? []) {
    let base = generateProjectLabel(project.name);
    let label = base;
    let suffix = 2;
    // Ensure uniqueness within this batch + already-used set
    while (usedLabels.has(label)) {
      label = `${base}${suffix}`;
      suffix++;
    }
    usedLabels.add(label);
    updates.push({ id: project.id, label });
  }

  let updated = 0;
  for (const { id, label } of updates) {
    const { error: updateError } = await supabase
      .from("projects")
      .update({ project_label: label })
      .eq("id", id);
    if (!updateError) updated++;
  }

  return NextResponse.json({
    ok: true,
    updated,
    labels: updates.map(({ id, label }) => ({ id, label })),
  });
}
