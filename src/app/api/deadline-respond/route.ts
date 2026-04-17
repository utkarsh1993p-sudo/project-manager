import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groq, GROQ_MODEL } from "@/lib/groq";
import { verifyToken } from "@/lib/deadline-token";
import { getAtlassianAuth } from "@/lib/atlassian";
import { normalizeAtlassianDomain } from "@/lib/utils";

// Environment: RESEND_API_KEY, NEXT_PUBLIC_BASE_URL, GROQ_API_KEY, DEADLINE_TOKEN_SECRET

type Action = "confirm" | "extend" | "blocked";

async function updateJiraDueDate(jiraKey: string, newDate: string): Promise<void> {
  try {
    const auth = await getAtlassianAuth("jira");
    if (!auth) return;
    await fetch(
      `https://${normalizeAtlassianDomain(auth.data.domain)}.atlassian.net/rest/api/3/issue/${jiraKey}`,
      { method: "PUT", headers: auth.headers, body: JSON.stringify({ fields: { duedate: newDate } }) }
    );
  } catch (err) {
    console.error("[deadline-respond] JIRA duedate update error:", err);
  }
}

async function transitionJiraToBlocked(jiraKey: string): Promise<void> {
  try {
    const auth = await getAtlassianAuth("jira");
    if (!auth) return;
    const domain = normalizeAtlassianDomain(auth.data.domain);
    const transRes = await fetch(
      `https://${domain}.atlassian.net/rest/api/3/issue/${jiraKey}/transitions`,
      { headers: auth.headers }
    );
    const transData = await transRes.json() as { transitions?: Array<{ id: string; name: string }> };
    const blocked = (transData.transitions ?? []).find((t) =>
      ["blocked", "on hold", "impediment"].some((n) => t.name.toLowerCase().includes(n))
    );
    if (blocked) {
      await fetch(
        `https://${domain}.atlassian.net/rest/api/3/issue/${jiraKey}/transitions`,
        { method: "POST", headers: auth.headers, body: JSON.stringify({ transition: { id: blocked.id } }) }
      );
    }
  } catch (err) {
    console.error("[deadline-respond] JIRA transition error:", err);
  }
}

interface ExtendRequestBody {
  token: string;
  action: "extend";
  reason: string;
  proposedDate: string;
}

interface SimpleRequestBody {
  token: string;
  action: "confirm" | "blocked";
}

type RequestBody = ExtendRequestBody | SimpleRequestBody;

interface AiExtensionDecision {
  approved: boolean;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  emailBody: string;
}

interface StakeholderRow {
  name: string;
  email: string | null;
}

interface ProjectRow {
  id: string;
  name: string;
  status: string;
  end_date: string | null;
  progress: number | null;
  owner: string | null;
}

interface RiskRow {
  status: string;
}

