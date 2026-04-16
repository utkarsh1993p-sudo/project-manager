import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    todo: "bg-slate-100 text-slate-700",
    "in-progress": "bg-blue-100 text-blue-700",
    done: "bg-green-100 text-green-700",
    blocked: "bg-red-100 text-red-700",
    review: "bg-yellow-100 text-yellow-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

// Normalizes any Atlassian domain input to just the subdomain.
// Handles: "company", "company.atlassian.net", "https://company.atlassian.net",
//          "https://company.atlassian.net/wiki/...", etc.
export function normalizeAtlassianDomain(raw: string): string {
  return raw
    .replace(/^https?:\/\//i, "")       // strip protocol
    .replace(/\.atlassian\.net.*$/i, "") // strip .atlassian.net and everything after
    .replace(/\/$/, "")                  // strip trailing slash
    .trim();
}

export function getRiskColor(level: string): string {
  const map: Record<string, string> = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return map[level] ?? "bg-gray-100 text-gray-700";
}
