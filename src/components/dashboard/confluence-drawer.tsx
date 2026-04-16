"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, ArrowLeft, Upload, AlertCircle, FileText,
  ExternalLink, Check, Plus, X,
} from "lucide-react";

interface ConfluencePage {
  id: string;
  title: string;
  type: string;
  version: { number: number };
  space: { name: string; key: string };
  body?: { storage?: { value: string } };
  _links?: { webui: string };
}

function htmlToReadable(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

interface ConfluenceDrawerProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_NEW_PAGE = { title: "", content: "" };

export function ConfluenceDrawer({ open, onClose }: ConfluenceDrawerProps) {
  const [pages, setPages] = useState<ConfluencePage[]>([]);
  const [confluenceBase, setConfluenceBase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View existing page
  const [selected, setSelected] = useState<ConfluencePage | null>(null);
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ action: string; url: string } | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  // Create new page
  const [creating, setCreating] = useState(false);
  const [newPage, setNewPage] = useState(DEFAULT_NEW_PAGE);
  const [createLoading, setCreateLoading] = useState(false);
  const [createResult, setCreateResult] = useState<{ url: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (open) loadPages();
  }, [open]);

  async function loadPages() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/confluence?resource=pages");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load Confluence pages");
        return;
      }
      const data = await res.json();
      setPages(data.results ?? []);
      if (data.confluenceBase) setConfluenceBase(data.confluenceBase);
    } catch {
      setError("Could not reach Confluence. Configure in Settings.");
    } finally {
      setLoading(false);
    }
  }

  async function openPage(page: ConfluencePage) {
    setLoading(true);
    try {
      const res = await fetch(`/api/confluence?resource=pages&pageId=${page.id}`);
      if (res.ok) {
        const data = await res.json();
        const fullPage = data.results?.find((p: ConfluencePage) => p.id === page.id) ?? page;
        setSelected(fullPage);
        setEditContent(htmlToReadable(fullPage.body?.storage?.value ?? ""));
      } else {
        setSelected(page);
        setEditContent("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function pushEdits() {
    if (!selected) return;
    setPushing(true);
    setPushResult(null);
    setPushError(null);
    try {
      const res = await fetch("/api/confluence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: selected.title, content: editContent }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setPushError(data.error ?? "Push failed.");
      } else {
        setPushResult({ action: data.action, url: data.pageUrl ?? "" });
        setEditing(false);
        loadPages();
      }
    } catch {
      setPushError("Network error. Please try again.");
    } finally {
      setPushing(false);
    }
  }

  async function createPage() {
    if (!newPage.title.trim()) {
      setCreateError("Title is required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    setCreateResult(null);
    try {
      const res = await fetch("/api/confluence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPage.title.trim(), content: newPage.content }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCreateError(data.error ?? "Failed to create page.");
      } else {
        setCreateResult({ url: data.pageUrl ?? "" });
        setNewPage(DEFAULT_NEW_PAGE);
        setTimeout(() => {
          loadPages();
          setCreating(false);
          setCreateResult(null);
        }, 2000);
      }
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  function resetAndClose() {
    onClose();
    setSelected(null);
    setEditing(false);
    setCreating(false);
    setNewPage(DEFAULT_NEW_PAGE);
    setPushResult(null);
    setPushError(null);
    setCreateResult(null);
    setCreateError(null);
  }

  const drawerTitle = selected
    ? selected.title
    : creating
    ? "Create New Page"
    : "Confluence Pages";

  const drawerSubtitle = selected
    ? `v${selected.version?.number} · ${selected.space?.name}`
    : creating
    ? "Add a fresh page to your Confluence space"
    : `${pages.length} pages`;

  return (
    <Drawer open={open} onClose={resetAndClose} title={drawerTitle} subtitle={drawerSubtitle} width="xl">
      <div className="p-4 md:p-6">

        {/* ── Existing page detail ── */}
        {selected ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { setSelected(null); setEditing(false); setPushResult(null); setPushError(null); }}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <ArrowLeft size={14} /> Back to all pages
              </button>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="sm" disabled={pushing} onClick={pushEdits}>
                      <Upload size={14} /> {pushing ? "Pushing..." : "Push to Confluence"}
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <FileText size={16} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">{selected.title}</p>
                <p className="text-xs text-blue-600">{selected.space?.name} · Version {selected.version?.number}</p>
              </div>
              {selected._links?.webui && confluenceBase && (
                <a
                  href={`${confluenceBase}${selected._links.webui}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline shrink-0"
                >
                  Open <ExternalLink size={11} />
                </a>
              )}
            </div>

            {pushResult && (
              <div className="flex items-center justify-between gap-3 mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-green-700">
                  <Check size={15} className="shrink-0" />
                  <span className="text-sm font-medium">
                    {pushResult.action === "created" ? "Page created" : "Page updated"} in Confluence
                  </span>
                </div>
                {pushResult.url && (
                  <a href={pushResult.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-green-700 font-medium hover:underline shrink-0">
                    Open page <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}

            {pushError && (
              <div className="flex items-center gap-2 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span className="text-sm">{pushError}</span>
              </div>
            )}

            {editing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-[60vh] border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 min-h-60 max-h-[60vh] overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {editContent || <span className="text-gray-400 italic">No content</span>}
                </pre>
              </div>
            )}
          </div>

        ) : creating ? (
          /* ── Create new page form ── */
          <div className="space-y-5">
            <button
              onClick={() => { setCreating(false); setNewPage(DEFAULT_NEW_PAGE); setCreateError(null); setCreateResult(null); }}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft size={14} /> Back to all pages
            </button>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Page Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Project Overview, Meeting Notes, Sprint Plan..."
                value={newPage.title}
                onChange={(e) => setNewPage((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Content{" "}
                <span className="text-gray-400 font-normal">(Markdown supported)</span>
              </label>
              <textarea
                placeholder={"# My Page\n\nWrite your content here...\n\n## Section\n- Point one\n- Point two"}
                value={newPage.content}
                onChange={(e) => setNewPage((p) => ({ ...p, content: e.target.value }))}
                rows={12}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
              />
            </div>

            {createError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700">
                <AlertCircle size={15} className="shrink-0" />
                <span className="text-sm">{createError}</span>
              </div>
            )}

            {createResult && (
              <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-green-700">
                  <Check size={15} className="shrink-0" />
                  <span className="text-sm font-medium">Page created in Confluence!</span>
                </div>
                {createResult.url && (
                  <a href={createResult.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-green-700 font-medium hover:underline shrink-0">
                    Open page <ExternalLink size={13} />
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={createPage} disabled={createLoading || !newPage.title.trim()}>
                {createLoading ? "Creating..." : "Create Page"}
              </Button>
              <Button variant="secondary" onClick={() => { setCreating(false); setNewPage(DEFAULT_NEW_PAGE); setCreateError(null); }}>
                <X size={14} /> Cancel
              </Button>
            </div>
          </div>

        ) : (
          /* ── Pages list ── */
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{pages.length} pages in your Confluence space</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={loadPages} disabled={loading}>
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button size="sm" onClick={() => { setCreating(true); setCreateError(null); setCreateResult(null); }}>
                  <Plus size={14} /> Create Page
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <AlertCircle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCw size={16} className="animate-spin mr-2" /> Loading...
              </div>
            )}

            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => openPage(page)}
                  className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                        {page.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {page.space?.name} · v{page.version?.number}
                      </p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 shrink-0">Page</Badge>
                  </div>
                </button>
              ))}

              {!loading && pages.length === 0 && !error && (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-sm mb-3">No pages found in this space.</p>
                  <Button size="sm" onClick={() => setCreating(true)}>
                    <Plus size={14} /> Create your first page
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
