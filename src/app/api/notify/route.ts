import { NextRequest, NextResponse } from "next/server";

// POST /api/notify — send date-change email to stakeholders
// Requires RESEND_API_KEY env var. Gracefully skips if not configured.
export async function POST(req: NextRequest) {
  const { projectName, startDate, endDate, changeReason, stakeholders } = await req.json();

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Log what would have been sent — useful for debugging without Resend configured
    console.log("[notify] No RESEND_API_KEY configured. Would have emailed:", {
      recipients: stakeholders.map((s: { email: string }) => s.email).filter(Boolean),
      subject: `[ProjectFlow] Date update: ${projectName}`,
    });
    return NextResponse.json({ ok: true, note: "Email skipped — RESEND_API_KEY not configured", simulated: true });
  }

  const recipients: string[] = stakeholders
    .map((s: { email: string }) => s.email)
    .filter((e: string) => e && e.includes("@"));

  if (recipients.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid email addresses in stakeholder list" });
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #1e293b;">
      <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px 28px; border-radius: 12px 12px 0 0;">
        <p style="color: #bfdbfe; font-size: 12px; margin: 0 0 4px; letter-spacing: 0.05em; text-transform: uppercase;">ProjectFlow · Date Update</p>
        <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">${projectName}</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #475569;">The project timeline has been updated:</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 16px;">
            <div>
              <p style="font-size: 11px; color: #94a3b8; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.05em;">Start Date</p>
              <p style="font-size: 15px; font-weight: 600; margin: 0; color: #1e293b;">${startDate ?? "TBD"}</p>
            </div>
            <div style="color: #cbd5e1; font-size: 20px; align-self: center;">→</div>
            <div>
              <p style="font-size: 11px; color: #94a3b8; margin: 0 0 2px; text-transform: uppercase; letter-spacing: 0.05em;">End Date</p>
              <p style="font-size: 15px; font-weight: 600; margin: 0; color: #1e293b;">${endDate ?? "TBD"}</p>
            </div>
          </div>
        </div>
        ${changeReason ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
          <p style="font-size: 12px; color: #3b82f6; font-weight: 600; margin: 0 0 4px;">Reason for change</p>
          <p style="font-size: 14px; color: #1e40af; margin: 0;">${changeReason}</p>
        </div>` : ""}
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Sent via ProjectFlow · Real-time project management</p>
      </div>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ProjectFlow <notifications@projectflow.app>",
        to: recipients,
        subject: `[ProjectFlow] Timeline updated: ${projectName}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return NextResponse.json({ ok: false, error: data.message ?? "Resend error" }, { status: res.status });
    return NextResponse.json({ ok: true, id: data.id, sent: recipients.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