async function sendEmail(params: {
  to: string;
  toName: string;
  subject: string;
  bodyHtml: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 580px; margin: 0 auto; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px 28px; border-radius: 12px 12px 0 0;">
        <p style="color: #bfdbfe; font-size: 12px; margin: 0 0 4px; letter-spacing: 0.05em; text-transform: uppercase;">ProjectFlow · Update</p>
        <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 700;">${params.subject}</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase;">Dear ${params.toName},</p>
        <div style="margin: 16px 0; font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-line;">${params.bodyHtml}</div>
        <p style="font-size: 12px; color: #94a3b8; margin: 16px 0 0;">Sent via ProjectFlow</p>
      </div>
    </div>
  `;

  if (!apiKey) {
    console.log("[deadline-respond] No RESEND_API_KEY. Would email:", {
      to: params.to,
      subject: params.subject,
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
      from: "ProjectFlow <onboarding@resend.dev>",
      to: [params.to],
      subject: params.subject,
      html,
    }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { message?: string };
    console.error("[deadline-respond] Resend error:", data.message ?? res.status);
  }
}

async function evaluateExtensionRequest(params: {
  taskTitle: string;
  currentDueDate: string;
  proposedDate: string;
  reason: string;
  projectEndDate: string;
  progress: number;
  openRisks: number;
  openTaskCount: number;
}): Promise<AiExtensionDecision> {
  const proposedDt = new Date(params.proposedDate);
  const currentDt = new Date(params.currentDueDate);
  const daysRequested = Math.round(
    (proposedDt.getTime() - currentDt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (!process.env.GROQ_API_KEY) {
    return {
      approved: false,
      confidence: "low",
      reasoning: "AI not configured — defaulting to rejection.",
      emailBody:
        "We were unable to evaluate your extension request at this time due to a configuration issue. Please contact your project manager directly.",
    };
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a rigorous project management AI. Evaluate extension requests objectively.",
      },
      {
        role: "user",
        content: `Evaluate this extension request:

Task: "${params.taskTitle}"
Current due date: ${params.currentDueDate}
Proposed new date: ${params.proposedDate}
Days extension requested: ${daysRequested}
Stakeholder reason: "${params.reason}"

Project context:
- Project end date: ${params.projectEndDate}
- Project progress: ${params.progress}%
- Open risks: ${params.openRisks}
- Other tasks still open: ${params.openTaskCount}

Rules for approval:
- Extension <= 14 days: approve if reason is specific (technical blocker, dependency, resource constraint)
- Extension 15-30 days: approve only if reason is compelling and proposed date is before project end
- Extension > 30 days or past project end date: reject unless critical blocker
- Vague reasons ("need more time", "busy") → reject with pushback

Respond with ONLY valid JSON (no markdown):
{
  "approved": boolean,
  "confidence": "high"|"medium"|"low",
  "reasoning": "1-2 sentence internal reasoning",
  "emailBody": "2-3 paragraph email to send back to the stakeholder explaining the decision in professional tone. If approved, confirm the new date and next steps. If rejected, push back firmly with data-backed reasoning and ask for better justification or smaller extension."
}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw) as AiExtensionDecision;
    return parsed;
  } catch {
    console.error("[deadline-respond] Failed to parse AI JSON:", raw);
    return {
      approved: false,
      confidence: "low",
      reasoning: "Failed to parse AI response.",
      emailBody:
        "We were unable to process your extension request automatically. Please contact your project manager directly.",
    };
  }
}

