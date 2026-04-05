"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WorkspaceDoc } from "@/types";
import {
  Upload,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Settings,
} from "lucide-react";
import Link from "next/link";

const DOC_ICONS: Record<string, React.ElementType> = {
  "project-overview": FileText,
  "stakeholder-map": FileText,
  "risk-log": FileText,
  "action-plan": FileText,
};

interface ConfluencePanelProps {
  docs: WorkspaceDoc[];
}

type SyncStatus = "idle" | "pushing" | "success" | "error";

export function ConfluencePanel({ docs }: ConfluencePanelProps) {
  const [statuses, setStatuses] = useState<Record<string, SyncStatus>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [connected, setConnected] = useState<boolean | null>(null);

  async function pushDoc(doc: WorkspaceDoc) {
    setStatuses((s) => ({ ...s, [doc.id]: "pushing" }));
    setMessages((m) => ({ ...m, [doc.id]: "" }));

    try {
      const res = await fetch("/api/confluence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.title,
          content: doc.content,
        }),
      });

      if (res.status === 400) {
        setConnected(false);
        setStatuses((s) => ({ ...s, [doc.id]: "error" }));
        setMessages((m) => ({ ...m, [doc.id]: "Confluence not connected" }));
        return;
      }

      const data = await res.json();
      if (data.page) {
        setConnected(true);
        setStatuses((s) => ({ ...s, [doc.id]: "success" }));
        setMessages((m) => ({
          ...m,
          [doc.id]: data.action === "created" ? "Created in Confluence" : "Updated in Confluence",
        }));
      } else {
        throw new Error("No page returned");
      }
    } catch {
      setStatuses((s) => ({ ...s, [doc.id]: "error" }));
      setMessages((m) => ({ ...m, [doc.id]: "Push failed" }));
    }
  }

  async function pushAllDocs() {
    for (const doc of docs) {
      await pushDoc(doc);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Confluence Sync</h3>
          <p className="text-xs text-gray-500">
            Push workspace docs to Confluence pages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected === false && (
            <Link href="/settings">
              <Button variant="secondary" size="sm">
                <Settings size={14} /> Connect Confluence
              </Button>
            </Link>
          )}
          <Button size="sm" onClick={pushAllDocs}>
            <Upload size={14} /> Push All Docs
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700">
          <strong>How it works:</strong> Each workspace doc (Project Overview, Stakeholder Map, Risk Log, Action Plan) is pushed as a Confluence page in your configured space. If the page already exists, it's updated.
        </p>
      </div>

      {/* Docs list */}
      <div className="space-y-3">
        {docs.map((doc) => {
          const Icon = DOC_ICONS[doc.type] ?? FileText;
          const status = statuses[doc.id] ?? "idle";
          const msg = messages[doc.id] ?? "";

          return (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-blue-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.content.split("\n").length} lines · Last updated{" "}
                      {new Date(doc.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {status === "success" && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle2 size={13} /> {msg}
                      </span>
                    )}
                    {status === "error" && (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle size={13} /> {msg}
                      </span>
                    )}
                    <Badge
                      className={
                        status === "success"
                          ? "bg-green-100 text-green-700"
                          : status === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {status === "pushing"
                        ? "Pushing..."
                        : status === "success"
                        ? "Synced"
                        : status === "error"
                        ? "Failed"
                        : "Not synced"}
                    </Badge>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={status === "pushing"}
                      onClick={() => pushDoc(doc)}
                    >
                      <Upload size={12} />
                      Push
                    </Button>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pull from Confluence */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Pull from Confluence</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Import existing Confluence pages into your workspace docs
              </p>
            </div>
            <Button variant="secondary" size="sm">
              <Download size={14} /> Browse Pages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
