import { verifyToken } from "@/lib/deadline-token";
import { DeadlineRespondClient } from "./DeadlineRespondClient";

// Auto-process confirm/blocked actions server-side via the API
async function processAction(token: string, action: string): Promise<{ ok: boolean; message: string; action: string } | null> {
  if (action !== "confirm" && action !== "blocked") return null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/deadline-respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
      cache: "no-store",
    });
    const data = (await res.json()) as { ok: boolean; message?: string };
    return {
      ok: data.ok,
      message: data.message ?? (data.ok ? "Done." : "Something went wrong."),
      action,
    };
  } catch {
    return { ok: false, message: "Failed to process request. Please try again.", action };
  }
}

export default async function DeadlineRespondPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  const action = typeof params.action === "string" ? params.action : "";

  // Verify token client-side on the server
  const payload = token ? verifyToken(token) : null;

  // Invalid or missing token
  if (!payload) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl font-bold">✗</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invalid or Expired Link</h1>
          <p className="text-slate-500 text-sm">
            This link is no longer valid. Links expire after 30 days.
            Please contact your project manager if you need assistance.
          </p>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">ProjectFlow · AI-Powered Project Management</p>
          </div>
        </div>
      </div>
    );
  }

  // For confirm/blocked: auto-process and show result
  let initialResult: { ok: boolean; message: string; action: string } | undefined;
  if (action === "confirm" || action === "blocked") {
    const result = await processAction(token, action);
    initialResult = result ?? undefined;
  }

  const validAction = ["confirm", "extend", "blocked"].includes(action) ? action : "confirm";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">PF</span>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">ProjectFlow</p>
              <h1 className="text-white font-bold text-lg leading-tight">Deadline Response</h1>
            </div>
          </div>
        </div>

        {/* Task info strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Task</p>
              <p className="font-semibold text-slate-800 truncate">{payload.taskTitle}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-0.5">Due Date</p>
              <p className="font-semibold text-slate-800">{payload.taskDueDate}</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="px-8 py-6">
          <DeadlineRespondClient
            token={token}
            action={validAction}
            taskTitle={payload.taskTitle}
            taskDueDate={payload.taskDueDate}
            stakeholderName={payload.stakeholderName}
            initialResult={initialResult}
          />
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">
            ProjectFlow · AI-Powered Project Management ·{" "}
            <a href="/" className="underline hover:text-slate-600">
              Go to dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
