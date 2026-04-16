"use client";

import { useState } from "react";
import type { Project, WorkspaceDoc } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  FileText, Map, AlertTriangle, ListChecks,
  Upload, Copy, Check, ExternalLink, AlertCircle,
} from "lucide-react";

const DOC_META: Record<
  WorkspaceDoc["type"],
  { icon: React.ElementType; color: string; desc: string }
> = {
  "project-overview": {
    icon: FileText,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    desc: "High-level project summary, scope, and success criteria",
  },
  "stakeholder-map": {
    icon: Map,
    color: "bg-purple-50 border-purple-200 text-purple-700",
    desc: "Who has influence and interest, and how to communicate with them",
  },
  "risk-log": {
    icon: AlertTriangle,
    color: "bg-red-50 border-red-200 text-red-700",
    desc: "All identified risks, their levels, and mitigation strategies",
  },
  "action-plan": {
    icon: ListChecks,
    color: "bg-green-50 border-green-200 text-green-700",
    desc: "Concrete actions, owners, and due dates by phase",
  },
};

interface PushResult {
  action: "created" | "updated";
  url: string;
}

interface WorkspaceTabProps {
  project: Project;
}

export function WorkspaceTab({ project }: WorkspaceTabProps) {
  const [selectedDoc, setSelectedDoc] = useState<WorkspaceDoc | null>(
    project.workspaceDocs[0] ?? null
  );
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function pushToConfluence(doc: WorkspaceDoc) {
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const res = await fetch("/api/confluence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: doc.title, content: doc.content }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPushError(data.error ?? "Failed to push to Confluence.");
        return;
      }
      setPushResult({ action: data.action, url: data.pageUrl ?? "" });
    } catch {
      setPushError("Network error. Is Confluence connected in Settings?");
    } finally {
      setPushing(false);
    }
  }

  function copyContent(content: string) {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Reset push state when switching docs
  function selectDoc(doc: WorkspaceDoc) {
    setSelectedDoc(doc);
    setPushResult(null);
    setPushError(null);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Doc list */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Project Files
          </p>
          {project.workspaceDocs.map((doc) => {
            const meta = DOC_META[doc.type];
            const Icon = meta.icon;
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => selectDoc(doc)}
                className={`w-full text-left rounded-xl border p-3 transition-all ${
                  isSelected
                    ? meta.color + " shadow-sm"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{doc.title}</p>
                    <p className="text-xs opacity-70 mt-0.5">{meta.desc}</p>
                    <p className="text-xs opacity-60 mt-1">
                      Updated {formatDate(doc.lastUpdated)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Doc viewer */}
        {selectedDoc && (
          <div className="flex-1 min-w-0">
            <Card>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{selectedDoc.title}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyContent(selectedDoc.content)}
                  >
                    {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </Button>
                  <Button
                    size="sm"
                    disabled={pushing}
                    onClick={() => pushToConfluence(selectedDoc)}
                  >
                    <Upload size={13} />
                    {pushing ? "Pushing..." : "Push to Confluence"}
                  </Button>
                </div>
              </div>

              {/* Push result banner */}
              {pushResult && (
                <div className="mx-6 mt-4 flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={15} className="shrink-0" />
                    <span className="text-sm font-medium">
                      {pushResult.action === "created" ? "Page created" : "Page updated"} in Confluence
                    </span>
                  </div>
                  {pushResult.url ? (
                    <a
                      href={pushResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-green-700 font-medium hover:underline shrink-0"
                    >
                      Open page <ExternalLink size={13} />
                    </a>
                  ) : (
                    <span className="text-xs text-green-600">Check your Confluence space</span>
                  )}
                </div>
              )}

              {/* Push error banner */}
              {pushError && (
                <div className="mx-6 mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span className="text-sm">{pushError}</span>
                </div>
              )}

              <CardContent className="pt-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                  {selectedDoc.content}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
