import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Project } from "@/types";

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY ?? "",
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function buildPrompt(action: string, projects: Project[]): string {
  const summary = projects.map((p) => ({
    name: p.name,
    status: p.status,
    progress: p.progress,
    openTasks: p.tasks.filter((t) => t.status !== "done").length,
    totalTasks: p.tasks.length,
    openRisks: p.risks.filter((r) => r.status === "open").length,
    team: p.team.map((m) => ({ name: m.name, role: m.role })),
    goals: p.goals,
    nextMilestone: p.timeline.find((m) => m.status !== "completed"),
  }));

  const ctx = JSON.stringify(summary, null, 2);

  const prompts: Record<string, string> = {
    "executive-summary": `You are a senior project manager. Write a concise executive summary (max 250 words) across the following projects. Cover: overall health, top achievements, critical risks, and key decisions needed. Use bullet points.\n\nProjects:\n${ctx}`,
    "risk-report": `You are a risk management expert. Consolidate and analyze open risks across these projects. Group by severity, explain potential impact, and suggest mitigations. Format clearly with headers.\n\nProjects:\n${ctx}`,
    "velocity-report": `You are a project analyst. Based on open vs completed tasks across these projects, write a velocity report. Note which projects are ahead/behind, task throughput trends, and recommendations.\n\nProjects:\n${ctx}`,
    "team-workload": `You are a resource manager. Analyze team composition and task distribution across these projects. Identify overloaded areas, gaps, and recommendations for workload balance.\n\nProjects:\n${ctx}`,
    "milestone-outlook": `You are a project planner. Summarize upcoming milestones across these projects. Flag any that look at risk based on current progress. Format as a clear timeline outlook.\n\nProjects:\n${ctx}`,
    "weekly-standup": `You are a project manager. Write ready-to-share weekly standup notes covering all projects: what was done, what's in progress, blockers, and what's coming next. Keep it punchy and clear.\n\nProjects:\n${ctx}`,
    "project-brief": `You are a project manager. Write a one-page project brief for the first project in the list. Cover: objective, scope, team, status, key milestones, risks, and success criteria.\n\nProjects:\n${ctx}`,
    "status-update": `You are a project manager. Draft a professional stakeholder status update email covering all projects. Include: overall health, highlights, risks requiring attention, and any decisions needed. Keep it under 300 words.\n\nProjects:\n${ctx}`,
  };

  return prompts[action] ?? "";
}

export async function POST(req: NextRequest) {
  const { action, projects } = await req.json() as { action: string; projects: Project[] };

  if (!action || !Array.isArray(projects)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const prompt = buildPrompt(action, projects);
  if (!prompt) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "AI not configured. Add GROQ_API_KEY to environment variables." }, { status: 503 });
  }

  try {
    const completion = await getClient().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
