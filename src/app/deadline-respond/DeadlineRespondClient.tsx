"use client";

import { useState } from "react";

interface ExtendFormProps {
  token: string;
  taskTitle: string;
  taskDueDate: string;
}

interface ApiResult {
  ok: boolean;
  approved?: boolean;
  message?: string;
  emailBody?: string;
  error?: string;
}

function ExtendForm({ token, taskTitle, taskDueDate }: ExtendFormProps) {
  const [reason, setReason] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reason.trim() || !proposedDate) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/deadline-respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "extend", reason, proposedDate }),
      });
      const data = (await res.json()) as ApiResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div
        className={`rounded-xl border p-6 ${
          result.approved
            ? "bg-green-50 border-green-200"
            : result.ok
            ? "bg-amber-50 border-amber-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg ${
              result.approved ? "bg-green-500" : result.ok ? "bg-amber-500" : "bg-red-500"
            }`}
          >
            {result.approved ? "✓" : result.ok ? "!" : "✗"}
          </div>
          <h3
            className={`font-semibold text-lg ${
              result.approved
                ? "text-green-800"
                : result.ok
                ? "text-amber-800"
                : "text-red-800"
            }`}
          >
            {result.approved
              ? "Extension Approved"
              : result.ok
              ? "Extension Not Approved"
              : "Something went wrong"}
          </h3>
        </div>
        {result.emailBody && (
          <div
            className={`text-sm leading-relaxed whitespace-pre-line ${
              result.approved ? "text-green-700" : "text-amber-700"
            }`}
          >
            {result.emailBody}
          </div>
        )}
        {result.error && <p className="text-red-700 text-sm">{result.error}</p>}
        {result.ok && !result.emailBody && (
          <p className={`text-sm ${result.approved ? "text-green-700" : "text-amber-700"}`}>
            {result.message}
          </p>
        )}
        <p className="text-xs text-slate-500 mt-4">A confirmation email has been sent to your inbox.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Task</p>
        <p className="font-semibold text-slate-800">{taskTitle}</p>
        <p className="text-sm text-slate-500 mt-1">Current due date: {taskDueDate}</p>
      </div>

      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Reason for extension <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe the specific blocker, dependency, or constraint requiring more time..."
          rows={4}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-slate-400 mt-1">Be specific — vague reasons are more likely to be rejected by the AI reviewer.</p>
      </div>

      <div>
        <label
          htmlFor="proposedDate"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Proposed new due date <span className="text-red-500">*</span>
        </label>
        <input
          id="proposedDate"
          type="date"
          value={proposedDate}
          onChange={(e) => setProposedDate(e.target.value)}
          min={today}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !reason.trim() || !proposedDate}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
      >
        {loading ? "Reviewing with AI..." : "Submit Extension Request"}
      </button>
    </form>
  );
}

export interface DeadlineRespondClientProps {
  token: string;
  action: string;
  taskTitle: string;
  taskDueDate: string;
  stakeholderName: string;
  initialResult?: {
    ok: boolean;
    message: string;
    action: string;
  };
}

export function DeadlineRespondClient({
  token,
  action,
  taskTitle,
  taskDueDate,
  stakeholderName,
  initialResult,
}: DeadlineRespondClientProps) {
  if (initialResult) {
    const isBlocked = initialResult.action === "blocked";
    const isConfirm = initialResult.action === "confirm";

    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          initialResult.ok
            ? isBlocked
              ? "bg-red-50 border-red-200"
              : "bg-green-50 border-green-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 ${
            initialResult.ok
              ? isBlocked
                ? "bg-red-500"
                : "bg-green-500"
              : "bg-slate-400"
          }`}
        >
          {initialResult.ok ? (isBlocked ? "⚑" : "✓") : "✗"}
        </div>
        <h3
          className={`font-semibold text-xl mb-2 ${
            initialResult.ok
              ? isBlocked
                ? "text-red-800"
                : "text-green-800"
              : "text-slate-600"
          }`}
        >
          {isConfirm && "Confirmed On Track"}
          {isBlocked && "Task Flagged as Blocked"}
          {!isConfirm && !isBlocked && initialResult.message}
        </h3>
        <p className="text-sm text-slate-500">{initialResult.message}</p>
        {isBlocked && (
          <p className="text-xs text-slate-400 mt-3">
            The project owner has been notified. A team member will follow up to resolve the blocker.
          </p>
        )}
        {isConfirm && (
          <p className="text-xs text-slate-400 mt-3">
            Your response has been recorded. We&apos;ll reach out again closer to the deadline if needed.
          </p>
        )}
      </div>
    );
  }

  if (action === "extend") {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">Request a Deadline Extension</h2>
          <p className="text-sm text-slate-500">
            Hi {stakeholderName} — your request will be reviewed by our AI project management system.
          </p>
        </div>
        <ExtendForm token={token} taskTitle={taskTitle} taskDueDate={taskDueDate} />
      </div>
    );
  }

  return null;
}
