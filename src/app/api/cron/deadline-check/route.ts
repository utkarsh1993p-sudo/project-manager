import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { signToken } from "@/lib/deadline-token";

// Environment: CRON_SECRET, RESEND_API_KEY, NEXT_PUBLIC_BASE_URL, GROQ_API_KEY, DEADLINE_TOKEN_SECRET

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string;
  assignee: string | null;
  priority: string | null;
}

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  progress: number | null;
}

interface StakeholderRow {
  id: string;
  project_id: string;
  name: string;
  email: string | null;
  role: string | null;
}

interface RiskRow {
  status: string;
}

function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

async function generateEmailBody(params: {
  stakeholderName: string;
  taskTitle: string;
  projectName: string;
  daysUntilDue: number;
  taskDueDate: string;
  projectStatus: string;
  progress: number;
  openRisks: number;
  endDate: string;
}): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return `This is a reminder that task "${params.taskTitle}" in project "${params.projectName}" is due in ${params.daysUntilDue} days (${params.taskDueDate}). Please confirm it is on track or take action using the links below.`;
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a sharp, senior project management AI. You write concise, professional emails on behalf of ProjectFlow. Be direct and action-oriented. No fluff. Tone: collegial but firm.",
      },
      {
        role: "user",
        content: `Write an email to ${params.stakeholderName} alerting them that task "${params.taskTitle}" in project "${params.projectName}" is due ${params.daysUntilDue} days from now (${params.taskDueDate}).

Project context:
- Status: ${params.projectStatus}
- Progress: ${params.progress}%
- Open risks: ${params.openRisks}
- Project end date: ${params.endDate}

The email should:
1. Briefly state the upcoming deadline and why it matters in context of the overall project
2. Ask if the task is on track
3. Tell them they can confirm, request an extension (with justification), or flag it as blocked using the links below
4. Be 3-4 short paragraphs max

Return only the email body text. Do not include a subject line or salutation — those are added separately.`,
      },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content ?? "";
}

