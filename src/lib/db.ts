import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types";

// Fetch all projects with basic info
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !projects) return [];

  const full = await Promise.all(projects.map((p) => hydrateProject(p, supabase)));
  return full;
}

// Fetch a single project with all related data
export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !project) return null;
  return hydrateProject(project, supabase);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hydrateProject(project: any, supabase: any): Promise<Project> {
  const [
    { data: team },
    { data: stakeholders },
    { data: timeline },
    { data: risks },
    { data: tasks },
    { data: workspaceDocs },
    { data: dependencies },
    { data: iterations },
    { data: templates },
  ] = await Promise.all([
    supabase.from("team_members").select("*").eq("project_id", project.id),
    supabase.from("stakeholders").select("*").eq("project_id", project.id),
    supabase.from("milestones").select("*").eq("project_id", project.id).order("due_date"),
    supabase.from("risks").select("*").eq("project_id", project.id),
    supabase.from("tasks").select("*").eq("project_id", project.id),
    supabase.from("workspace_docs").select("*").eq("project_id", project.id),
    supabase.from("dependencies").select("*").eq("project_id", project.id),
    supabase.from("iterations").select("*").eq("project_id", project.id).order("number"),
    supabase.from("templates").select("*").eq("project_id", project.id),
  ]);

  return {
    id: project.id,
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    startDate: project.start_date ?? "",
    endDate: project.end_date ?? "",
    owner: project.owner ?? "",
    progress: (() => {
      const allTasks = tasks ?? [];
      if (allTasks.length === 0) return project.progress ?? 0;
      const done = allTasks.filter((t: any) => t.status === "done").length;
      return Math.round((done / allTasks.length) * 100);
    })(),
    goals: project.goals ?? [],
    team: (team ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
    })),
    stakeholders: (stakeholders ?? []).map((s: any) => ({
      id: s.id,
      name: s.name,
      role: s.role ?? "",
      email: s.email ?? "",
      influence: s.influence,
      interest: s.interest,
    })),
    timeline: (timeline ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      dueDate: m.due_date ?? "",
      status: m.status,
    })),
    risks: (risks ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      level: r.level,
      probability: r.probability,
      impact: r.impact,
      mitigation: r.mitigation ?? "",
      owner: r.owner ?? "",
      status: r.status,
    })),
    tasks: (tasks ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      assignee: t.assignee ?? "",
      dueDate: t.due_date ?? "",
      tags: t.tags ?? [],
    })),
    workspaceDocs: (workspaceDocs ?? []).map((d: any) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      content: d.content ?? "",
      lastUpdated: d.last_updated ?? "",
    })),
    dependencies: (dependencies ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      description: d.description ?? "",
      type: d.type,
      status: d.status,
    })),
    iterations: (iterations ?? []).map((i: any) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      startDate: i.start_date ?? "",
      endDate: i.end_date ?? "",
      status: i.status,
      whatIsOff: i.what_is_off ?? [],
      refinements: i.refinements ?? [],
      improvements: i.improvements ?? [],
    })),
    templates: (templates ?? []).map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      category: t.category,
      prompt: t.prompt,
    })),
  };
}
