"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Projects ──────────────────────────────────────────────

export async function createProject(data: {
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  owner: string;
  goals: string[];
}) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      description: data.description,
      status: data.status,
      start_date: data.startDate || null,
      end_date: data.endDate || null,
      owner: data.owner,
      goals: data.goals,
      progress: 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Create default workspace docs
  await supabase.from("workspace_docs").insert([
    { project_id: project.id, type: "project-overview", title: "Project Overview", content: `# ${data.name} — Project Overview\n\n## Objective\n${data.description}\n\n## Goals\n${data.goals.map((g) => `- ${g}`).join("\n")}` },
    { project_id: project.id, type: "stakeholder-map", title: "Stakeholder Map", content: "# Stakeholder Map\n\nAdd your stakeholders here." },
    { project_id: project.id, type: "risk-log", title: "Risk Log", content: "# Risk Log\n\nNo risks identified yet." },
    { project_id: project.id, type: "action-plan", title: "Action Plan", content: "# Action Plan\n\nAdd your actions here." },
  ]);

  revalidatePath("/projects");
  return project;
}

export async function updateProject(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    status: string;
    progress: number;
    goals: string[];
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(data).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
}

// ── Tasks ─────────────────────────────────────────────────

export async function createTask(
  projectId: string,
  data: {
    title: string;
    status: string;
    priority: string;
    assignee?: string;
    dueDate?: string;
    tags?: string[];
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title: data.title,
    status: data.status,
    priority: data.priority,
    assignee: data.assignee || null,
    due_date: data.dueDate || null,
    tags: data.tags ?? [],
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

// ── Risks ─────────────────────────────────────────────────

export async function createRisk(
  projectId: string,
  data: {
    title: string;
    description: string;
    level: string;
    probability: string;
    impact: string;
    mitigation: string;
    owner: string;
  }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("risks").insert({
    project_id: projectId,
    ...data,
    status: "open",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateRiskStatus(
  riskId: string,
  projectId: string,
  status: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("risks")
    .update({ status })
    .eq("id", riskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

// ── Workspace Docs ────────────────────────────────────────

export async function updateWorkspaceDoc(
  docId: string,
  projectId: string,
  content: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_docs")
    .update({ content, last_updated: new Date().toISOString() })
    .eq("id", docId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

// ── Team Members ──────────────────────────────────────────

export async function addTeamMember(
  projectId: string,
  data: { name: string; email: string; role: string }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({
    project_id: projectId,
    ...data,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}

export async function removeTeamMember(memberId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/projects/${projectId}`);
}
