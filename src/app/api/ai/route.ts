import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: NextRequest) {
  const { action, context } = await req.json();

  const prompts: Record<string, string> = {
    project_summary: `You are a senior project manager. Based on the following project data, write a concise 3-5 sentence executive summary covering status, key achievements, risks, and next steps.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    stakeholder_update: `You are a project manager drafting a stakeholder update email. Write a professional, clear update email based on the project data below. Include: current status, completed milestones, upcoming milestones, key risks, and what decisions/support is needed.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    risk_assessment: `You are a risk management expert. Analyze the following project data and provide a risk assessment. For each identified risk: rate severity (Critical/High/Medium/Low), explain potential impact, and suggest a specific mitigation strategy.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    action_plan: `You are a project manager. Based on the project goals, current status, and risks below, generate a prioritized action plan for the next 30 days. Format as a numbered list with owner, due date suggestion, and priority.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    executive_summary: `You are a C-suite advisor. Write a concise executive summary (max 200 words) for leadership, covering: project health (RAG status), progress vs plan, top 2 risks, budget/resource status, and the single most important decision needed.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    pushback_simulator: `You are playing the role of a skeptical stakeholder. Based on the project data below, generate 3-4 tough questions or objections a stakeholder might raise, then provide suggested responses for each.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    task_description: `You are a project manager. Write a clear, actionable task description for the following task title in the context of this project. Include: objective, acceptance criteria, and any dependencies.\n\nTask: ${context.taskTitle}\nProject: ${JSON.stringify(context.project, null, 2)}`,

    confluence_doc: `You are a technical writer. Based on the following project data, write a well-structured ${context.docType} document in Markdown format. Be specific, professional, and actionable.\n\nProject Data:\n${JSON.stringify(context.project, null, 2)}`,

    weekly_report: `You are a project manager. Generate a weekly status report based on this project data. Include: RAG status, summary of the week, completed items, blockers, next week's priorities, and team highlights.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,

    scope_breakdown: `You are a project manager. Break down the following project goals into specific, measurable deliverables with effort estimates (S/M/L/XL), dependencies, and suggested owners.\n\nProject Data:\n${JSON.stringify(context, null, 2)}`,
  };

  const prompt = prompts[action];
  if (!prompt) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