async function logResponse(params: {
  taskId: string;
  projectId: string;
  stakeholderEmail: string;
  action: string;
  reason?: string;
  proposedDate?: string;
  aiReasoning?: string;
  aiApproved?: boolean;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("deadline_responses").insert({
      task_id: params.taskId,
      project_id: params.projectId,
      stakeholder_email: params.stakeholderEmail,
      action: params.action,
      reason: params.reason ?? null,
      proposed_date: params.proposedDate ?? null,
      ai_reasoning: params.aiReasoning ?? null,
      ai_approved: params.aiApproved ?? null,
    });
  } catch (err) {
    console.error("[deadline-respond] Failed to log response:", err);
  }
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { token, action } = body;

  if (!token || !action) {
    return NextResponse.json({ ok: false, error: "Missing token or action" }, { status: 400 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid or expired token" }, { status: 401 });
  }

  const supabase = await createClient();

  if (action === "confirm") {
    await logResponse({
      taskId: payload.taskId,
      projectId: payload.projectId,
      stakeholderEmail: payload.stakeholderEmail,
      action: "confirm",
    });

    await sendEmail({
      to: payload.stakeholderEmail,
      toName: payload.stakeholderName,
      subject: `[ProjectFlow] Confirmed on track: ${payload.taskTitle}`,
      bodyHtml: `Thank you for confirming that "${payload.taskTitle}" is on track for its deadline of ${payload.taskDueDate}.\n\nYour response has been recorded. We'll follow up if anything changes.`,
    });

    return NextResponse.json({
      ok: true,
      message: "Thanks! Marked as on track.",
    });
  }

  if (action === "blocked") {
    // Update task status to blocked
    const { data: taskRow, error: updateError } = await supabase
      .from("tasks")
      .update({ status: "blocked" })
      .eq("id", payload.taskId)
      .select("jira_key")
      .single();

    if (updateError) {
      console.error("[deadline-respond] Failed to update task status:", updateError);
    }

    // Push blocked status to JIRA
    if (taskRow?.jira_key) {
      await transitionJiraToBlocked(taskRow.jira_key);
    }

    await logResponse({
      taskId: payload.taskId,
      projectId: payload.projectId,
      stakeholderEmail: payload.stakeholderEmail,
      action: "blocked",
    });

    // Notify project owner/stakeholders
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, status, end_date, progress, owner")
      .eq("id", payload.projectId)
      .single();

    const projectRow = project as ProjectRow | null;

    if (projectRow?.owner) {
      await sendEmail({
        to: projectRow.owner,
        toName: "Project Owner",
        subject: `[ProjectFlow] Task blocked: ${payload.taskTitle}`,
        bodyHtml: `${payload.stakeholderName} has flagged task "${payload.taskTitle}" (due ${payload.taskDueDate}) as blocked in project "${projectRow.name}".\n\nPlease review and take action to unblock this task as soon as possible.`,
      });
    }

    return NextResponse.json({ ok: true, message: "Task flagged as blocked." });
  }

  if (action === "extend") {
    const extendBody = body as ExtendRequestBody;
    const { reason, proposedDate } = extendBody;

    if (!reason || !proposedDate) {
      return NextResponse.json(
        { ok: false, error: "reason and proposedDate are required for extension requests" },
        { status: 400 }
      );
    }

    // Fetch project context
    const [{ data: project }, { data: risks }, { data: openTasks }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, status, end_date, progress, owner")
        .eq("id", payload.projectId)
        .single(),
      supabase.from("risks").select("status").eq("project_id", payload.projectId),
      supabase
        .from("tasks")
        .select("id")
        .eq("project_id", payload.projectId)
        .neq("status", "done"),
    ]);

    const projectRow = project as ProjectRow | null;
    const riskRows = (risks ?? []) as RiskRow[];
    const openRisks = riskRows.filter((r) => r.status === "open").length;
    const openTaskCount = (openTasks ?? []).length;

    const decision = await evaluateExtensionRequest({
      taskTitle: payload.taskTitle,
      currentDueDate: payload.taskDueDate,
      proposedDate,
      reason,
      projectEndDate: projectRow?.end_date ?? "TBD",
      progress: projectRow?.progress ?? 0,
      openRisks,
      openTaskCount,
    });

    if (decision.approved) {
      // Update task due date
      const { data: updatedTask, error: updateError } = await supabase
        .from("tasks")
        .update({ due_date: proposedDate })
        .eq("id", payload.taskId)
        .select("jira_key")
        .single();

      if (updateError) {
        console.error("[deadline-respond] Failed to update due date:", updateError);
      }

      // Push new due date to JIRA
      if (updatedTask?.jira_key) {
        await updateJiraDueDate(updatedTask.jira_key, proposedDate);
      }

      await logResponse({
        taskId: payload.taskId,
        projectId: payload.projectId,
        stakeholderEmail: payload.stakeholderEmail,
        action: "extend_approved",
        reason,
        proposedDate,
        aiReasoning: decision.reasoning,
        aiApproved: true,
      });

      // Send confirmation to requesting stakeholder
      await sendEmail({
        to: payload.stakeholderEmail,
        toName: payload.stakeholderName,
        subject: `[ProjectFlow] Extension approved: ${payload.taskTitle}`,
        bodyHtml: decision.emailBody,
      });

      // Notify all other stakeholders about the date change
      const { data: allStakeholders } = await supabase
        .from("stakeholders")
        .select("name, email")
        .eq("project_id", payload.projectId);

      const others = ((allStakeholders ?? []) as StakeholderRow[]).filter(
        (s) => s.email && s.email !== payload.stakeholderEmail && s.email.includes("@")
      );

      await Promise.all(
        others.map((s) =>
          sendEmail({
            to: s.email!,
            toName: s.name,
            subject: `[ProjectFlow] Due date updated: ${payload.taskTitle}`,
            bodyHtml: `This is to inform you that the due date for task "${payload.taskTitle}" in project "${projectRow?.name ?? ""}" has been updated from ${payload.taskDueDate} to ${proposedDate}.\n\nThis change was approved based on a stakeholder request. Please update your plans accordingly.`,
          })
        )
      );

      return NextResponse.json({
        ok: true,
        approved: true,
        message: "Extension approved. Due date updated.",
        emailBody: decision.emailBody,
      });
    } else {
      await logResponse({
        taskId: payload.taskId,
        projectId: payload.projectId,
        stakeholderEmail: payload.stakeholderEmail,
        action: "extend_rejected",
        reason,
        proposedDate,
        aiReasoning: decision.reasoning,
        aiApproved: false,
      });

      // Send rebuttal email
      await sendEmail({
        to: payload.stakeholderEmail,
        toName: payload.stakeholderName,
        subject: `[ProjectFlow] Extension not approved: ${payload.taskTitle}`,
        bodyHtml: decision.emailBody,
      });

      return NextResponse.json({
        ok: true,
        approved: false,
        message: "Extension request reviewed — see email for details.",
        emailBody: decision.emailBody,
      });
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