async function sendEmail(params: {
  to: string;
  toName: string;
  subject: string;
  bodyText: string;
  confirmUrl: string;
  extendUrl: string;
  blockedUrl: string;
  taskTitle: string;
  taskDueDate: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px 28px; border-radius: 12px 12px 0 0;">
        <p style="color: #bfdbfe; font-size: 12px; margin: 0 0 4px; letter-spacing: 0.05em; text-transform: uppercase;">ProjectFlow · Deadline Alert</p>
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">Action Required: ${params.taskTitle}</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Dear ${params.toName},</p>
        <div style="margin: 16px 0; font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-line;">${params.bodyText}</div>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <p style="font-size: 13px; font-weight: 600; color: #64748b; margin: 0 0 14px; text-transform: uppercase; letter-spacing: 0.05em;">Choose your response</p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="${params.confirmUrl}" style="display: block; background: #16a34a; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">Confirm On Track</a>
            <a href="${params.extendUrl}" style="display: block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">Request Extension</a>
            <a href="${params.blockedUrl}" style="display: block; background: #dc2626; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; text-align: center;">Flag as Blocked</a>
          </div>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent via ProjectFlow · These links are valid for 30 days.</p>
      </div>
    </div>
  `;

  if (!apiKey) {
    console.log("[deadline-check] No RESEND_API_KEY. Would email:", {
      to: params.to,
      subject: params.subject,
      confirmUrl: params.confirmUrl,
      extendUrl: params.extendUrl,
      blockedUrl: params.blockedUrl,
    });
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ProjectFlow <notifications@projectflow.app>",
      to: [params.to],
      subject: params.subject,
      html,
    }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { message?: string };
    console.error("[deadline-check] Resend error:", data.message ?? res.status);
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + 14);

  const todayStr = today.toISOString().split("T")[0];
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Fetch tasks due within 14 days, not done or blocked
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, project_id, title, status, due_date, assignee, priority")
    .gte("due_date", todayStr)
    .lte("due_date", cutoffStr)
    .neq("status", "done")
    .neq("status", "blocked");

  if (tasksError) {
    console.error("[deadline-check] Tasks query error:", tasksError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const taskRows = (tasks ?? []) as TaskRow[];

  if (taskRows.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, skipped: 0, message: "No upcoming deadlines found" });
  }

  // Collect unique project IDs
  const projectIds = [...new Set(taskRows.map((t) => t.project_id))];

  // Fetch projects and stakeholders in parallel
  const [{ data: projects }, { data: allStakeholders }, { data: allRisks }] = await Promise.all([
    supabase.from("projects").select("id, name, description, status, start_date, end_date, progress").in("id", projectIds),
    supabase.from("stakeholders").select("id, project_id, name, email, role").in("project_id", projectIds),
    supabase.from("risks").select("project_id, status").in("project_id", projectIds),
  ]);

  const projectMap = new Map<string, ProjectRow>(
    ((projects ?? []) as ProjectRow[]).map((p) => [p.id, p])
  );
  const stakeholdersByProject = new Map<string, StakeholderRow[]>();
  for (const s of (allStakeholders ?? []) as StakeholderRow[]) {
    const list = stakeholdersByProject.get(s.project_id) ?? [];
    list.push(s);
    stakeholdersByProject.set(s.project_id, list);
  }
  const openRisksByProject = new Map<string, number>();
  for (const r of (allRisks ?? []) as (RiskRow & { project_id: string })[]) {
    if (r.status === "open") {
      openRisksByProject.set(r.project_id, (openRisksByProject.get(r.project_id) ?? 0) + 1);
    }
  }

  let processed = 0;
  let skipped = 0;

  for (const task of taskRows) {
    const project = projectMap.get(task.project_id);
    if (!project) {
      skipped++;
      continue;
    }

    const stakeholders = (stakeholdersByProject.get(task.project_id) ?? []).filter(
      (s) => s.email && s.email.includes("@")
    );

    if (stakeholders.length === 0) {
      skipped++;
      continue;
    }

    const daysUntilDue = getDaysUntilDue(task.due_date);
    const openRisks = openRisksByProject.get(task.project_id) ?? 0;
    const progress = project.progress ?? 0;

    for (const stakeholder of stakeholders) {
      const tokenBase = {
        taskId: task.id,
        projectId: task.project_id,
        taskTitle: task.title,
        taskDueDate: task.due_date,
        stakeholderEmail: stakeholder.email!,
        stakeholderName: stakeholder.name,
      };

      const confirmToken = signToken({ ...tokenBase, action: "confirm" });
      const extendToken = signToken({ ...tokenBase, action: "extend" });
      const blockedToken = signToken({ ...tokenBase, action: "blocked" });

      const confirmUrl = `${baseUrl}/deadline-respond?token=${confirmToken}&action=confirm`;
      const extendUrl = `${baseUrl}/deadline-respond?token=${extendToken}&action=extend`;
      const blockedUrl = `${baseUrl}/deadline-respond?token=${blockedToken}&action=blocked`;

      let emailBody: string;
      try {
        emailBody = await generateEmailBody({
          stakeholderName: stakeholder.name,
          taskTitle: task.title,
          projectName: project.name,
          daysUntilDue,
          taskDueDate: task.due_date,
          projectStatus: project.status,
          progress,
          openRisks,
          endDate: project.end_date ?? "TBD",
        });
      } catch (err) {
        console.error("[deadline-check] AI generation error:", err);
        emailBody = `Task "${task.title}" in project "${project.name}" is due in ${daysUntilDue} days (${task.due_date}). Please confirm it is on track or take action using the links below.`;
      }

      await sendEmail({
        to: stakeholder.email!,
        toName: stakeholder.name,
        subject: `[ProjectFlow] Deadline in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}: ${task.title}`,
        bodyText: emailBody,
        confirmUrl,
        extendUrl,
        blockedUrl,
        taskTitle: task.title,
        taskDueDate: task.due_date,
      });
    }

    processed++;
  }

  return NextResponse.json({
    ok: true,
    processed,
    skipped,
    totalTasks: taskRows.length,
    dateRange: { from: todayStr, to: cutoffStr },
  });
}
